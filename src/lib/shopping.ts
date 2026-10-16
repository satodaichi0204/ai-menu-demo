// 献立から、1週間分の買い物リストを作る（材料を合算し、家族の人数分に換算）
import { ING_CATEGORIES, type IngCategory, type Plan } from "./domain.ts";
import { RECIPE_BY_ID } from "./recipes.ts";

export type ShoppingItem = {
  key: string;
  name: string;
  amount: number;
  unit: string;
  category: IngCategory;
  /** 使う料理の名前 */
  usedIn: string[];
};

/** 量を見やすい単位で丸める */
export function roundAmount(amount: number, unit: string): number {
  if (unit === "g" || unit === "ml") return amount >= 100 ? Math.ceil(amount / 10) * 10 : Math.ceil(amount);
  if (unit === "小さじ" || unit === "大さじ") return Math.ceil(amount * 2) / 2;
  return Math.ceil(amount * 2) / 2; // 個、切れ、本、枚など
}

export function buildShoppingList(plan: Plan, servings: number, dayIndexes?: number[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  plan.days.forEach((d, i) => {
    if (dayIndexes && !dayIndexes.includes(i)) return;
    for (const id of [d.main, d.side, d.soup]) {
      const r = RECIPE_BY_ID[id];
      for (const ing of r.ingredients) {
        const key = `${ing.name}|${ing.unit}`;
        const item = map.get(key) ?? {
          key,
          name: ing.name,
          amount: 0,
          unit: ing.unit,
          category: ing.category,
          usedIn: [],
        };
        item.amount += ing.amount * servings;
        if (!item.usedIn.includes(r.name)) item.usedIn.push(r.name);
        map.set(key, item);
      }
    }
  });
  const order = Object.keys(ING_CATEGORIES) as IngCategory[];
  return [...map.values()]
    .map((x) => ({ ...x, amount: roundAmount(x.amount, x.unit) }))
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name, "ja"));
}

/** 「1.5個」「320g」「大さじ2」 */
export function formatAmount(amount: number, unit: string): string {
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace(/\.0$/, "");
  return unit === "小さじ" || unit === "大さじ" ? `${unit}${n}` : `${n}${unit}`;
}
