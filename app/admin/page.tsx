import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin",
  description: "作品とカテゴリを管理します。",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
