import Image from "next/image";
import Link from "next/link";
import { CalendarIcon, CartIcon, ChartIcon, CheckIcon, ShieldIcon, SparklesIcon, UsersIcon } from "@/components/ui";
import { dayTotals } from "@/lib/planner";
import { RECIPE_BY_ID } from "@/lib/recipes";

// 浮かぶ栄養カードは、実際のレシピのデータから計算する
const SAMPLE_DAY = { main: "m12", side: "s01", soup: "p08" };
const SAMPLE_TOTALS = dayTotals(SAMPLE_DAY);

const COLLAGE = [
  { id: "m05", name: "肉じゃが", className: "col-span-2 row-span-2" },
  { id: "m03", name: "さばのみそ煮", className: "" },
  { id: "m14", name: "豚しゃぶサラダ", className: "" },
  { id: "m09", name: "鶏肉とブロッコリーのオイスター炒め", className: "" },
  { id: "m02", name: "鮭ときのこのホイル焼き", className: "" },
];

const FAMILY = [
  { name: "たかし", role: "父", tags: ["減塩", "体重管理"], color: "bg-matcha-100 text-matcha-800" },
  { name: "みか", role: "母", tags: ["鉄分をとる"], color: "bg-kaki-100 text-kaki-600" },
  { name: "はな", role: "小学生", tags: ["卵アレルギー"], color: "bg-rose-100 text-rose-700" },
  { name: "ふみ", role: "祖母", tags: ["やわらかめ", "減塩"], color: "bg-amber-100 text-amber-800" },
];

const STEPS = [
  { icon: UsersIcon, title: "家族を登録", body: "年代、健康の目標、アレルギー、苦手な食材を、家族一人ひとりに。" },
  { icon: CalendarIcon, title: "1週間の献立", body: "主菜・副菜・汁物を7日分。塩分や野菜の量と、選んだ理由も一緒に。" },
  { icon: CartIcon, title: "まとめて買い物", body: "材料を合計し、家族の人数と年代に合わせた量で、売り場の順に。" },
  {
    icon: ChartIcon,
    title: "使うほど家族の味に",
    body: "「好評」「不評」「作った」を記録すると、次の献立に反映されます。",
  },
];

