import type { Metadata } from "next";
import PlanView from "@/components/PlanView";

export const metadata: Metadata = { title: "1週間の献立" };

export default function PlanPage() {
  return <PlanView />;
}
