"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AGE_GROUPS,
  AGE_GROUP_CODES,
  ALLERGENS,
  ALLERGEN_CODES,
  GOALS,
  GOAL_CODES,
  type Household,
  type Member,
} from "@/lib/domain";
import { candidates, profileOf } from "@/lib/planner";
import { useStore } from "@/lib/store";
import { Card, ChipGroup, CloseIcon, DemoNote, Field, PlusIcon, Skeleton, inputClass } from "./ui";

const MINUTES = [15, 20, 30, 45] as const;

export default function HouseholdForm() {
  const s = useStore();
  if (!s.ready) return <Skeleton className="m-4 h-96 md:m-6" />;
  // 保存済みの内容を初期値にして、編集はフォームの中だけで行う（保存するまで献立は変わらない）
  return <Form key={JSON.stringify(s.household)} initial={s.household} />;
}

function Form({ initial }: { initial: Household }) {
  const s = useStore();
  const router = useRouter();
  const [draft, setDraft] = useState<Household>(initial);
  const [error, setError] = useState<string | null>(null);

  const setMember = (id: string, patch: Partial<Member>) =>
    setDraft((h) => ({ ...h, members: h.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));

  const p = profileOf(draft);
  const counts = {
    main: candidates(p, "main").length,
    side: candidates(p, "side").length,
    soup: candidates(p, "soup").length,
  };
  const tooFew = counts.main < 7 || counts.side < 3 || counts.soup < 3;

  const save = async () => {
    if (draft.members.some((m) => !m.name.trim())) return setError("名前が空の人がいます");
    setError(null);
    await s.generate({ household: draft, reseed: true });
    router.push("/plan");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">家族の設定</h1>
        <p className="text-sm text-stone-500">
          一人ひとりの年代、健康の目標、アレルギー、苦手な食材から、献立を考えます。
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <Field label="世帯の名前">
          <input
            value={draft.name}
            maxLength={40}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="平日の夕食にかけられる時間" hint="主菜の調理時間の上限">
          <div className="inline-flex rounded-xl bg-stone-100 p-1">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDraft({ ...draft, cookingMinutes: m })}
                aria-pressed={draft.cookingMinutes === m}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${draft.cookingMinutes === m ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500"}`}
              >
                {m}分
              </button>
            ))}
          </div>
        </Field>
      </Card>

      {draft.members.map((m, idx) => (
        <Card key={m.id} className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-stone-500">家族 {idx + 1}</h2>
            {draft.members.length > 1 && (
              <button
                type="button"
                onClick={() => setDraft((h) => ({ ...h, members: h.members.filter((x) => x.id !== m.id) }))}
                className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-rose-600"
              >
                <CloseIcon className="h-4 w-4" />
                削除
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="呼び名">
              <input
                value={m.name}
                maxLength={20}
                onChange={(e) => setMember(m.id, { name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="年代">
              <select
                value={m.ageGroup}
                onChange={(e) => setMember(m.id, { ageGroup: e.target.value as Member["ageGroup"] })}
                className={inputClass}
              >
                {AGE_GROUP_CODES.map((a) => (
                  <option key={a} value={a}>
                    {AGE_GROUPS[a].label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="健康の目標" hint="複数選択可">
            <ChipGroup
              label="健康の目標"
              options={GOAL_CODES.map((g) => ({ value: g, label: GOALS[g] }))}
              value={m.goals}
              onChange={(v) => setMember(m.id, { goals: v })}
            />
          </Field>
          <Field label="アレルギー" hint="含む料理は必ず外します">
            <ChipGroup
              label="アレルギー"
              tone="red"
              options={ALLERGEN_CODES.map((a) => ({ value: a, label: ALLERGENS[a] }))}
              value={m.allergens}
              onChange={(v) => setMember(m.id, { allergens: v })}
            />
          </Field>
          <Field label="苦手な食材" hint="できるだけ避けます（例：ピーマン、なす、魚）">
            <DislikeInput value={m.dislikes} onChange={(v) => setMember(m.id, { dislikes: v })} />
          </Field>
        </Card>
      ))}

      {draft.members.length < 8 && (
        <button
          type="button"
          onClick={() =>
            setDraft((h) => ({
              ...h,
              members: [
                ...h.members,
                { id: `m${Date.now()}`, name: "", ageGroup: "adult", goals: [], allergens: [], dislikes: [] },
              ],
            }))
          }
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-stone-300 py-4 text-sm font-semibold text-stone-500 hover:border-emerald-400 hover:text-emerald-700"
        >
          <PlusIcon className="h-5 w-5" />
          家族を追加
        </button>
      )}

      <Card className="sticky bottom-20 space-y-2 p-4 md:bottom-4">
        <p className={`text-xs ${tooFew ? "text-rose-700" : "text-stone-500"}`}>
          この条件で使える料理：主菜{counts.main}品、副菜{counts.side}品、汁物{counts.soup}品
          {tooFew && "。少なすぎるため、同じ料理が続くか、献立を作れないことがあります"}
        </p>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={s.generating}
            className="h-11 flex-1 rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-60"
          >
            {s.generating ? "献立を考えています…" : "保存して献立を作り直す"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("サンプルの家族に戻し、評価やメモも消します。よろしいですか？")) {
                s.resetDemo();
                router.push("/plan");
              }
            }}
            className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-500 hover:bg-stone-50"
          >
            デモを初期状態に戻す
          </button>
        </div>
      </Card>
      <DemoNote />
    </div>
  );
}

function DislikeInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (t && !value.includes(t) && value.length < 10) onChange([...value, t]);
    setText("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((d) => (
          <span
            key={d}
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200"
          >
            {d}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== d))} aria-label={`${d}を外す`}>
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          maxLength={20}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              add();
            }
          }}
          placeholder="食材名を入力"
          className={`${inputClass} h-10 flex-1`}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl border border-stone-200 px-4 text-sm font-semibold text-stone-600 hover:bg-stone-50"
        >
          追加
        </button>
      </div>
    </div>
  );
}
