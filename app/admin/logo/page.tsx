import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "ロゴ設定 | Admin",
  description: "ユーザー画面のロゴを設定します。",
};

export default function AdminLogoPage() {
  return <AdminDashboard page="logo" />;
}
