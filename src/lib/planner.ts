// ルールで1週間分の夕食の献立（主菜・副菜・汁物）を組み立てる。
// AI（Claude）を使う場合も、候補の絞り込み（アレルギーの除外、調理時間）と栄養の計算はここで行い、
// AI の選択結果もこのファイルの関数で検証する。アレルギーの判断は AI に任せない。
import {
  ALLERGENS,
  AGE_GROUPS,
  GOALS,
  PROTEINS,
  type Allergen,
  type Course,
  type DayPlan,
  type Feedback,
  type Goal,
  type Household,
  type Plan,
  type Recipe,
} from "./domain.ts";
import { RECIPES, RECIPE_BY_ID } from "./recipes.ts";

// ---------------------------------------------------------------------------
// 世帯の条件
// ---------------------------------------------------------------------------
export type HouseholdProfile = {
  allergens: Allergen[];
  /** 目標ごとの人数 */
  goalWeights: Partial<Record<Goal, number>>;
  /** 目標ごとの該当者の名前 */
  goalMembers: Partial<Record<Goal, string[]>>;
  hasKids: boolean;
  /** 材料を何人分用意するか（年代による量の目安の合計） */
  servings: number;
  maxMainMinutes: number;
  maxSubMinutes: number;
};

export function profileOf(h: Household): HouseholdProfile {
  const goalWeights: HouseholdProfile["goalWeights"] = {};
  const goalMembers: HouseholdProfile["goalMembers"] = {};
  for (const m of h.members) {
    for (const g of m.goals) {
      goalWeights[g] = (goalWeights[g] ?? 0) + 1;
      goalMembers[g] = [...(goalMembers[g] ?? []), m.name];
    }
  }
  return {
    allergens: Array.from(new Set(h.members.flatMap((m) => m.allergens))),
    goalWeights,
    goalMembers,
    hasKids: h.members.some((m) => m.ageGroup === "toddler" || m.ageGroup === "child"),
    servings: Math.round(h.members.reduce((n, m) => n + AGE_GROUPS[m.ageGroup].portion, 0) * 10) / 10,
    maxMainMinutes: h.cookingMinutes,
    maxSubMinutes: Math.max(10, Math.floor(h.cookingMinutes / 2)),
  };
}

/** 苦手な食材が入っているか（料理名、材料名、「魚」「肉」などの大まかな指定に対応） */
export function dislikedBy(h: Household, r: Recipe): string[] {
  const names = new Set<string>();
  for (const m of h.members) {
    for (const raw of m.dislikes) {
      const d = raw.trim();
      if (!d) continue;
      const hit =
        r.name.includes(d) ||
        r.ingredients.some((x) => x.name.includes(d)) ||
        (d === "魚" && r.protein === "fish") ||
        (d === "肉" && ["chicken", "pork", "beef"].includes(r.protein)) ||
        (PROTEINS[r.protein] as string) === d;
      if (hit) names.add(m.name);
    }
  }
  return [...names];
}

/** 世帯の誰かのアレルゲンを含むか */
export function hasAllergen(p: HouseholdProfile, r: Recipe): boolean {
  return r.allergens.some((a) => p.allergens.includes(a));
}

/** その枠で使える料理（アレルゲンを含まず、調理時間に収まる） */
export function candidates(p: HouseholdProfile, course: Course): Recipe[] {
  const max = course === "main" ? p.maxMainMinutes : p.maxSubMinutes;
  return RECIPES.filter((r) => r.course === course && !hasAllergen(p, r) && r.minutes <= max);
}

// ---------------------------------------------------------------------------
// 点数づけ
// ---------------------------------------------------------------------------
function goalScore(p: HouseholdProfile, r: Recipe, course: Course): number {
  const scale = course === "main" ? 1 : 0.6;
  let s = 0;
  const w = p.goalWeights;
  const lim =
    course === "main"
      ? { salt: [1.4, 1.8], kcal: [260, 350], veg: [100, 40] }
      : { salt: [0.5, 0.9], kcal: [60, 110], veg: [70, 30] };
  // 減塩：塩分が少ないほど点数が上がる（目安の上限 lim.salt[1] を超えると下がる）
  if (w.low_salt)
    s += w.low_salt * Math.max(-2, Math.min(2.5, ((lim.salt[1] - r.saltG) / (lim.salt[1] - lim.salt[0])) * 1.5));
  if (w.low_carb)
    s +=
      w.low_carb *
      (r.carbG <= (course === "main" ? 10 : 5) ? 1.5 : r.carbG >= (course === "main" ? 25 : 15) ? -1.5 : 0);
  if (w.high_protein)
    s +=
      w.high_protein *
      (r.proteinG >= (course === "main" ? 22 : 4) ? 1.5 : r.proteinG < (course === "main" ? 15 : 2) ? -1 : 0);
  if (w.weight) s += w.weight * (r.kcal <= lim.kcal[0] ? 1.5 : r.kcal >= lim.kcal[1] ? -1.5 : 0);
  if (w.vegetables) s += w.vegetables * (r.vegG >= lim.veg[0] ? 1.5 : r.vegG < lim.veg[1] ? -0.5 : 0);
  if (w.iron && r.iron) s += w.iron * 1.5;
  if (w.calcium && r.calcium) s += w.calcium * 1.5;
  if (w.soft) s += w.soft * (r.soft ? 1.5 : -1);
  return s * scale;
}

