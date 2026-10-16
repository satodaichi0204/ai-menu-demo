import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import AppNav from "@/components/AppNav";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

// 見出しとロゴに、日本の暮らし系のサービスで多い丸ゴシックを使う
const zen = Zen_Maru_Gothic({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-zen", preload: false });

export const metadata: Metadata = {
  title: { default: "ととのえ献立（デモ）", template: "%s｜ととのえ献立（デモ）" },
  description: "家族一人ひとりの好み、生活、健康目標に合わせて、1週間の夕食の献立を提案するアプリのデモ版です。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#faf6ef" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${zen.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-cream font-sans text-ink">
        <StoreProvider>
          <AppNav />
          <main className="flex-1 pb-24 md:pb-10">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
