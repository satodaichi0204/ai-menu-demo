"use client";

// 世帯、献立、評価を、このブラウザの中（localStorage）に保存する。
// デモは端末ごとの保存。本番では、ここをデータベース（例：Supabase）への保存に差し替える。
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Course, Feedback, Household, Plan, Rating } from "./domain";
import { swapDish } from "./planner";
import { EMPTY_FEEDBACK, SAMPLE_HOUSEHOLD } from "./sample";

const KEY = "totonoe-kondate:v1";

export type AiStatus = { enabled: boolean; remaining: number; perDay: number; budgetLeft: boolean };

type Saved = { household: Household; plan: Plan | null; feedback: Feedback; checked: string[] };

type Store = Saved & {
  ready: boolean;
  generating: boolean;
  /** AI で作っている最中か（進み具合の表示に使う） */
  generatingAi: boolean;
  ai: AiStatus | null;
  note: string | null;
  error: string | null;
  setHousehold: (h: Household) => void;
  generate: (opts?: { reseed?: boolean; household?: Household; feedback?: Feedback; ai?: boolean }) => Promise<void>;
  swap: (dayIndex: number, course: Course) => void;
  rate: (recipeId: string, rating: Rating) => void;
  toggleCooked: (date: string) => void;
  setNote: (date: string, text: string) => void;
  toggleChecked: (key: string) => void;
  clearChecked: () => void;
  resetDemo: () => void;
};

const StoreContext = createContext<Store | null>(null);

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

/** この端末の今日の日付（YYYY-MM-DD） */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Saved>({
    household: SAMPLE_HOUSEHOLD,
    plan: null,
    feedback: EMPTY_FEEDBACK,
    checked: [],
  });
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [ai, setAi] = useState<AiStatus | null>(null);

  // AI が使えるか、今日あと何回使えるか
  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then(setAi)
      .catch(() => setAi(null));
  }, []);
  const [note, setNoteMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // generate を、読み込みの後や初期化の後から呼べるようにしておく
  const generateRef = useRef<Store["generate"]>(async () => {});

  // 保存済みのデータは、表示後にしか読めない
  useEffect(() => {
    const saved = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage は表示後にだけ読める
    if (saved) setState(saved);
    setReady(true);
    // 初めて開いたときは、サンプルの家族で献立を作っておく
    if (!saved?.plan) {
      const timer = setTimeout(() => generateRef.current({ household: saved?.household ?? SAMPLE_HOUSEHOLD }), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // 保存できない環境（プライベートブラウズなど）でも、画面の中では動く
    }
  }, [state, ready]);

  const generate = useCallback(
    async (opts?: { reseed?: boolean; household?: Household; feedback?: Feedback; ai?: boolean }) => {
      setGenerating(true);
      setGeneratingAi(!!opts?.ai);
      setError(null);
      setNoteMsg(null);
      const household = opts?.household ?? state.household;
      const feedback = opts?.feedback ?? state.feedback;
      const seed = opts?.reseed ? Math.floor(Math.random() * 1_000_000) : (state.plan?.seed ?? 1);
      try {
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ household, start: todayLocal(), seed, feedback, ai: !!opts?.ai }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "献立を作れませんでした");
        setState((s) => ({ ...s, household, plan: data.plan, checked: [] }));
        setNoteMsg(data.note);
        if (data.status) setAi(data.status);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setGenerating(false);
        setGeneratingAi(false);
      }
    },
    [state.household, state.plan, state.feedback],
  );

  useEffect(() => {
    generateRef.current = generate;
  }, [generate]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      generating,
      generatingAi,
      ai,
      note,
      error,
      setHousehold: (household) => setState((s) => ({ ...s, household })),
      generate,
      swap: (dayIndex, course) =>
        setState((s) => (s.plan ? { ...s, plan: swapDish(s.household, s.plan, dayIndex, course, s.feedback) } : s)),
      rate: (recipeId, rating) =>
        setState((s) => {
          const ratings = { ...s.feedback.ratings };
          if (ratings[recipeId] === rating) delete ratings[recipeId];
          else ratings[recipeId] = rating;
          return { ...s, feedback: { ...s.feedback, ratings } };
        }),
      toggleCooked: (date) =>
        setState((s) => ({
          ...s,
          feedback: { ...s.feedback, cooked: { ...s.feedback.cooked, [date]: !s.feedback.cooked[date] } },
        })),
      setNote: (date, text) =>
        setState((s) => ({ ...s, feedback: { ...s.feedback, notes: { ...s.feedback.notes, [date]: text } } })),
      toggleChecked: (key) =>
        setState((s) => ({
          ...s,
          checked: s.checked.includes(key) ? s.checked.filter((k) => k !== key) : [...s.checked, key],
        })),
      clearChecked: () => setState((s) => ({ ...s, checked: [] })),
      resetDemo: () => {
        setState({ household: SAMPLE_HOUSEHOLD, plan: null, feedback: EMPTY_FEEDBACK, checked: [] });
        void generateRef.current({ household: SAMPLE_HOUSEHOLD, feedback: EMPTY_FEEDBACK, reseed: true });
      },
    }),
    [state, ready, generating, generatingAi, ai, note, error, generate],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("StoreProvider の内側で使ってください");
  return ctx;
}
