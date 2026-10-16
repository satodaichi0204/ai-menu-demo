import type { Metadata, Viewport } from "next";
import AppNav from "@/components/AppNav";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ととのえ献立（デモ）", template: "%s｜ととのえ献立（デモ）" },
  description: "家族一人ひとりの好み、生活、健康目標に合わせて、1週間の夕食の献立を提案するアプリのデモ版です。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex h-full flex-col bg-stone-50 font-sans text-stone-900">
        <StoreProvider>
          <AppNav />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
