"use client";

import type { ReactNode, SVGProps } from "react";
import type { Plan } from "@/lib/domain";

// ---------------------------------------------------------------------------
// アイコン（線画。使う分だけ定義する）
// ---------------------------------------------------------------------------
type IconProps = SVGProps<SVGSVGElement>;
function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}
export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);
export const CartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.5 8H6" />
    <circle cx="10" cy="20" r="1.3" />
    <circle cx="17" cy="20" r="1.3" />
  </Icon>
);
export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.3" />
    <path d="M3 20a6 6 0 0 1 12 0M16 4.6a3.3 3.3 0 0 1 0 6.6M21 20a6 6 0 0 0-4-5.7" />
  </Icon>
);
export const ChartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
  </Icon>
);
export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" />
  </Icon>
);
export const SwapIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4 3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7" />
  </Icon>
);
export const ThumbUpIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 10v10H4V10zM7 10l4-7a2 2 0 0 1 2 2.4L12.3 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7" />
  </Icon>
);
export const ThumbDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17 14V4h3v10zM17 14l-4 7a2 2 0 0 1-2-2.4l.7-3.6H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17" />
  </Icon>
);
export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
export const SparklesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9zM19 3v4M21 5h-4M5 17v4M7 19H3" />
  </Icon>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 6-6 6 6 6" />
  </Icon>
);
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17 7 7 17M7 7l10 10" />
  </Icon>
);
export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4 19.5h16" />
  </Icon>
);
export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 5 6v5.5c0 4.5 3 7.8 7 9.5 4-1.7 7-5 7-9.5V6z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Icon>
);
export const LeafIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 19C5 10 11 5 20 4c-.5 9-5 15-13 15H5z" />
    <path d="M5 19c3-4 6-7 10-9" />
  </Icon>
);

// ---------------------------------------------------------------------------
// 表示の部品
// ---------------------------------------------------------------------------
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-stone-200 bg-white shadow-sm ${className}`}>{children}</section>
  );
}

export function Tag({ children, tone = "stone" }: { children: ReactNode; tone?: "stone" | "green" | "red" | "amber" }) {
  const cls = {
    stone: "bg-stone-100 text-stone-600",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-800",
  }[tone];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

/** 栄養の値と目安。ok=false なら目安を外れている */
export function NutriChip({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <span
      className={`inline-flex items-baseline gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] ${
        ok === undefined
          ? "bg-stone-100 text-stone-600"
          : ok
            ? "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-800"
      }`}
    >
      <span className="text-[10px] opacity-80">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}

export function ModeBadge({ mode }: { mode: Plan["mode"] }) {
  if (mode === "ai")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800">
        <SparklesIcon className="h-3.5 w-3.5" />
        AI（Claude）が選びました
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
      デモモード：ルールで組み立て
    </span>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = "green",
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  label: string;
  tone?: "green" | "red";
}) {
  const onCls =
    tone === "red" ? "border-rose-600 bg-rose-600 text-white" : "border-emerald-600 bg-emerald-600 text-white";
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              on ? onCls : "border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        {hint && <span className="text-xs text-stone-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-base text-stone-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-stone-200/70 ${className}`} />;
}

export function DemoNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-stone-400 ${className}`}>
      デモ版です。家族とレシピは架空のもので、栄養の値はデモ用の概算です。データはこの端末のブラウザにだけ保存されます。
    </p>
  );
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
/** 「10/16（金）」 */
export function formatDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}（${WEEKDAYS[d.getUTCDay()]}）`;
}
