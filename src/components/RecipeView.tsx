"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ALLERGENS, COURSES, CUISINES } from "@/lib/domain";
import { dislikedBy, hasAllergen, profileOf } from "@/lib/planner";
import { RECIPE_BY_ID } from "@/lib/recipes";
import { formatAmount, roundAmount } from "@/lib/shopping";
import { useStore } from "@/lib/store";
import DishImage from "./DishImage";
import { ChevronLeftIcon, ClockIcon, DemoNote, ShieldIcon } from "./ui";

export default function RecipeView() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const r = RECIPE_BY_ID[id];
  if (!r)
    return (
      <p className="p-6 text-sm">
        レシピが見つかりません。
        <Link href="/plan" className="text-matcha-700 underline">
          献立に戻る
        </Link>
      </p>
    );
  const p = profileOf(s.household);
  const servings = p.servings;
  const disliked = dislikedBy(s.household, r);
  const tags = [
    COURSES[r.course],
    CUISINES[r.cuisine],
    r.soft && "やわらかめ",
    r.kid && "子ども向け",
    r.iron && "鉄分",
    r.calcium && "カルシウム",
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-5 md:px-6 md:pt-8">
      <Link
        href="/plan"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink/50 hover:text-matcha-700"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        献立に戻る
      </Link>

      {/* 写真と料理名 */}
      <div className="relative mt-3 overflow-hidden rounded-3xl shadow-xl shadow-ink/10">
        <DishImage
          recipe={r}
          sizes="(min-width: 896px) 896px, 100vw"
          priority
          className="aspect-[4/3] md:aspect-[16/9]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-8">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur">
                {t}
              </span>
            ))}
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold leading-snug drop-shadow md:text-4xl">{r.name}</h1>
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-white/85">
            <ClockIcon className="h-4 w-4" />約{r.minutes}分
          </p>
        </div>
      </div>

      {/* 栄養 */}
      <div className="mt-4 grid grid-cols-5 divide-x divide-ink/5 rounded-3xl bg-paper py-4 text-center shadow-sm ring-1 ring-ink/5">
        {[
          ["エネルギー", r.kcal, "kcal"],
          ["たんぱく質", r.proteinG, "g"],
          ["糖質", r.carbG, "g"],
          ["塩分", r.saltG, "g"],
          ["野菜", r.vegG, "g"],
        ].map(([k, v, u]) => (
          <div key={k as string}>
            <p className="text-[10px] text-ink/50 md:text-xs">{k}</p>
            <p className="mt-0.5 font-display text-lg font-bold tabular-nums md:text-xl">
              {v}
              <span className="ml-0.5 text-[10px] font-medium text-ink/45">{u}</span>
            </p>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[11px] text-ink/40">大人1人分の目安（デモ用の概算値）</p>

      {/* アレルゲン */}
      <div
        className={`mt-4 flex items-start gap-3 rounded-3xl p-4 text-sm ${hasAllergen(p, r) ? "bg-rose-50 text-rose-800" : "bg-matcha-50 text-matcha-800"}`}
      >
        <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold">
            アレルゲン：
            {r.allergens.length
              ? r.allergens.map((a) => ALLERGENS[a]).join("、")
              : "特定原材料8品目と大豆は使っていません"}
          </p>
          {hasAllergen(p, r) && <p className="mt-0.5">この家族のアレルゲンを含むため、献立には出しません。</p>}
          {disliked.length > 0 && (
            <p className="mt-0.5 text-kaki-600">{disliked.join("、")}さんの苦手な食材を含みます。</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.3fr]">
        {/* 材料 */}
        <section>
          <h2 className="flex items-baseline gap-2 font-display text-xl font-bold">
            材料
            <span className="text-sm font-medium text-ink/50">{servings}人分</span>
          </h2>
          <ul className="mt-3 divide-y divide-dashed divide-ink/10 rounded-3xl bg-paper px-5 py-2 shadow-sm ring-1 ring-ink/5">
            {r.ingredients.map((x) => (
              <li key={x.name} className="flex justify-between gap-3 py-2.5 text-sm">
                <span>{x.name}</span>
                <span className="tabular-nums text-ink/60">
                  {formatAmount(roundAmount(x.amount * servings, x.unit), x.unit)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-ink/40">
            {s.household.name}
            に合わせた量です。大人1人を1として、幼児0.5、小学生0.7、中高生1.1、高齢者0.8で計算しています。
          </p>
        </section>

        {/* 作り方 */}
        <section>
          <h2 className="font-display text-xl font-bold">作り方</h2>
          <ol className="mt-3 space-y-3">
            {r.steps.map((step, n) => (
              <li
                key={step}
                className="flex gap-4 rounded-3xl bg-paper p-5 text-sm leading-relaxed shadow-sm ring-1 ring-ink/5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-kaki-500 font-display font-bold text-white">
                  {n + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <DemoNote className="mt-8" />
    </div>
  );
}
