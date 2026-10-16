// 献立の作成。ANTHROPIC_API_KEY が設定されていれば Claude が選び、なければルールで組み立てる。
// AI が使えなかった場合も、ルールの献立に切り替えて必ず返す。
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
  feedback: z
    .object({
      ratings: z.record(z.string(), z.enum(["good", "bad"])),
      cooked: z.record(z.string(), z.boolean()),
      notes: z.record(z.string(), z.string().max(400)),
    })
    .optional(),
});

// 公開デモで AI の費用がかさまないよう、送信元ごとに回数を制限する（1つのサーバーの中での簡易な制限）
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = Number(process.env.AI_REQUESTS_PER_HOUR ?? 5);
const hits = new Map<string, number[]>();
function allowAi(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return false;
  hits.set(ip, [...recent, now]);
  return true;
}

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "入力の形式が正しくありません" }, { status: 400 });
  const { start, seed, feedback } = parsed.data;
  const household = parsed.data.household as Household;

  const rules = () => planWeek(household, { start, seed, feedback });
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ plan: rules(), note: null });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!allowAi(ip)) {
      const plan = { ...rules(), mode: "ai-fallback" as const };
      return Response.json({ plan, note: "AIの利用回数の上限に達したため、今回はルールで献立を組み立てました" });
    }
    try {
      return Response.json({ plan: await planWithClaude(household, { start, seed, feedback }), note: null });
    } catch (e) {
      const reason =
        e instanceof Anthropic.RateLimitError
          ? "AIが混み合っていたため"
          : e instanceof Anthropic.APIError
            ? "AIに接続できなかったため"
            : "AIの献立が条件に合わなかったため";
      console.error("AI plan failed:", e);
      const plan = { ...rules(), mode: "ai-fallback" as const };
      return Response.json({ plan, note: `${reason}、ルールで献立を組み立てました` });
    }
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 422 });
  }
}
