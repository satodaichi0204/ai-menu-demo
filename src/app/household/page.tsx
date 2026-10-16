import type { Metadata } from "next";
import HouseholdForm from "@/components/HouseholdForm";

export const metadata: Metadata = { title: "家族の設定" };

export default function HouseholdPage() {
  return <HouseholdForm />;
}
