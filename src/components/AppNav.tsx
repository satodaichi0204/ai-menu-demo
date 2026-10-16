"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CalendarIcon, CartIcon, ChartIcon, LeafIcon, UsersIcon } from "./ui";

const NAV = [
  {
    href: "/plan",
    label: "献立",
    icon: CalendarIcon,
    match: (p: string) => p.startsWith("/plan") || p.startsWith("/recipes"),
  },
  { href: "/shopping", label: "買い物", icon: CartIcon, match: (p: string) => p.startsWith("/shopping") },
  { href: "/household", label: "家族", icon: UsersIcon, match: (p: string) => p.startsWith("/household") },
  { href: "/insights", label: "検証", icon: ChartIcon, match: (p: string) => p.startsWith("/insights") },
];

export default function AppNav() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-matcha-600 text-white shadow-sm shadow-matcha-700/30">
              <LeafIcon className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-lg font-bold tracking-wide">ととのえ献立</span>
              <span className="mt-0.5 block text-[10px] tracking-[0.2em] text-ink/45">TOTONOE KONDATE · DEMO</span>
            </span>
          </Link>
          <Suspense fallback={<TopNav pathname="" />}>
            <ActiveTopNav />
          </Suspense>
        </div>
      </header>
      <Suspense fallback={<BottomNav pathname="" />}>
        <ActiveBottomNav />
      </Suspense>
    </>
  );
}

function ActiveTopNav() {
  return <TopNav pathname={usePathname()} />;
}
function ActiveBottomNav() {
  return <BottomNav pathname={usePathname()} />;
}

function TopNav({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden items-center gap-1 rounded-full bg-paper p-1 text-sm shadow-sm ring-1 ring-ink/5 md:flex">
      {NAV.map((n) => {
        const active = n.match(pathname);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-medium transition ${
              active ? "bg-matcha-600 text-white shadow-sm" : "text-ink/60 hover:text-ink"
            }`}
          >
            <n.icon className="h-4 w-4" />
            {n.label === "検証" ? "モニター検証" : n.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** スマートフォンでは、アプリのように画面下にタブを並べる */
function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 rounded-2xl bg-paper/95 pb-[env(safe-area-inset-bottom)] shadow-lg shadow-ink/10 ring-1 ring-ink/5 backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {NAV.map((n) => {
          const active = n.match(pathname);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? "text-matcha-700" : "text-ink/45"}`}
            >
              <span className={`grid h-8 w-12 place-items-center rounded-full ${active ? "bg-matcha-100" : ""}`}>
                <n.icon className="h-5 w-5" />
              </span>
              {n.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
