import { describe, expect, it } from "vitest";
import type { Plan } from "./domain";
import { buildShoppingList, formatAmount, roundAmount } from "./shopping";

const plan = (days: [string, string, string][]): Plan => ({
  createdAt: "",
  seed: 1,
  mode: "rules",
  summary: [],
  days: days.map(([main, side, soup], i) => ({ date: `2026-10-${16 + i}`, main, side, soup, reasons: [] })),
});

describe("buildShoppingList", () => {
  it("同じ材料を合算し、人数分に換算する", () => {
    // m01 鶏むね肉 100g、m24 鶏むね肉 100g。2.5人分で 500g
    const list = buildShoppingList(
      plan([
        ["m01", "s04", "p07"],
        ["m24", "s04", "p07"],
      ]),
      2.5,
    );
    const chicken = list.find((x) => x.name === "鶏むね肉");
    expect(chicken?.amount).toBe(500);
    expect(chicken?.usedIn).toEqual(["鶏むね肉の塩レモン焼き", "鶏むね肉のチーズパン粉焼き"]);
    // きゅうり（s04 50g）は2日分で 100g × 2.5 = 250g
    expect(list.find((x) => x.name === "きゅうり")?.amount).toBe(250);
  });

  it("日を選ぶと、その日の分だけになる", () => {
    const p = plan([
      ["m01", "s04", "p07"],
      ["m24", "s04", "p07"],
    ]);
    expect(buildShoppingList(p, 1, [1]).find((x) => x.name === "鶏むね肉")?.amount).toBe(100);
  });

  it("野菜、肉、魚介…調味料の順に並べる", () => {
    const list = buildShoppingList(plan([["m02", "s01", "p01"]]), 1);
    const cats = list.map((x) => x.category);
    expect(cats.indexOf("veg")).toBeLessThan(cats.indexOf("fish"));
    expect(cats.lastIndexOf("seasoning")).toBe(cats.length - 1);
  });
});

describe("roundAmount / formatAmount", () => {
  it("見やすい単位で丸める", () => {
    expect(roundAmount(123, "g")).toBe(130);
    expect(roundAmount(42.3, "g")).toBe(43);
    expect(roundAmount(1.2, "大さじ")).toBe(1.5);
    expect(roundAmount(0.75, "個")).toBe(1);
  });

  it("量を日本語で表す", () => {
    expect(formatAmount(320, "g")).toBe("320g");
    expect(formatAmount(1.5, "個")).toBe("1.5個");
    expect(formatAmount(2, "大さじ")).toBe("大さじ2");
  });
});