const DISHES = [
  { id: "m10", name: "ぶりの照り焼き", note: "鉄分" },
  { id: "m07", name: "豆腐ハンバーグ", note: "やわらかめ" },
  { id: "m12", name: "かじきのトマト煮", note: "野菜たっぷり" },
  { id: "m01", name: "鶏むね肉の塩レモン焼き", note: "高たんぱく" },
  { id: "m16", name: "鶏ひき肉と豆腐の卵とじ", note: "やわらかめ" },
  { id: "m13", name: "ささみの梅しそ巻き", note: "低カロリー" },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ヒーロー */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-8 md:grid-cols-[1fr_1.1fr] md:px-6 md:pt-14">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-matcha-700 shadow-sm ring-1 ring-matcha-100">
            <SparklesIcon className="h-3.5 w-3.5" />
            家族の健康を、毎日の食事から
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.35] tracking-wide md:text-5xl">
            家族それぞれに、
            <br />
            ちょうどいい
            <span className="relative whitespace-nowrap text-matcha-700">
              夕食を。
              <svg
                viewBox="0 0 200 12"
                className="absolute -bottom-2 left-0 w-full text-kaki-400"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 8c50-6 120-6 196 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-loose text-ink/70">
            減塩したい父、鉄分をとりたい母、アレルギーのある子ども、やわらかいものがいい祖母。家族一人ひとりの目標から、1週間の献立と買い物リストをつくります。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 rounded-full bg-matcha-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-matcha-700/25 transition hover:bg-matcha-700"
            >
              <CalendarIcon className="h-5 w-5" />
              サンプルの家族で試す
            </Link>
            <Link
              href="/household"
              className="inline-flex items-center gap-2 rounded-full bg-paper px-7 py-3.5 text-sm font-bold text-ink shadow-sm ring-1 ring-ink/10 transition hover:ring-ink/20"
            >
              家族の設定から始める
            </Link>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink/60">
            {["登録なしで試せる", "アレルギーは必ず除外", "スマホにも対応"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1">
                <CheckIcon className="h-4 w-4 text-matcha-600" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="grid aspect-[5/4] grid-cols-3 grid-rows-3 gap-3">
            {COLLAGE.map((c, i) => (
              <div
                key={c.id}
                className={`relative overflow-hidden rounded-3xl shadow-xl shadow-ink/10 ${c.className} ${i === 4 ? "col-span-2" : ""}`}
              >
                <Image
                  src={`/food/${c.id}.jpg`}
                  alt={c.name}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 30vw, 60vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          {/* 浮かぶ栄養カード */}
          <div className="absolute -bottom-6 -left-4 w-56 rounded-2xl bg-paper/95 p-4 shadow-xl shadow-ink/10 ring-1 ring-ink/5 backdrop-blur md:-left-10">
            <p className="text-[11px] font-semibold text-ink/50">今日の夕食（大人1人分）</p>
            <p className="mt-0.5 font-display text-sm font-bold">
              {[SAMPLE_DAY.main, SAMPLE_DAY.side, SAMPLE_DAY.soup].map((id) => RECIPE_BY_ID[id].name).join("・")}
            </p>
            <div className="mt-3 space-y-1.5 text-xs">
              {[
                ["塩分", `${SAMPLE_TOTALS.saltG}g`, (SAMPLE_TOTALS.saltG / 3.5) * 100, "bg-matcha-500"],
                ["野菜", `${SAMPLE_TOTALS.vegG}g`, Math.min(100, (SAMPLE_TOTALS.vegG / 120) * 100), "bg-matcha-500"],
                [
                  "たんぱく質",
                  `${SAMPLE_TOTALS.proteinG}g`,
                  Math.min(100, (SAMPLE_TOTALS.proteinG / 20) * 100),
                  "bg-kaki-400",
                ],
              ].map(([k, v, w, c]) => (
                <div key={k as string} className="flex items-center gap-2">
                  <span className="w-16 text-ink/60">{k}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/5">
                    <span className={`block h-full rounded-full ${c}`} style={{ width: `${w}%` }} />
                  </span>
                  <span className="w-10 text-right font-bold tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* サンプルの家族 */}
      <section className="bg-paper py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-kaki-500">SAMPLE FAMILY</p>
          <h2 className="mt-2 text-center font-display text-2xl font-bold md:text-3xl">4人の目標を、1つの食卓で</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {FAMILY.map((f) => (
              <div key={f.name} className="rounded-3xl bg-cream p-5 text-center">
                <span
                  className={`mx-auto grid h-14 w-14 place-items-center rounded-full font-display text-xl font-bold ${f.color}`}
                >
                  {f.name.slice(0, 1)}
                </span>
                <p className="mt-3 font-display text-base font-bold">
                  {f.name}
                  <span className="ml-1 text-xs font-medium text-ink/50">{f.role}</span>
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {f.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-medium text-ink/70 ring-1 ring-ink/5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方 */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-kaki-500">HOW IT WORKS</p>
        <h2 className="mt-2 text-center font-display text-2xl font-bold md:text-3xl">
          献立づくりの「考える」を、まるごと
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl bg-paper p-6 shadow-sm ring-1 ring-ink/5">
              <span className="font-display text-4xl font-bold text-matcha-100">0{i + 1}</span>
              <span className="absolute right-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-matcha-50 text-matcha-700">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-2 font-display text-base font-bold">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/65">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 料理の写真 */}
      <section className="pb-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-kaki-500">RECIPES</p>
              <h2 className="mt-2 font-display text-2xl font-bold">家庭でつくれる、48品のレシピから</h2>
            </div>
            <Link href="/plan" className="hidden text-sm font-semibold text-matcha-700 hover:underline md:block">
              献立を見る →
            </Link>
          </div>
        </div>
        <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-auto md:max-w-6xl md:px-6">
          {DISHES.map((d) => (
            <Link key={d.id} href={`/recipes/${d.id}`} className="group w-56 shrink-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                <Image
                  src={`/food/${d.id}.jpg`}
                  alt={d.name}
                  fill
                  sizes="224px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-0.5 text-[11px] font-semibold text-matcha-700">
                  {d.note}
                </span>
              </div>
              <p className="mt-2 font-display text-sm font-bold">{d.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AI と安全 */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-6 md:grid-cols-2 md:px-6">
        <div className="rounded-3xl bg-ink p-7 text-cream">
          <SparklesIcon className="h-7 w-7 text-kaki-400" />
          <h2 className="mt-3 font-display text-xl font-bold">AIが選び、理由を説明</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/70">
            AI（Claude）が家族の目標と評価を読み取り、候補の中から献立を選んで、その理由を言葉で説明します。このデモはAIの代わりにルールで組み立てるモードで公開しています。
          </p>
        </div>
        <div className="rounded-3xl bg-matcha-700 p-7 text-white">
          <ShieldIcon className="h-7 w-7 text-matcha-200" />
          <h2 className="mt-3 font-display text-xl font-bold">アレルギーはAIに任せない</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            アレルゲン（特定原材料8品目と大豆）を含む料理は、AIに渡す前にプログラムで必ず外します。AIの答えもプログラムで確かめ、問題があれば使いません。
          </p>
        </div>
      </section>
      <p className="mx-auto max-w-6xl px-4 pt-6 text-center text-[11px] text-ink/40 md:px-6">
        デモ版です。家族とレシピは架空のもので、栄養の値はデモ用の概算です。料理の写真はAIで生成したイメージです。
      </p>
    </div>
  );
}
