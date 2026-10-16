"use client";

import { useMemo } from "react";
import { COURSES } from "@/lib/domain";
import { dayTotals, dinnerTargets, profileOf } from "@/lib/planner";
import { RECIPE_BY_ID } from "@/lib/recipes";
import { useStore } from "@/lib/store";
import { Card, DemoNote, DownloadIcon, Skeleton, ThumbDownIcon, ThumbUpIcon, formatDay } from "./ui";

export default function InsightsView() {
  const s = useStore();
  const stats = useMemo(() => {
    if (!s.plan) return null;
    const t = dinnerTargets(profileOf(s.household));
    const days = s.plan.days;
    const totals = days.map(dayTotals);
    const ratings = Object.entries(s.feedback.ratings);
    return {
      cooked: days.filter((d) => s.feedback.cooked[d.date]).length,
      days: days.length,
      good: ratings.filter(([, r]) => r === "good").map(([id]) => RECIPE_BY_ID[id]),
      bad: ratings.filter(([, r]) => r === "bad").map(([id]) => RECIPE_BY_ID[id]),
      salt: totals.filter((x) => x.saltG <= t.saltMax).length,
      veg: totals.filter((x) => x.vegG >= t.vegMin).length,
      protein: totals.filter((x) => x.proteinG >= t.proteinMin).length,
      notes: days
        .filter((d) => s.feedback.notes[d.date])
        .map((d) => ({ date: d.date, text: s.feedback.notes[d.date] })),
      targets: t,
    };
  }, [s.plan, s.household, s.feedback]);

  if (!s.ready || !s.plan || !stats) return <Skeleton className="m-4 h-96 md:m-6" />;

  const exportCsv = () => {
    const rows = [["日付", "区分", "料理", "評価", "作った", "メモ", "塩分g", "野菜g", "たんぱく質g", "kcal"]];
    for (const d of s.plan!.days) {
      const t = dayTotals(d);
      for (const course of ["main", "side", "soup"] as const) {
        const r = RECIPE_BY_ID[d[course]];
        const rating = s.feedback.ratings[r.id];
        rows.push([
          d.date,
          COURSES[course],
          r.name,
          rating === "good" ? "好評" : rating === "bad" ? "不評" : "",
          s.feedback.cooked[d.date] ? "はい" : "",
          course === "main" ? (s.feedback.notes[d.date] ?? "") : "",
          course === "main" ? String(t.saltG) : "",
          course === "main" ? String(t.vegG) : "",
          course === "main" ? String(t.proteinG) : "",
          course === "main" ? String(t.kcal) : "",
        ]);
      }
    }
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitor-${s.plan!.days[0].date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const kpis = [
    { label: "作った日", value: `${stats.cooked}／${stats.days}日`, sub: `実行率 ${pct(stats.cooked, stats.days)}%` },
    { label: "好評の料理", value: `${stats.good.length}品`, sub: "次の献立に入りやすくなる" },
    { label: "不評の料理", value: `${stats.bad.length}品`, sub: "次から出にくくなる" },
    { label: "塩分の目安を守れた日", value: `${stats.salt}／${stats.days}日`, sub: `1回${stats.targets.saltMax}g以下` },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-emerald-700">サービスの検証（運営者向け）</p>
          <h1 className="text-2xl font-bold tracking-tight">モニター検証</h1>
          <p className="text-sm text-stone-500">献立が実際に作られ、家族に受け入れられたかを確かめるための画面です。</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          <DownloadIcon className="h-4 w-4" />
          CSVで書き出す
        </button>
      </div>

      <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        このデモでは、この端末で記録した1世帯分を表示しています。本番では、モニター10〜20世帯の記録をデータベースに集め、世帯ごと・週ごとに比べられるようにします。
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-xs font-medium text-stone-500">{k.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{k.value}</p>
            <p className="text-[11px] text-stone-400">{k.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="text-base font-bold">栄養の目安を満たした日（夕食1回・大人1人分）</h2>
        <div className="mt-3 space-y-3">
          {[
            { label: `塩分 ${stats.targets.saltMax}g以下`, n: stats.salt },
            { label: `野菜 ${stats.targets.vegMin}g以上`, n: stats.veg },
            { label: `たんぱく質 ${stats.targets.proteinMin}g以上`, n: stats.protein },
          ].map((x) => (
            <div key={x.label}>
              <div className="flex justify-between text-sm">
                <span>{x.label}</span>
                <span className="font-semibold tabular-nums">
                  {x.n}／{stats.days}日
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct(x.n, stats.days)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-1.5 text-base font-bold">
            <ThumbUpIcon className="h-5 w-5 text-emerald-600" />
            好評の料理
          </h2>
          {stats.good.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {stats.good.map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-400">献立の料理の右にある、上向きの手のボタンで記録できます。</p>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-1.5 text-base font-bold">
            <ThumbDownIcon className="h-5 w-5 text-rose-500" />
            不評の料理
          </h2>
          {stats.bad.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {stats.bad.map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-400">不評をつけた料理は、次に献立を作るときに出にくくなります。</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-bold">家族のメモ</h2>
        {stats.notes.length ? (
          <ul className="mt-2 divide-y divide-stone-100 text-sm">
            {stats.notes.map((n) => (
              <li key={n.date} className="flex gap-3 py-2">
                <span className="shrink-0 text-stone-400">{formatDay(n.date)}</span>
                {n.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-400">献立の各日の下にある「ひとことメモ」が、ここに集まります。</p>
        )}
      </Card>
      <DemoNote />
    </div>
  );
}
