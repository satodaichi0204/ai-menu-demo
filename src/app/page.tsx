import Link from "next/link";
import { CalendarIcon, CartIcon, ChartIcon, DemoNote, ShieldIcon, SparklesIcon, UsersIcon } from "@/components/ui";

const FEATURES = [
  {
    icon: UsersIcon,
    title: "家族一人ひとりに合わせる",
    body: "年代、健康の目標（減塩、やわらかめ、鉄分など）、アレルギー、苦手な食材を家族ごとに登録します。",
  },
  {
    icon: CalendarIcon,
    title: "1週間の夕食を提案",
    body: "主菜・副菜・汁物の3品を7日分。1日ごとに塩分、野菜、たんぱく質を計算し、理由も表示します。",
  },
  {
    icon: CartIcon,
    title: "買い物リストまで",
    body: "1週間分の材料を合計し、家族の人数と年代に合わせた量で、売り場の順に並べます。",
  },
  {
    icon: ChartIcon,
    title: "モニター検証の記録",
    body: "作ったかどうか、料理ごとの評価、ひとことメモを記録し、次の献立に反映。CSVで書き出せます。",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <section className="text-center">
        <p className="text-sm font-semibold text-emerald-700">家族の健康を、毎日の食事から</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          家族それぞれに合わせた
          <br className="sm:hidden" />
          1週間の献立を
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-600">
          4人家族（減塩と体重管理の父、鉄分をとりたい母、卵アレルギーの小学生、やわらかめが必要な祖母）のサンプルで、すぐに試せます。家族の設定を変えると、献立も変わります。
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            <CalendarIcon className="h-5 w-5" />
            サンプルの家族で試す
          </Link>
          <Link
            href="/household"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
          >
            <UsersIcon className="h-5 w-5" />
            家族の設定から始める
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <f.icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold">{f.title}</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{f.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-violet-900">
            <SparklesIcon className="h-5 w-5" />
            AIの使い方
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-violet-900/80">
            AI（Claude）は、プログラムが用意した候補の中から、家族の目標と評価を読み取って献立を選び、理由を説明します。AIの答えはプログラムでもう一度確かめ、問題があればルールの献立に切り替えます。このデモはAIの代わりにルールで組み立てるモードで公開しています。
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-emerald-900">
            <ShieldIcon className="h-5 w-5" />
            アレルギーはAIに任せない
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-emerald-900/80">
            アレルゲン（特定原材料8品目と大豆）を含む料理は、AIに渡す前にプログラムで必ず外します。AIが誤って選んでも採用しない仕組みを、自動テストで確かめています。
          </p>
        </div>
      </section>

      <DemoNote className="mt-10 text-center" />
    </div>
  );
}
