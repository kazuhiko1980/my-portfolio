import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "作品を登録 | Admin",
  description: "作品を登録します。",
};

export default function AdminRegisterPage() {
  return <AdminDashboard page="register" />;
}
