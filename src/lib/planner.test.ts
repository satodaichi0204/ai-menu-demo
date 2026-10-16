import { describe, expect, it } from "vitest";
import { ALLERGEN_CODES, GOAL_CODES, type Household } from "./domain";
import {
  candidates,
  dayTotals,
  dinnerTargets,
  dislikedBy,
  planWeek,
  profileOf,
  swapDish,
  validateDay,
} from "./planner";
import { RECIPE_BY_ID, RECIPES } from "./recipes";
import { SAMPLE_HOUSEHOLD } from "./sample";

const START = "2026-10-16";
const base = (over: Partial<Household> = {}): Household => ({
  name: "テスト",
  cookingMinutes: 45,
  members: [{ id: "a", name: "A", ageGroup: "adult", goals: [], allergens: [], dislikes: [] }],
  ...over,
});
const dishes = (plan: ReturnType<typeof planWeek>) =>
  plan.days.flatMap((d) => [d.main, d.side, d.soup]).map((id) => RECIPE_BY_ID[id]);

// 乱数の種から、いろいろな世帯を作る
function randomHousehold(seed: number): Household {
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const some = <T>(xs: readonly T[], p: number) => xs.filter(() => rnd() < p);
  return {
    name: `世帯${seed}`,
    cookingMinutes: ([20, 30, 45] as const)[Math.floor(rnd() * 3)],
    members: Array.from({ length: 1 + Math.floor(rnd() * 4) }, (_, k) => ({
      id: `m${k}`,
      name: `人${k}`,
      ageGroup: (["toddler", "child", "teen", "adult", "senior"] as const)[Math.floor(rnd() * 5)],
      goals: some(GOAL_CODES, 0.25),
      allergens: some(["egg", "milk", "shrimp", "crab", "walnut", "buckwheat", "peanut"] as const, 0.2),
      dislikes: some(["ピーマン", "なす", "魚", "トマト"], 0.2),
    })),
  };
}

describe("planWeek", () => {
  it("7日分の主菜・副菜・汁物を、正しい枠の料理で作る", () => {
    const plan = planWeek(SAMPLE_HOUSEHOLD, { start: START, seed: 1 });
    expect(plan.days).toHaveLength(7);
    expect(plan.days.map((d) => d.date)).toEqual([
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
    ]);
    for (const d of plan.days) {
      expect(RECIPE_BY_ID[d.main].course).toBe("main");
      expect(RECIPE_BY_ID[d.side].course).toBe("side");
      expect(RECIPE_BY_ID[d.soup].course).toBe("soup");
      expect(d.reasons.length).toBeGreaterThan(0);
    }
  });

  it("アレルゲンを含む料理は、どんな世帯・どんな種でも入らない（300通りで確認）", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const h = randomHousehold(seed);
      const p = profileOf(h);
      let plan;
      try {
        plan = planWeek(h, { start: START, seed });
      } catch {
        continue; // 条件が厳しすぎて候補がない世帯は、エラーで知らせる（別のテストで確認）
      }
      for (const r of dishes(plan)) {
        expect(
          r.allergens.filter((a) => p.allergens.includes(a)),
          `${h.name} ${r.name}`,
        ).toEqual([]);
      }
    }
  });

  it("サンプル世帯（卵アレルギーあり）の1週間に、卵を使う料理は1つもない", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const plan = planWeek(SAMPLE_HOUSEHOLD, { start: START, seed });
      expect(dishes(plan).filter((r) => r.allergens.includes("egg"))).toEqual([]);
    }
  });

  it("同じ週に同じ主菜を出さず、2日続けて同じ種類のたんぱく質にしにくい", () => {
    let consecutive = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const plan = planWeek(base(), { start: START, seed });
      const mains = plan.days.map((d) => RECIPE_BY_ID[d.main]);
      expect(new Set(mains.map((r) => r.id)).size).toBe(7);
      mains.forEach((r, i) => i > 0 && r.protein === mains[i - 1].protein && consecutive++);
    }
    // 50週×6回の並びのうち、続くのは1割未満
    expect(consecutive / (50 * 6)).toBeLessThan(0.1);
  });

  it("苦手な食材は、ほかに候補があれば避ける", () => {
    const h = base({
      members: [{ id: "a", name: "A", ageGroup: "adult", goals: [], allergens: [], dislikes: ["ピーマン", "なす"] }],
    });
    for (let seed = 1; seed <= 30; seed++) {
      const plan = planWeek(h, { start: START, seed });
      expect(
        dishes(plan)
          .filter((r) => dislikedBy(h, r).length > 0)
          .map((r) => r.name),
      ).toEqual([]);
    }
  });

  it("「魚」が苦手なら、魚の主菜を避ける", () => {
    const h = base({
      members: [{ id: "a", name: "A", ageGroup: "adult", goals: [], allergens: [], dislikes: ["魚"] }],
    });
    const plan = planWeek(h, { start: START, seed: 3 });
    expect(plan.days.map((d) => RECIPE_BY_ID[d.main].protein)).not.toContain("fish");
  });

  it("減塩の目標があると、1週間の平均の塩分が下がる", () => {
    const avgSalt = (h: Household) => {
      let total = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const plan = planWeek(h, { start: START, seed });
        total += plan.days.reduce((n, d) => n + dayTotals(d).saltG, 0) / 7;
      }
      return total / 30;
    };
    const normal = avgSalt(base());
    const lowSalt = avgSalt(
      base({ members: [{ id: "a", name: "A", ageGroup: "adult", goals: ["low_salt"], allergens: [], dislikes: [] }] }),
    );
    expect(lowSalt).toBeLessThan(normal - 0.3);
  });

  it("減塩の目標がある世帯（サンプル）では、6割以上の日で夕食の塩分が目安以内になる", () => {
    const target = dinnerTargets(profileOf(SAMPLE_HOUSEHOLD)).saltMax;
    let within = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const plan = planWeek(SAMPLE_HOUSEHOLD, { start: START, seed });
      within += plan.days.filter((d) => dayTotals(d).saltG <= target).length;
      // 目安を超える日には、減らし方のヒントを出す
      for (const d of plan.days) {
        if (dayTotals(d).saltG > target) expect(d.reasons.some((x) => x.startsWith("減塩のヒント"))).toBe(true);
      }
    }
    expect(within / (50 * 7)).toBeGreaterThan(0.6);
  });

  it("調理時間の上限を超える主菜は使わない", () => {
    const plan = planWeek(base({ cookingMinutes: 15 }), { start: START, seed: 5 });
    for (const d of plan.days) expect(RECIPE_BY_ID[d.main].minutes).toBeLessThanOrEqual(15);
  });

  it("「不評」をつけた料理は出にくくなる", () => {
    const first = planWeek(base(), { start: START, seed: 7 });
    const bad = first.days[0].main;
    const again = planWeek(base(), {
      start: START,
      seed: 7,
      feedback: { ratings: { [bad]: "bad" }, cooked: {}, notes: {} },
    });
    expect(again.days.map((d) => d.main)).not.toContain(bad);
  });

  it("同じ条件と同じ種なら、同じ献立になる", () => {
    const a = planWeek(SAMPLE_HOUSEHOLD, { start: START, seed: 42 });
    const b = planWeek(SAMPLE_HOUSEHOLD, { start: START, seed: 42 });
    expect(a.days).toEqual(b.days);
  });

  it("すべてのアレルゲンを持つ世帯など、候補がないときはエラーで知らせる", () => {
    const h = base({
      members: [{ id: "a", name: "A", ageGroup: "adult", goals: [], allergens: [...ALLERGEN_CODES], dislikes: [] }],
      cookingMinutes: 15,
    });
    expect(() => planWeek(h, { start: START, seed: 1 })).toThrow("条件に合う料理が足りません");
  });
});

