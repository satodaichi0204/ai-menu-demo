"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ING_CATEGORIES, type IngCategory } from "@/lib/domain";
import { profileOf } from "@/lib/planner";
import { buildShoppingList, formatAmount } from "@/lib/shopping";
import { useStore } from "@/lib/store";
import { Card, CheckIcon, DemoNote, Skeleton, formatDay } from "./ui";

export default function ShoppingView() {
  const s = useStore();
  const [days, setDays] = useState<number[] | null>(null); // null = 1週間すべて
  const servings = profileOf(s.household).servings;

  const items = useMemo(
    () => (s.plan ? buildShoppingList(s.plan, servings, days ?? undefined) : []),
    [s.plan, servings, days],
  );
  const groups = useMemo(() => {
    const m = new Map<IngCategory, typeof items>();
    for (const x of items) m.set(x.category, [...(m.get(x.category) ?? []), x]);
    return [...m];
  }, [items]);

  if (!s.ready || !s.plan) return <Skeleton className="m-4 h-96 md:m-6" />;

  const done = items.filter((x) => s.checked.includes(x.key)).length;
  const toggleDay = (i: number) => {
    const cur = days ?? s.plan!.days.map((_, n) => n);
    const next = cur.includes(i) ? cur.filter((n) => n !== i) : [...cur, i].sort();
    setDays(next.length === s.plan!.days.length ? null : next);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">買い物リスト</h1>
          <p className="text-sm text-stone-500">
            献立の材料を合計し、{servings}人分に換算しました。
            <Link href="/plan" className="ml-1 text-emerald-700 hover:underline">
              献立を見る
            </Link>
          </p>
        </div>
        <p className="text-sm font-semibold text-stone-600">
          <span className="text-2xl font-bold text-emerald-700">{done}</span>／{items.length}品
        </p>
      </div>

      <Card className="p-4">
        <p className="mb-2 text-xs font-semibold text-stone-500">買う日の分を選ぶ</p>
        <div className="flex flex-wrap gap-1.5">
          {s.plan.days.map((d, i) => {
            const on = days === null || days.includes(i);
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => toggleDay(i)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-200 bg-white text-stone-600"}`}
              >
                {formatDay(d.date)}
              </button>
            );
          })}
          {s.checked.length > 0 && (
            <button
              type="button"
              onClick={s.clearChecked}
              className="ml-auto text-xs font-medium text-stone-500 underline"
            >
              チェックをすべて外す
            </button>
          )}
        </div>
      </Card>

      {groups.map(([cat, list]) => (
        <Card key={cat} className="overflow-hidden">
          <h2 className="border-b border-stone-100 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-500">
            {ING_CATEGORIES[cat]}
            {cat === "seasoning" && <span className="ml-2 font-normal">家にあるものは不要です</span>}
          </h2>
          <ul className="divide-y divide-stone-100">
            {list.map((x) => {
              const on = s.checked.includes(x.key);
              return (
                <li key={x.key}>
                  <button
                    type="button"
                    onClick={() => s.toggleChecked(x.key)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50"
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${on ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300 bg-white"}`}
                    >
                      {on && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                    <span className={`min-w-0 flex-1 ${on ? "text-stone-400 line-through" : ""}`}>
                      <span className="block text-sm font-medium">{x.name}</span>
                      <span className="block truncate text-[11px] text-stone-400">{x.usedIn.join("、")}</span>
                    </span>
                    <span
                      className={`shrink-0 text-sm tabular-nums ${on ? "text-stone-400" : "font-semibold text-stone-700"}`}
                    >
                      {formatAmount(x.amount, x.unit)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
      <DemoNote />
    </div>
  );
}
