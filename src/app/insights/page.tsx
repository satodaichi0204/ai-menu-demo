import type { Metadata } from "next";
import InsightsView from "@/components/InsightsView";

export const metadata: Metadata = { title: "モニター検証" };

export default function InsightsPage() {
  return <InsightsView />;
}
