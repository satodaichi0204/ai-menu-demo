"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AGE_GROUPS, COURSES, GOALS, type Course, type DayPlan } from "@/lib/domain";
import { dayTotals, dinnerTargets, profileOf } from "@/lib/planner";
import { RECIPE_BY_ID } from "@/lib/recipes";
import { todayLocal, useStore } from "@/lib/store";
import DishImage from "./DishImage";
import {
  CheckIcon,
  ClockIcon,
  DemoNote,
  NutritionRing,
  RefreshIcon,
  Skeleton,
  SparklesIcon,
  SwapIcon,
  ThumbDownIcon,
  ThumbUpIcon,
  formatDay,
} from "./ui";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const dayParts = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  return { md: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, wd: WEEKDAYS[d.getUTCDay()], dow: d.getUTCDay() };
};

export default function PlanView() {
  const s = useStore();
  const profile = useMemo(() => profileOf(s.household), [s.household]);
  const targets = dinnerTargets(profile);
  const [selected, setSelected] = useState<number | null>(null);

  if (!s.ready || (!s.plan && s.generating))
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        <Skeleton className="h-24" />
        <Skeleton className="h-[28rem]" />
      </div>
    );

  const plan = s.plan;
  const today = todayLocal();
  const todayIndex = plan
    ? Math.max(
        0,
        plan.days.findIndex((d) => d.date === today),
      )
    : 0;
  const index = selected ?? todayIndex;
  const day = plan?.days[index];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-5 md:px-6 md:pt-8">
      {/* 見出し */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-kaki-500">THIS WEEK</p>
          <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">{s.household.name}の1週間の夕食</h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {s.household.members.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-paper py-1 pl-1 pr-3 text-xs shadow-sm ring-1 ring-ink/5"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-matcha-100 font-display text-[11px] font-bold text-matcha-800">
                  {m.name.slice(0, 1)}
                </span>
                <span className="font-semibold">{m.name}</span>
                <span className="text-ink/45">
                  {AGE_GROUPS[m.ageGroup].short}
                  {m.goals.length > 0 && `・${m.goals.map((g) => GOALS[g]).join("・")}`}
                  {m.allergens.length > 0 && "・アレルギーあり"}
                </span>
              </span>
            ))}
            <Link href="/household" className="px-2 text-xs font-semibold text-matcha-700 hover:underline">
              変更
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {plan?.mode === "ai" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800">
              <SparklesIcon className="h-3.5 w-3.5" />
              AIが選びました
            </span>
          ) : (
            <span className="rounded-full bg-kaki-50 px-3 py-1.5 text-xs font-bold text-kaki-600 ring-1 ring-kaki-100">
              デモモード
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              void s.generate({ reseed: true });
            }}
            disabled={s.generating}
            className="inline-flex items-center gap-2 rounded-full bg-matcha-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-matcha-700/20 transition hover:bg-matcha-700 disabled:opacity-60"
          >
            <RefreshIcon className={`h-4 w-4 ${s.generating ? "animate-spin" : ""}`} />
            {s.generating ? "考えています…" : "作り直す"}
          </button>
        </div>
      </div>

      {s.note && <p className="rounded-2xl bg-kaki-50 px-4 py-3 text-xs text-kaki-600">{s.note}</p>}
      {s.error && (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {s.error}
        </p>
      )}

      {plan && day && (
        <>
          {/* 曜日の選択 */}
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-7 md:px-0">
            {plan.days.map((d, i) => {
              const p = dayParts(d.date);
              const active = i === index;
              const t = dayTotals(d);
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={active}
                  className={`flex min-w-[4.5rem] flex-col items-center rounded-2xl px-3 py-2.5 transition ${
                    active
                      ? "bg-ink text-cream shadow-lg shadow-ink/20"
                      : "bg-paper text-ink ring-1 ring-ink/5 hover:ring-ink/15"
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold ${active ? "text-cream/60" : p.dow === 0 ? "text-rose-500" : p.dow === 6 ? "text-sky-600" : "text-ink/45"}`}
                  >
                    {d.date === today ? "今日" : p.wd}
                  </span>
                  <span className="font-display text-lg font-bold leading-tight">{p.md}</span>
                  <span className="mt-1 flex gap-0.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${t.saltG <= targets.saltMax ? "bg-matcha-500" : "bg-kaki-400"}`}
                    />
                    {s.feedback.cooked[d.date] && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />}
                  </span>
                </button>
              );
            })}
          </div>

          <DayDetail day={day} index={index} isToday={day.date === today} targets={targets} />

          {/* 1週間の一覧 */}
          <section>
            <h2 className="font-display text-lg font-bold">1週間の献立</h2>
            <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:px-0 lg:grid-cols-7">
              {plan.days.map((d, i) => {
                const main = RECIPE_BY_ID[d.main];
                const p = dayParts(d.date);
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => {
                      setSelected(i);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`group w-40 shrink-0 overflow-hidden rounded-2xl bg-paper text-left ring-1 transition md:w-auto ${i === index ? "ring-2 ring-matcha-500" : "ring-ink/5 hover:ring-ink/15"}`}
                  >
                    <DishImage recipe={main} sizes="200px" className="aspect-[4/3]" />
                    <div className="p-3">
                      <p className="text-[11px] font-semibold text-ink/45">
                        {p.md}（{p.wd}）
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug">{main.name}</p>
                      <p className="mt-1 line-clamp-1 text-[11px] text-ink/50">
                        {RECIPE_BY_ID[d.side].name}・{RECIPE_BY_ID[d.soup].name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 今週の考え方 */}
          <section className="rounded-3xl bg-paper p-6 ring-1 ring-ink/5">
            <h2 className="font-display text-lg font-bold">今週の献立の考え方</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-ink/75 md:grid-cols-2">
              {plan.summary.map((x) => (
                <li key={x} className="flex gap-2">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-matcha-600" />
                  {x}
                </li>
              ))}
            </ul>
            {plan.mode !== "ai" && (
              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-cream px-4 py-3 text-xs leading-relaxed text-ink/60">
                <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                このデモでは、AIの代わりにルールで献立を組み立てています。サーバーにAI（Claude）のAPIキーを設定すると、AIが家族の目標と評価を読み取って献立を選び、理由を説明します。どちらの場合も、アレルギーの除外と栄養の計算はプログラムで行います。
              </p>
            )}
          </section>
        </>
      )}
      <DemoNote />
    </div>
  );
}

