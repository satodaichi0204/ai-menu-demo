// Claude に献立を選んでもらう（サーバー側だけで使う）。
//
// 安全のための考え方：
// - アレルゲンを含む料理と、調理時間を超える料理は、プログラムで先に候補から外す。Claude には外した後の候補だけを渡す。
// - Claude の答えは決まった形（JSON）で受け取り、プログラムでもう一度検証する（存在しない料理、枠の違い、アレルゲン）。
// - 検証に通らない、断られた、通信に失敗した、といった場合は例外を投げ、呼び出し側がルールの献立に切り替える。
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  AGE_GROUPS,
  CUISINES,
  GOALS,
  PROTEINS,
  type Feedback,
  type Household,
  type Plan,
  type Recipe,
} from "./domain.ts";
import { addDays, candidates, dinnerTargets, profileOf, reasonsFor, validateDay, weekSummary } from "./planner.ts";
import { RECIPE_BY_ID } from "./recipes.ts";

export const AI_MODEL = "claude-opus-5-5";

const AiPlanSchema = z.object({
  days: z.array(
    z.object({
      main: z.string().describe("主菜のID（例：m01）"),
      side: z.string().describe("副菜のID（例：s01）"),
      soup: z.string().describe("汁物のID（例：p01）"),
      reason: z.string().describe("この日の献立を選んだ理由。家族の名前と目標にふれて、60字以内の日本語で"),
    }),
  ),
  summary: z.string().describe("1週間の献立の考え方。120字以内の日本語で"),
});

const SYSTEM = `あなたは、家族の健康を毎日の夕食から整えるための献立を考える、管理栄養士のアシスタントです。
渡された候補の料理だけを使い、7日分の夕食（主菜・副菜・汁物を1品ずつ）を選んでください。

選び方：
- 家族一人ひとりの健康目標に合う料理を優先し、1日の3品の組み合わせで目標を満たすようにする（例：減塩なら3品の塩分の合計を抑える）。
- 苦手な食材を含む料理は、ほかに候補があれば使わない。
- 同じ主菜を1週間に2回使わない。前日と同じ種類のたんぱく質（鶏肉、魚など）の主菜が続かないようにする。
- 副菜と汁物も、できるだけ同じ料理を繰り返さない。主菜と和洋中を合わせる。
- 家族が「好評」とした料理は入れやすく、「不評」とした料理は使わない。
- 候補はすでにアレルギーと調理時間で絞り込み済みです。候補にないIDは使わないでください。`;

function recipeLine(r: Recipe): string {
  const flags = [r.soft && "やわらかい", r.kid && "子ども向け", r.iron && "鉄分", r.calcium && "カルシウム"]
    .filter(Boolean)
    .join("・");
  return `${r.id}｜${r.name}｜${CUISINES[r.cuisine]}｜${PROTEINS[r.protein]}｜${r.minutes}分｜${r.kcal}kcal たんぱく質${r.proteinG}g 糖質${r.carbG}g 塩分${r.saltG}g 野菜${r.vegG}g${flags ? `｜${flags}` : ""}`;
}

export function buildPrompt(h: Household, feedback?: Feedback): string {
  const p = profileOf(h);
  const t = dinnerTargets(p);
  const members = h.members
    .map((m) => {
      const parts = [`${m.name}（${AGE_GROUPS[m.ageGroup].short}）`];
      if (m.goals.length) parts.push(`目標：${m.goals.map((g) => GOALS[g]).join("、")}`);
      if (m.dislikes.length) parts.push(`苦手：${m.dislikes.join("、")}`);
      return `- ${parts.join("／")}`;
    })
    .join("\n");
  const rated = (v: "good" | "bad") =>
    Object.entries(feedback?.ratings ?? {})
      .filter(([, r]) => r === v)
      .map(([id]) => RECIPE_BY_ID[id]?.name)
      .filter(Boolean)
      .join("、") || "なし";
  return `## 家族
${members}

## 1回の夕食（大人1人分）の目安
塩分${t.saltMax}g以下、野菜${t.vegMin}g以上、たんぱく質${t.proteinMin}g以上、${t.kcalMax}kcal以下

## 家族の評価
好評：${rated("good")}
不評：${rated("bad")}

## 候補の料理（ID｜料理名｜種類｜たんぱく質源｜調理時間｜大人1人分の栄養｜特徴）
### 主菜
${candidates(p, "main").map(recipeLine).join("\n")}
### 副菜
${candidates(p, "side").map(recipeLine).join("\n")}
### 汁物
${candidates(p, "soup").map(recipeLine).join("\n")}`;
}

export async function planWithClaude(
  h: Household,
  opts: { start: string; seed: number; feedback?: Feedback },
): Promise<Plan> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: AI_MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { effort: "medium", format: zodOutputFormat(AiPlanSchema) },
    messages: [{ role: "user", content: buildPrompt(h, opts.feedback) }],
  });
  if (response.stop_reason === "refusal") throw new Error("AI が献立の作成を見送りました");
  const out = response.parsed_output;
  if (!out) throw new Error("AI の回答を読み取れませんでした");
  if (out.days.length < 7) throw new Error("AI の献立が7日分ありません");

  const p = profileOf(h);
  const days = out.days.slice(0, 7).map((d, n) => {
    const problem = validateDay(p, d);
    if (problem) throw new Error(`AI の献立に問題がありました：${problem}`);
    const prev = n > 0 ? RECIPE_BY_ID[out.days[n - 1].main] : undefined;
    // AI の理由に、プログラムで計算した数値の理由を添える
    const facts = reasonsFor(h, p, d, prev).filter((x) => !x.startsWith("変化：") && !x.startsWith("時間："));
    return {
      date: addDays(opts.start, n),
      main: d.main,
      side: d.side,
      soup: d.soup,
      reasons: [`AI：${d.reason}`, ...facts],
    };
  });
  if (new Set(days.map((d) => d.main)).size < 7) throw new Error("AI の献立で主菜が重複しました");
  return {
    createdAt: new Date().toISOString(),
    seed: opts.seed,
    mode: "ai",
    days,
    summary: [`AI：${out.summary}`, ...weekSummary(h, p, days)],
  };
}