function feedbackScore(fb: Feedback | undefined, r: Recipe): number {
  const rating = fb?.ratings[r.id];
  return rating === "good" ? 2 : rating === "bad" ? -5 : 0;
}

// 決まった種から乱数を作る（同じ条件なら同じ献立になる。「作り直す」で種を変える）
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = {
  h: Household;
  p: HouseholdProfile;
  fb?: Feedback;
  used: Set<string>;
  proteinCount: Map<string, number>;
  prevMain?: Recipe;
  rand: () => number;
};

function scoreMain(c: Ctx, r: Recipe): number {
  let s = goalScore(c.p, r, "main") + feedbackScore(c.fb, r);
  if (c.p.hasKids && r.kid) s += 1;
  s -= dislikedBy(c.h, r).length * 4;
  if (c.prevMain?.protein === r.protein) s -= 3;
  if (c.prevMain?.cuisine === r.cuisine) s -= 0.5;
  s -= (c.proteinCount.get(r.protein) ?? 0) * 1.5;
  return s + c.rand() * 1.2;
}

function scoreSide(c: Ctx, r: Recipe, main: Recipe): number {
  let s = goalScore(c.p, r, "side") + feedbackScore(c.fb, r);
  if (c.p.hasKids && r.kid) s += 0.5;
  s -= dislikedBy(c.h, r).length * 4;
  if (main.vegG < 80 && r.vegG >= 70) s += 1.5; // 主菜の野菜が少ない日は、野菜の多い副菜に
  if (main.cuisine === r.cuisine) s += 0.5;
  if (main.protein === "soy" && r.ingredients.some((x) => x.name.includes("豆腐"))) s -= 2; // 豆腐が重ならないように
  // 1日の塩分の予算：主菜の塩分と、うす味の汁物の分（0.8g）を残して収まるか
  if (main.saltG + r.saltG + 0.8 > dinnerTargets(c.p).saltMax) s -= c.p.goalWeights.low_salt ? 3 : 1;
  return s + c.rand() * 1.2;
}

function scoreSoup(c: Ctx, r: Recipe, main: Recipe, side: Recipe): number {
  let s = goalScore(c.p, r, "soup") + feedbackScore(c.fb, r);
  if (c.p.hasKids && r.kid) s += 0.5;
  s -= dislikedBy(c.h, r).length * 4;
  if (main.cuisine === r.cuisine) s += 1;
  if (c.p.goalWeights.low_salt) s += c.p.goalWeights.low_salt * (r.saltG <= 1.0 ? 1.5 : -1); // 減塩なら汁物はうす味に
  if (main.vegG + side.vegG < 140 && r.vegG >= 90) s += 1.5;
  if (r.protein !== "none" && r.protein === main.protein) s -= 2;
  // 3品の塩分の合計が、1回の夕食の目安を超えないように
  if (main.saltG + side.saltG + r.saltG > dinnerTargets(c.p).saltMax) s -= c.p.goalWeights.low_salt ? 4 : 2;
  return s + c.rand() * 1.2;
}

/**
 * 候補から一番点数の高い料理を選ぶ。
 * 主菜は同じ週に繰り返さない（候補を使い切ったときだけ許す）。
 * 副菜と汁物は、家庭の夕食らしく繰り返しを許し、そのぶん点数を下げる（repeatPenalty）。
 */
function pick(list: Recipe[], used: Set<string>, score: (r: Recipe) => number, repeatPenalty?: number): Recipe {
  if (repeatPenalty !== undefined) {
    return list.map((r) => ({ r, s: score(r) - (used.has(r.id) ? repeatPenalty : 0) })).sort((a, b) => b.s - a.s)[0].r;
  }
  const fresh = list.filter((r) => !used.has(r.id));
  const pool = fresh.length > 0 ? fresh : list;
  return pool.map((r) => ({ r, s: score(r) })).sort((a, b) => b.s - a.s)[0].r;
}

const SIDE_REPEAT_PENALTY = 3;
const SOUP_REPEAT_PENALTY = 2;

// ---------------------------------------------------------------------------
// 栄養と理由
// ---------------------------------------------------------------------------
export type DayTotals = { kcal: number; proteinG: number; carbG: number; saltG: number; vegG: number };

