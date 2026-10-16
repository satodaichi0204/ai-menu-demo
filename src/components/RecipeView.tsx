"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ALLERGENS, COURSES, CUISINES } from "@/lib/domain";
import { dislikedBy, hasAllergen, profileOf } from "@/lib/planner";
import { RECIPE_BY_ID } from "@/lib/recipes";
import { formatAmount, roundAmount } from "@/lib/shopping";
import { useStore } from "@/lib/store";
import { Card, ChevronLeftIcon, ClockIcon, DemoNote, NutriChip, Tag } from "./ui";

export default function RecipeView() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const r = RECIPE_BY_ID[id];
  if (!r)
    return (
      <p className="p-6 text-sm">
        レシピが見つかりません。
        <Link href="/plan" className="text-emerald-700 underline">
          献立に戻る
        </Link>
      </p>
    );
  const p = profileOf(s.household);
  const servings = p.servings;
  const disliked = dislikedBy(s.household, r);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <Link
        href="/plan"
        className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-emerald-700"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        献立に戻る
      </Link>
      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag tone="green">{COURSES[r.course]}</Tag>
          <Tag>{CUISINES[r.cuisine]}</Tag>
          {r.soft && <Tag>やわらかめ</Tag>}
          {r.kid && <Tag>子ども向け</Tag>}
          {r.iron && <Tag>鉄分</Tag>}
          {r.calcium && <Tag>カルシウム</Tag>}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{r.name}</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-stone-500">
          <ClockIcon className="h-4 w-4" />約{r.minutes}分
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <NutriChip label="エネルギー" value={`${r.kcal}kcal`} />
          <NutriChip label="たんぱく質" value={`${r.proteinG}g`} />
          <NutriChip label="糖質" value={`${r.carbG}g`} />
          <NutriChip label="塩分" value={`${r.saltG}g`} />
          <NutriChip label="野菜" value={`${r.vegG}g`} />
        </div>
        <p className="mt-1 text-[11px] text-stone-400">栄養は大人1人分の目安（デモ用の概算値）</p>
        <div className="mt-3 rounded-xl bg-stone-50 px-3 py-2.5 text-sm">
          <span className="font-semibold">アレルゲン：</span>
          {r.allergens.length
            ? r.allergens.map((a) => ALLERGENS[a]).join("、")
            : "特定原材料8品目と大豆は使っていません"}
          {hasAllergen(p, r) && (
            <p className="mt-1 font-semibold text-rose-700">この家族のアレルゲンを含むため、献立には出しません。</p>
          )}
          {disliked.length > 0 && (
            <p className="mt-1 text-amber-800">{disliked.join("、")}さんの苦手な食材を含みます。</p>
          )}
        </div>
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="text-base font-bold">
          材料
          <span className="ml-2 text-sm font-normal text-stone-500">
            {servings}人分（{s.household.name}）
          </span>
        </h2>
        <ul className="mt-3 divide-y divide-stone-100">
          {r.ingredients.map((x) => (
            <li key={x.name} className="flex justify-between py-2 text-sm">
              <span>{x.name}</span>
              <span className="tabular-nums text-stone-600">
                {formatAmount(roundAmount(x.amount * servings, x.unit), x.unit)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-stone-400">
          大人1人を1として、幼児0.5、小学生0.7、中高生1.1、高齢者0.8で計算しています。
        </p>
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="text-base font-bold">作り方</h2>
        <ol className="mt-3 space-y-3">
          {r.steps.map((step, n) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {n + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>
      <DemoNote />
    </div>
  );
}
