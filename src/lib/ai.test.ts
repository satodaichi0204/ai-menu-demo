// Claude を呼ぶ部分のテスト。実際の API は呼ばず、SDK の応答を差し替えて、検証のロジックを確かめる。
import { beforeEach, describe, expect, it, vi } from "vitest";

const parse = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse };
  },
}));

const { buildPrompt, planWithClaude, AI_MODEL } = await import("./ai");
const { SAMPLE_HOUSEHOLD } = await import("./sample");

const START = "2026-10-16";
const goodDays = [
  ["m01", "s04", "p07"],
  ["m02", "s01", "p01"],
  ["m04", "s02", "p03"],
  ["m12", "s05", "p05"],
  ["m19", "s14", "p08"],
  ["m22", "s06", "p09"],
  ["m06", "s07", "p02"],
].map(([main, side, soup]) => ({ main, side, soup, reason: "テストの理由" }));
const reply = (days = goodDays, stop = "end_turn") => ({
  stop_reason: stop,
  usage: { input_tokens: 4000, output_tokens: 1800 },
  parsed_output: { days, summary: "テストのまとめ" },
});

beforeEach(() => parse.mockReset());

describe("buildPrompt", () => {
  it("家族の目標と苦手を伝え、アレルゲンを含む料理を候補に入れない", () => {
    const prompt = buildPrompt(SAMPLE_HOUSEHOLD);
    expect(prompt).toContain("たかし（大人）／目標：減塩、体重管理");
    expect(prompt).toContain("苦手：ピーマン");
    // はなさんは卵アレルギー。卵を使う料理（えびと卵の炒め物、かきたま汁など）は候補にない
    expect(prompt).not.toContain("えびと卵の炒め物");
    expect(prompt).not.toContain("かきたま汁");
    expect(prompt).toContain("鶏むね肉の塩レモン焼き");
  });
});

describe("planWithClaude", () => {
  it("正しい回答なら、AI の理由とプログラムの計算を合わせた献立を返す", async () => {
    parse.mockResolvedValue(reply());
    const plan = await planWithClaude(SAMPLE_HOUSEHOLD, { start: START, seed: 1 });
    expect(plan.mode).toBe("ai");
    expect(plan.days).toHaveLength(7);
    expect(plan.days[0].reasons[0]).toBe("AI：テストの理由");
    expect(plan.days[0].date).toBe(START);
    expect(plan.summary[0]).toBe("AI：テストのまとめ");
    expect(parse.mock.calls[0][0].model).toBe(AI_MODEL);
  });

  it("AI がアレルゲンを含む料理を選んだら、採用しない", async () => {
    const days = [...goodDays];
    days[3] = { ...days[3], main: "m15" }; // えびと卵の炒め物（卵）
    parse.mockResolvedValue(reply(days));
    await expect(planWithClaude(SAMPLE_HOUSEHOLD, { start: START, seed: 1 })).rejects.toThrow("アレルゲン");
  });

  it("存在しない料理や、主菜の重複は採用しない", async () => {
    parse.mockResolvedValue(reply([{ ...goodDays[0], side: "s99" }, ...goodDays.slice(1)]));
    await expect(planWithClaude(SAMPLE_HOUSEHOLD, { start: START, seed: 1 })).rejects.toThrow("存在しない");
    parse.mockResolvedValue(reply([...goodDays.slice(0, 6), { ...goodDays[6], main: "m01" }]));
    await expect(planWithClaude(SAMPLE_HOUSEHOLD, { start: START, seed: 1 })).rejects.toThrow("重複");
  });

  it("断られた場合や、7日分に足りない場合は採用しない", async () => {
    parse.mockResolvedValue(reply(goodDays, "refusal"));
    await expect(planWithClaude(SAMPLE_HOUSEHOLD, { start: START, seed: 1 })).rejects.toThrow("見送り");
    parse.mockResolvedValue(reply(goodDays.slice(0, 3)));
    await expect(planWithClaude(SAMPLE_HOUSEHOLD, { start: START, seed: 1 })).rejects.toThrow("7日分");
  });
});