export function dayTotals(d: Pick<DayPlan, "main" | "side" | "soup">): DayTotals {
  const rs = [d.main, d.side, d.soup].map((id) => RECIPE_BY_ID[id]);
  const sum = (k: keyof DayTotals) => Math.round(rs.reduce((n, r) => n + (r[k] as number), 0) * 10) / 10;
  return { kcal: sum("kcal"), proteinG: sum("proteinG"), carbG: sum("carbG"), saltG: sum("saltG"), vegG: sum("vegG") };
}

/** 夕食1回分（大人1人分）の目安。目標によって変える */
export function dinnerTargets(p: HouseholdProfile) {
  return {
    saltMax: p.goalWeights.low_salt ? 2.5 : 3.5,
    vegMin: p.goalWeights.vegetables ? 150 : 120,
    proteinMin: p.goalWeights.high_protein ? 25 : 20,
    kcalMax: p.goalWeights.weight ? 600 : 800,
  };
}

const who = (names: string[] | undefined) => (names && names.length ? `（${names.join("、")}）` : "");

export function reasonsFor(
  h: Household,
  p: HouseholdProfile,
  d: Pick<DayPlan, "main" | "side" | "soup">,
  prev?: Recipe,
): string[] {
  const main = RECIPE_BY_ID[d.main];
  const side = RECIPE_BY_ID[d.side];
  const soup = RECIPE_BY_ID[d.soup];
  const t = dayTotals(d);
  const target = dinnerTargets(p);
  const out: string[] = [];
  const g = p.goalMembers;
  if (g.low_salt && t.saltG <= target.saltMax)
    out.push(`減塩${who(g.low_salt)}：3品の塩分を合計${t.saltG}gに抑えました`);
  if (g.low_salt && t.saltG > target.saltMax) {
    const half = Math.round((soup.saltG / 2) * 10) / 10;
    out.push(
      `減塩のヒント${who(g.low_salt)}：3品で塩分${t.saltG}gと目安（${target.saltMax}g）を少し超えます。汁物を半分の量にすると約${half}g減らせます`,
    );
  }
  if (g.soft && [main, side, soup].filter((r) => r.soft).length >= 2)
    out.push(`やわらかめ${who(g.soft)}：やわらかく食べやすい料理を中心にしました`);
  if (g.iron && [main, side, soup].some((r) => r.iron))
    out.push(
      `鉄分${who(g.iron)}：${[main, side, soup]
        .filter((r) => r.iron)
        .map((r) => r.name)
        .join("、")}で鉄分をとれます`,
    );
  if (g.calcium && [main, side, soup].some((r) => r.calcium))
    out.push(
      `カルシウム${who(g.calcium)}：${[main, side, soup]
        .filter((r) => r.calcium)
        .map((r) => r.name)
        .join("、")}でカルシウムをとれます`,
    );
  if (g.high_protein && t.proteinG >= target.proteinMin)
    out.push(`たんぱく質${who(g.high_protein)}：3品で${t.proteinG}gとれます`);
  if (g.weight && t.kcal <= target.kcalMax) out.push(`体重管理${who(g.weight)}：3品で${t.kcal}kcalに収めました`);
  if (g.low_carb && t.carbG <= 30) out.push(`糖質ひかえめ${who(g.low_carb)}：おかず3品の糖質は${t.carbG}gです`);
  if (t.vegG >= target.vegMin) out.push(`野菜：3品で野菜を${t.vegG}gとれます`);
  if (prev && prev.protein !== main.protein && main.protein !== "none")
    out.push(`変化：前日の${PROTEINS[prev.protein]}に続かないよう、${PROTEINS[main.protein]}の主菜にしました`);
  if (p.hasKids && main.kid) out.push("子ども：子どもも食べやすい味つけの主菜です");
  out.push(`時間：主菜は約${main.minutes}分で作れます`);
  const disliked = [main, side, soup].flatMap((r) => dislikedBy(h, r).map((n) => `${n}さんの苦手な食材（${r.name}）`));
  if (disliked.length) out.push(`注意：${disliked.join("、")}を含みます。ほかの候補がありませんでした`);
  return out;
}