describe("swapDish", () => {
  it("指定した1品だけを、アレルゲンを含まない別の料理に入れ替える", () => {
    const plan = planWeek(SAMPLE_HOUSEHOLD, { start: START, seed: 1 });
    const swapped = swapDish(SAMPLE_HOUSEHOLD, plan, 2, "side");
    expect(swapped.days[2].side).not.toBe(plan.days[2].side);
    expect(swapped.days[2].main).toBe(plan.days[2].main);
    expect(swapped.days[2].soup).toBe(plan.days[2].soup);
    expect(RECIPE_BY_ID[swapped.days[2].side].allergens).not.toContain("egg");
    expect(swapped.days.filter((_, i) => i !== 2)).toEqual(plan.days.filter((_, i) => i !== 2));
  });
});

describe("validateDay", () => {
  it("アレルゲン、存在しない料理、枠の違いを見つける", () => {
    const p = profileOf(SAMPLE_HOUSEHOLD);
    expect(validateDay(p, { main: "m01", side: "s01", soup: "p01" })).toBeNull();
    expect(validateDay(p, { main: "m15", side: "s01", soup: "p01" })).toContain("アレルゲン");
    expect(validateDay(p, { main: "x99", side: "s01", soup: "p01" })).toContain("存在しない");
    expect(validateDay(p, { main: "s01", side: "s02", soup: "p01" })).toContain("枠");
  });
});

describe("レシピのデータ", () => {
  it("IDが重複せず、主菜24・副菜18・汁物10がある", () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    expect(RECIPES.filter((r) => r.course === "main")).toHaveLength(24);
    expect(RECIPES.filter((r) => r.course === "side")).toHaveLength(18);
    expect(RECIPES.filter((r) => r.course === "soup")).toHaveLength(10);
  });

  it("材料にバター・牛乳・チーズ・卵・小麦粉・えびなどがあれば、アレルゲンにも入っている", () => {
    const rules: [RegExp, string][] = [
      [/バター|牛乳|チーズ/, "milk"],
      [/^卵$|マヨネーズ/, "egg"],
      [/小麦粉|パン粉/, "wheat"],
      [/えび/, "shrimp"],
      [/しょうゆ|みそ|豆腐|厚揚げ|油揚げ|めんつゆ|ポン酢/, "soy"],
    ];
    for (const r of RECIPES) {
      for (const ing of r.ingredients) {
        for (const [re, allergen] of rules) {
          if (re.test(ing.name)) expect(r.allergens, `${r.name}の${ing.name}`).toContain(allergen);
        }
      }
    }
  });

  it("サンプル世帯でも、どの枠にも候補がある", () => {
    const p = profileOf(SAMPLE_HOUSEHOLD);
    expect(candidates(p, "main").length).toBeGreaterThanOrEqual(7);
    expect(candidates(p, "side").length).toBeGreaterThanOrEqual(7);
    expect(candidates(p, "soup").length).toBeGreaterThanOrEqual(5);
  });
});
