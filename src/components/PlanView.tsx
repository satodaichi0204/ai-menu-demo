"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AGE_GROUPS, COURSES, GOALS, type Course, type DayPlan } from "@/lib/domain";
import { dayTotals, dinnerTargets, profileOf } from "@/lib/planner";
import { RECIPE_BY_ID } from "@/lib/recipes";
import { todayLocal, useStore } from "@/lib/store";
import {
  Card,
  CheckIcon,
  ClockIcon,
  DemoNote,
  ModeBadge,
  NutriChip,
  RefreshIcon,
  Skeleton,
  SparklesIcon,
  SwapIcon,
  Tag,
  ThumbDownIcon,
  ThumbUpIcon,
  formatDay,
} from "./ui";

export default function PlanView() {
  const s = useStore();
  const profile = useMemo(() => profileOf(s.household), [s.household]);
  const targets = dinnerTargets(profile);

  if (!s.ready || (!s.plan && s.generating))
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        <Skeleton className="h-40" />
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );

  const plan = s.plan;
  const today = todayLocal();

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
      {/* 見出しと家族 */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-emerald-700">{s.household.name}の1週間の夕食</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {plan
                  ? `${formatDay(plan.days[0].date)} 〜 ${formatDay(plan.days[plan.days.length - 1].date)}`
                  : "献立"}
              </h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.household.members.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs shadow-sm ring-1 ring-stone-200"
                  >
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-stone-400">{AGE_GROUPS[m.ageGroup].short}</span>
                    {m.goals.slice(0, 2).map((g) => (
                      <Tag key={g} tone="green">
                        {GOALS[g]}
                      </Tag>
                    ))}
                    {m.allergens.length > 0 && <Tag tone="red">アレルギーあり</Tag>}
                  </span>
                ))}
                <Link
                  href="/household"
                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  家族の設定を変える
                </Link>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {plan && <ModeBadge mode={plan.mode} />}
              <button
                type="button"
                onClick={() => s.generate({ reseed: true })}
                disabled={s.generating}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <RefreshIcon className={`h-4 w-4 ${s.generating ? "animate-spin" : ""}`} />
                {s.generating ? "献立を考えています…" : "献立を作り直す"}
              </button>
            </div>
          </div>
          {s.note && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{s.note}</p>}
          {s.error && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {s.error}
            </p>
          )}
          {plan && (
            <ul className="mt-4 space-y-1 text-xs leading-relaxed text-stone-600">
              {plan.summary.map((x) => (
                <li key={x} className="flex gap-1.5">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {x}
                </li>
              ))}
            </ul>
          )}
          {plan?.mode !== "ai" && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-white/70 px-3 py-2 text-[11px] leading-relaxed text-stone-500 ring-1 ring-stone-200">
              <SparklesIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
              このデモでは、AIの代わりにルールで献立を組み立てています。サーバーにAI（Claude）のAPIキーを設定すると、AIが家族の目標と評価を読み取って献立を選び、理由を説明します。どちらの場合も、アレルギーの除外と栄養の計算はプログラムで行います。
            </p>
          )}
        </div>
      </Card>

      {/* 7日分 */}
      {plan && (
        <div className="grid gap-4 md:grid-cols-2">
          {plan.days.map((d, i) => (
            <DayCard key={d.date} day={d} index={i} isToday={d.date === today} targets={targets} />
          ))}
        </div>
      )}
      <DemoNote />
    </div>
  );
}

