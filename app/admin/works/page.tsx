import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "作品一覧 | Admin",
  description: "登録済みの作品を管理します。",
};

export default function AdminWorksPage() {
  return <AdminDashboard page="works" />;
}
