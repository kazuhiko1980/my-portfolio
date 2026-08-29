import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "カテゴリ追加 | Admin",
  description: "作品カテゴリを管理します。",
};

export default function AdminCategoriesPage() {
  return <AdminDashboard page="categories" />;
}
