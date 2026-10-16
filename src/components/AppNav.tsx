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
  { href: "/insights", label: "モニター検証", icon: ChartIcon, match: (p: string) => p.startsWith("/insights") },
];

export default function AppNav() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
              <LeafIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="whitespace-nowrap text-[15px] font-bold tracking-tight">ととのえ献立</span>
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-800">
              DEMO
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
    <nav className="hidden items-center gap-1 text-sm md:flex">
      {NAV.map((n) => {
        const active = n.match(pathname);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition ${
              active ? "bg-emerald-50 text-emerald-700" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** スマートフォンでは、アプリのように画面下にタブを並べる */
function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {NAV.map((n) => {
          const active = n.match(pathname);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-emerald-700" : "text-stone-500"}`}
            >
              <n.icon className="h-6 w-6" />
              {n.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
