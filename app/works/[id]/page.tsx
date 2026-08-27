import type { Metadata } from "next";
import { WorkDetail } from "@/components/WorkDetail";

export const metadata: Metadata = {
  title: "Work",
  description: "作品詳細",
};

export default function WorkDetailPage() {
  return <WorkDetail />;
}