function DayDetail({
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
  const main = RECIPE_BY_ID[day.main];
  const cooked = !!s.feedback.cooked[day.date];

  const actions = (id: string, course: Course, dark = false) => {
    const rating = s.feedback.ratings[id];
    const base = dark
      ? "bg-black/30 text-white backdrop-blur hover:bg-black/45"
      : "bg-cream text-ink/50 hover:text-ink";
    return (
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => s.rate(id, "good")}
          aria-pressed={rating === "good"}
          aria-label={`${RECIPE_BY_ID[id].name}を好評にする`}
          title="家族に好評"
          className={`grid h-9 w-9 place-items-center rounded-full transition ${rating === "good" ? "bg-matcha-600 text-white" : base}`}
        >
          <ThumbUpIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => s.rate(id, "bad")}
          aria-pressed={rating === "bad"}
          aria-label={`${RECIPE_BY_ID[id].name}を不評にする`}
          title="家族に不評（次から出にくくなる）"
          className={`grid h-9 w-9 place-items-center rounded-full transition ${rating === "bad" ? "bg-rose-500 text-white" : base}`}
        >
          <ThumbDownIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => s.swap(index, course)}
          aria-label={`${RECIPE_BY_ID[id].name}を別の料理に入れ替える`}
          title="別の料理に入れ替える"
          className={`grid h-9 w-9 place-items-center rounded-full transition ${base}`}
        >
          <SwapIcon className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      {/* 主菜（大きな写真） */}
      <div className="overflow-hidden rounded-3xl bg-paper shadow-sm ring-1 ring-ink/5">
        <div className="relative">
          <DishImage
            recipe={main}
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority
            className="aspect-[4/3] md:aspect-[16/10]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute left-4 top-4 flex gap-1.5">
            <span className="rounded-full bg-paper/95 px-3 py-1 text-xs font-bold">{formatDay(day.date)}</span>
            {isToday && <span className="rounded-full bg-kaki-500 px-3 py-1 text-xs font-bold text-white">今日</span>}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-5">
            <div className="min-w-0 text-white">
              <span className="rounded-full bg-matcha-600 px-2.5 py-0.5 text-[11px] font-bold">{COURSES.main}</span>
              <Link
                href={`/recipes/${main.id}`}
                className="mt-2 block font-display text-2xl font-bold leading-snug drop-shadow hover:underline md:text-3xl"
              >
                {main.name}
              </Link>
              <p className="mt-1 flex items-center gap-2 text-xs text-white/80">
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {main.minutes}分
                </span>
                塩分{main.saltG}g・{main.kcal}kcal
              </p>
            </div>
            {actions(main.id, "main", true)}
          </div>
        </div>

        {/* 副菜と汁物 */}
        <ul className="divide-y divide-ink/5">
          {(["side", "soup"] as Course[]).map((course) => {
            const r = RECIPE_BY_ID[day[course]];
            return (
              <li key={course} className="flex items-center gap-3 px-4 py-3 md:px-5">
                <Link href={`/recipes/${r.id}`} className="shrink-0">
                  <DishImage recipe={r} sizes="80px" className="h-16 w-16 rounded-2xl" />
                </Link>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-kaki-500">{COURSES[course]}</span>
                  <Link href={`/recipes/${r.id}`} className="block truncate text-sm font-bold hover:text-matcha-700">
                    {r.name}
                  </Link>
                  <span className="text-[11px] text-ink/45">
                    {r.minutes}分・塩分{r.saltG}g
                  </span>
                </div>
                {actions(r.id, course)}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 栄養と理由 */}
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-ink/5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-base font-bold">この日の栄養</h2>
            <span className="text-[11px] text-ink/45">3品・大人1人分</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1">
            <NutritionRing label="塩分" value={t.saltG} unit="g" target={targets.saltMax} kind="max" />
            <NutritionRing label="野菜" value={t.vegG} unit="g" target={targets.vegMin} kind="min" />
            <NutritionRing label="たんぱく質" value={t.proteinG} unit="g" target={targets.proteinMin} kind="min" />
            <NutritionRing label="エネルギー" value={t.kcal} unit="kcal" target={targets.kcalMax} kind="max" />
          </div>
        </div>

        <div className="flex-1 rounded-3xl bg-matcha-50 p-5 ring-1 ring-matcha-100">
          <h2 className="font-display text-base font-bold text-matcha-800">なぜこの献立？</h2>
          <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed">
            {day.reasons.map((x) => {
              const [head, ...rest] = x.split("：");
              const body = rest.join("：");
              const tone = x.startsWith("AI：")
                ? "bg-violet-100 text-violet-800"
                : x.startsWith("注意") || x.startsWith("減塩のヒント")
                  ? "bg-kaki-100 text-kaki-600"
                  : "bg-paper text-matcha-700";
              return (
                <li key={x} className="flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${tone}`}>
                    {body ? head : "メモ"}
                  </span>
                  <span className="text-ink/75">{body || head}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-2 rounded-3xl bg-paper p-3 shadow-sm ring-1 ring-ink/5">
          <button
            type="button"
            onClick={() => s.toggleCooked(day.date)}
            aria-pressed={cooked}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
              cooked ? "bg-sky-600 text-white" : "bg-cream text-ink/70 hover:text-ink"
            }`}
          >
            <CheckIcon className="h-4 w-4" />
            {cooked ? "作った" : "作ったら押す"}
          </button>
          <input
            key={day.date}
            defaultValue={s.feedback.notes[day.date] ?? ""}
            onBlur={(e) => e.target.value !== (s.feedback.notes[day.date] ?? "") && s.setNote(day.date, e.target.value)}
            placeholder="ひとことメモ（例：子どもが完食）"
            aria-label={`${formatDay(day.date)}のメモ`}
            className="h-9 min-w-0 flex-1 rounded-full bg-cream px-4 text-xs outline-none ring-matcha-200 focus:ring-2"
          />
        </div>
      </div>
    </section>
  );
}