export function weekSummary(
  h: Household,
  p: HouseholdProfile,
  days: Pick<DayPlan, "main" | "side" | "soup">[],
): string[] {
  const out: string[] = [];
  if (p.allergens.length) {
    const detail = h.members
      .filter((m) => m.allergens.length)
      .map((m) => `${m.name}さん：${m.allergens.map((a) => ALLERGENS[a]).join("、")}`)
      .join("／");
    out.push(`アレルギー（${detail}）を含む料理は、すべて候補から外しています`);
  }
  const avg = (k: keyof DayTotals) =>
    Math.round((days.reduce((n, d) => n + dayTotals(d)[k], 0) / days.length) * 10) / 10;
  out.push(
    `1日あたりの夕食の平均（大人1人分）：塩分${avg("saltG")}g、野菜${avg("vegG")}g、たんぱく質${avg("proteinG")}g、${avg("kcal")}kcal`,
  );
  const goals = Object.keys(p.goalWeights) as Goal[];
  if (goals.length) out.push(`家族の目標（${goals.map((g) => GOALS[g]).join("、")}）に合う料理を優先しました`);
  out.push(`材料は${p.servings}人分（年代に合わせた量の目安）で計算しています`);
  return out;
}

// ---------------------------------------------------------------------------
// 献立の作成と入れ替え
// ---------------------------------------------------------------------------
export function addDays(start: string, n: number): string {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function planWeek(
  h: Household,
  opts: { start: string; seed: number; feedback?: Feedback; days?: number },
): Plan {
  const p = profileOf(h);
  const c: Ctx = { h, p, fb: opts.feedback, used: new Set(), proteinCount: new Map(), rand: mulberry32(opts.seed) };
  const mains = candidates(p, "main");
  const sides = candidates(p, "side");
  const soups = candidates(p, "soup");
  if (!mains.length || !sides.length || !soups.length) {
    throw new Error("条件に合う料理が足りません。アレルギーや調理時間の条件を見直してください");
  }
  const days: DayPlan[] = [];
  for (let n = 0; n < (opts.days ?? 7); n++) {
    const prev = c.prevMain;
    const main = pick(mains, c.used, (r) => scoreMain(c, r));
    const side = pick(sides, c.used, (r) => scoreSide(c, r, main), SIDE_REPEAT_PENALTY);
    const soup = pick(soups, c.used, (r) => scoreSoup(c, r, main, side), SOUP_REPEAT_PENALTY);
    [main, side, soup].forEach((r) => c.used.add(r.id));
    c.proteinCount.set(main.protein, (c.proteinCount.get(main.protein) ?? 0) + 1);
    c.prevMain = main;
    const d = { main: main.id, side: side.id, soup: soup.id };
    days.push({ date: addDays(opts.start, n), ...d, reasons: reasonsFor(h, p, d, prev) });
  }
  return {
    createdAt: new Date().toISOString(),
    seed: opts.seed,
    mode: "rules",
    days,
    summary: weekSummary(h, p, days),
  };
}

/** 1品を、同じ枠の次に良い候補へ入れ替える */
export function swapDish(h: Household, plan: Plan, dayIndex: number, course: Course, feedback?: Feedback): Plan {
  const p = profileOf(h);
  const day = plan.days[dayIndex];
  const prevMain = dayIndex > 0 ? RECIPE_BY_ID[plan.days[dayIndex - 1].main] : undefined;
  const used = new Set(plan.days.flatMap((d) => [d.main, d.side, d.soup]));
  const proteinCount = new Map<string, number>();
  plan.days.forEach((d, i) => {
    if (i !== dayIndex)
      proteinCount.set(RECIPE_BY_ID[d.main].protein, (proteinCount.get(RECIPE_BY_ID[d.main].protein) ?? 0) + 1);
  });
  const c: Ctx = { h, p, fb: feedback, used, proteinCount, prevMain, rand: () => 0.5 };
  const main = RECIPE_BY_ID[day.main];
  const side = RECIPE_BY_ID[day.side];
  const scorer = (r: Recipe) =>
    course === "main" ? scoreMain(c, r) : course === "side" ? scoreSide(c, r, main) : scoreSoup(c, r, main, side);
  const pool = candidates(p, course).filter((r) => r.id !== day[course]);
  if (!pool.length) return plan;
  const next = pick(
    pool,
    used,
    scorer,
    course === "main" ? undefined : course === "side" ? SIDE_REPEAT_PENALTY : SOUP_REPEAT_PENALTY,
  );
  const d = { ...day, [course]: next.id };
  const days = plan.days.map((x, i) => (i === dayIndex ? { ...d, reasons: reasonsFor(h, p, d, prevMain) } : x));
  return { ...plan, days, summary: weekSummary(h, p, days) };
}

/** AI などが選んだ献立を検証する。問題があれば理由を返す */
export function validateDay(p: HouseholdProfile, d: Pick<DayPlan, "main" | "side" | "soup">): string | null {
  for (const course of ["main", "side", "soup"] as const) {
    const r = RECIPE_BY_ID[d[course]];
    if (!r) return `存在しない料理（${d[course]}）`;
    if (r.course !== course) return `${r.name}は${course}の枠に入れられません`;
    if (hasAllergen(p, r)) return `${r.name}はアレルゲンを含みます`;
  }
  return null;
}