function DayCard({
  day,
  index,
  isToday,
  targets,
}: {
  day: DayPlan;
  index: number;
  isToday: boolean;
  targets: ReturnType<typeof dinnerTargets>;
}) {
  const s = useStore();
  const t = dayTotals(day);
  const cooked = !!s.feedback.cooked[day.date];

  return (
    <Card className={`flex flex-col ${isToday ? "ring-2 ring-emerald-500" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
        <h2 className="flex shrink-0 items-center gap-2 whitespace-nowrap text-base font-bold">
          {formatDay(day.date)}
          {isToday && (
            <span className="whitespace-nowrap rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">今日</span>
          )}
        </h2>
        <div className="flex flex-wrap justify-end gap-1">
          <NutriChip label="塩分" value={`${t.saltG}g`} ok={t.saltG <= targets.saltMax} />
          <NutriChip label="野菜" value={`${t.vegG}g`} ok={t.vegG >= targets.vegMin} />
          <NutriChip label="たんぱく質" value={`${t.proteinG}g`} ok={t.proteinG >= targets.proteinMin} />
          <NutriChip label="" value={`${t.kcal}kcal`} ok={t.kcal <= targets.kcalMax} />
        </div>
      </div>

      <ul className="divide-y divide-stone-100">
        {(["main", "side", "soup"] as Course[]).map((course) => {
          const r = RECIPE_BY_ID[day[course]];
          const rating = s.feedback.ratings[r.id];
          return (
            <li key={course} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`w-9 shrink-0 rounded-md py-0.5 text-center text-[11px] font-bold ${
                  course === "main" ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600"
                }`}
              >
                {COURSES[course]}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/recipes/${r.id}`} className="block truncate font-semibold hover:text-emerald-700">
                  {r.name}
                </Link>
                <span className="flex items-center gap-2 text-[11px] text-stone-400">
                  <span className="inline-flex items-center gap-0.5">
                    <ClockIcon className="h-3 w-3" />
                    {r.minutes}分
                  </span>
                  塩分{r.saltG}g・{r.kcal}kcal
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => s.rate(r.id, "good")}
                  aria-pressed={rating === "good"}
                  aria-label={`${r.name}を好評にする`}
                  title="家族に好評"
                  className={`grid h-8 w-8 place-items-center rounded-lg transition ${rating === "good" ? "bg-emerald-600 text-white" : "text-stone-400 hover:bg-stone-100 hover:text-emerald-700"}`}
                >
                  <ThumbUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => s.rate(r.id, "bad")}
                  aria-pressed={rating === "bad"}
                  aria-label={`${r.name}を不評にする`}
                  title="家族に不評（次から出にくくなる）"
                  className={`grid h-8 w-8 place-items-center rounded-lg transition ${rating === "bad" ? "bg-rose-500 text-white" : "text-stone-400 hover:bg-stone-100 hover:text-rose-600"}`}
                >
                  <ThumbDownIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => s.swap(index, course)}
                  aria-label={`${r.name}を別の料理に入れ替える`}
                  title="別の料理に入れ替える"
                  className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-800"
                >
                  <SwapIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <details className="group border-t border-stone-100 px-4 py-3">
        <summary className="cursor-pointer list-none text-xs font-semibold text-emerald-700 [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">なぜこの献立？（{day.reasons.length}）</span>
          <span className="hidden group-open:inline">理由を閉じる</span>
        </summary>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-stone-600">
          {day.reasons.map((x) => (
            <li
              key={x}
              className={`flex gap-1.5 ${x.startsWith("AI：") ? "font-medium text-violet-800" : x.startsWith("注意：") ? "text-amber-800" : ""}`}
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
              {x}
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-auto flex items-center gap-2 border-t border-stone-100 bg-stone-50/60 px-4 py-2.5">
        <button
          type="button"
          onClick={() => s.toggleCooked(day.date)}
          aria-pressed={cooked}
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            cooked ? "bg-emerald-600 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
          {cooked ? "作った" : "作ったら押す"}
        </button>
        <input
          defaultValue={s.feedback.notes[day.date] ?? ""}
          onBlur={(e) => e.target.value !== (s.feedback.notes[day.date] ?? "") && s.setNote(day.date, e.target.value)}
          placeholder="ひとことメモ（例：子どもが完食）"
          aria-label={`${formatDay(day.date)}のメモ`}
          className="h-8 min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs outline-none focus:border-emerald-500"
        />
      </div>
    </Card>
  );
}
