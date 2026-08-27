import { createSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase";
import type { Category, WorkWithCategory } from "@/lib/types";

export async function fetchCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchWorks(): Promise<WorkWithCategory[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("works")
    .select("*, category:categories(*)")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as WorkWithCategory[];
}
