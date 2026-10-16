// 献立の作成。
// - ai: true のときだけ、Claude が選ぶ（ANTHROPIC_API_KEY が必要）。それ以外はルールで組み立てる（無料・すぐ）。
// - 公開デモで AI の費用がかさまないよう、送信元ごとの1日の回数と、使った金額の上限を設ける。
// - AI が使えなかった場合も、ルールの献立に切り替えて必ず返す。
//
// 注意：回数と金額の記録はサーバーのメモリの中だけ（サーバーが再起動すると戻る）。
// 確実な上限は、Anthropic のコンソールで月の利用上限を設定して守る。本番ではデータベースで管理する。
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { planWithClaude } from "@/lib/ai";
import { AGE_GROUP_CODES, ALLERGEN_CODES, GOAL_CODES, type Household } from "@/lib/domain";
import { planWeek } from "@/lib/planner";

const HouseholdSchema = z.object({
  name: z.string().max(40),
  cookingMinutes: z.union([z.literal(15), z.literal(20), z.literal(30), z.literal(45)]),
  members: z
    .array(
      z.object({
        id: z.string().max(40),
        name: z.string().min(1).max(20),
        ageGroup: z.enum(AGE_GROUP_CODES as [string, ...string[]]),
        goals: z.array(z.enum(GOAL_CODES as [string, ...string[]])).max(8),
        allergens: z.array(z.enum(ALLERGEN_CODES as [string, ...string[]])).max(9),
        dislikes: z.array(z.string().max(20)).max(10),
      }),
    )
    .min(1)
    .max(8),
});

const BodySchema = z.object({
  household: HouseholdSchema,
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seed: z.number().int(),
  ai: z.boolean().optional(),
  feedback: z
    .object({
      ratings: z.record(z.string(), z.enum(["good", "bad"])),
      cooked: z.record(z.string(), z.boolean()),
      notes: z.record(z.string(), z.string().max(400)),
    })
    .optional(),
});

const PER_DAY = Number(process.env.AI_REQUESTS_PER_DAY ?? 3);
const BUDGET_USD = Number(process.env.AI_BUDGET_USD ?? 3);
const DAY_MS = 24 * 60 * 60 * 1000;
const hits = new Map<string, number[]>();
let spentUsd = 0;

const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
const recentHits = (ip: string) => (hits.get(ip) ?? []).filter((t) => Date.now() - t < DAY_MS);

function aiStatus(ip: string) {
  const enabled = Boolean(process.env.ANTHROPIC_API_KEY);
  const remaining = Math.max(0, PER_DAY - recentHits(ip).length);
  const budgetLeft = spentUsd < BUDGET_USD;
  return { enabled, remaining: budgetLeft ? remaining : 0, perDay: PER_DAY, budgetLeft };
}

/** 画面が「AIで作る」ボタンを出すか、残り回数をいくつにするかを決めるために使う */
export async function GET(req: Request) {
  return Response.json(aiStatus(ipOf(req)));
}

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "入力の形式が正しくありません" }, { status: 400 });
  const { start, seed, feedback, ai } = parsed.data;
  const household = parsed.data.household as Household;
  const ip = ipOf(req);

  const rules = (mode: "rules" | "ai-fallback" = "rules") => ({
    ...planWeek(household, { start, seed, feedback }),
    mode,
  });
  try {
    if (!ai || !process.env.ANTHROPIC_API_KEY) {
      return Response.json({ plan: rules(), note: null, status: aiStatus(ip) });
    }
    const status = aiStatus(ip);
    if (!status.budgetLeft) {
      return Response.json({
        plan: rules("ai-fallback"),
        note: "デモで使えるAIの費用の上限に達したため、ルールで献立を組み立てました",
        status,
      });
    }
    if (status.remaining <= 0) {
      return Response.json({
        plan: rules("ai-fallback"),
        note: `AIは1日${PER_DAY}回までです。今回はルールで献立を組み立てました`,
        status,
      });
    }
    hits.set(ip, [...recentHits(ip), Date.now()]);
    try {
      const plan = await planWithClaude(household, { start, seed, feedback, onCost: (usd) => (spentUsd += usd) });
      return Response.json({ plan, note: null, status: aiStatus(ip) });
    } catch (e) {
      const reason =
        e instanceof Anthropic.RateLimitError
          ? "AIが混み合っていたため"
          : e instanceof Anthropic.APIError
            ? "AIに接続できなかったため"
            : "AIの献立が条件に合わなかったため";
      console.error("AI plan failed:", e);
      return Response.json({
        plan: rules("ai-fallback"),
        note: `${reason}、ルールで献立を組み立てました`,
        status: aiStatus(ip),
      });
    }
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 422 });
  }
}
