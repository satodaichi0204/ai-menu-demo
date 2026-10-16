import type { Metadata } from "next";
import ShoppingView from "@/components/ShoppingView";

export const metadata: Metadata = { title: "買い物リスト" };

export default function ShoppingPage() {
  return <ShoppingView />;
}
