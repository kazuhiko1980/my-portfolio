"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  Edit3,
  ImageIcon,
  Loader2,
  LogOut,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { createSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase";
import type { Category, WorkFormInput, WorkType, WorkWithCategory } from "@/lib/types";
import { getYouTubeVideoId } from "@/lib/youtube";

const emptyWorkForm: WorkFormInput = {
  title: "",
  type: "image",
  image_url: null,
  youtube_url: null,
  description: "",
  category_id: null,
  display_order: 0,
};

export function AdminDashboard() {
  if (!hasSupabaseEnv()) {
    return (
      <AdminShell>
        <StateBox
          title="Supabase設定が必要です"
          body=".env.local.example を .env.local にコピーし、Supabase URL と anon key を設定してください。"
        />
      </AdminShell>
    );
  }

  return <AuthenticatedAdmin />;
}

function AuthenticatedAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setUser(data.user);
        setAuthLoading(false);
      }
    }

    loadSession();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    }
  }

  if (authLoading) {
    return (
      <AdminShell>
        <StateBox title="確認中" body="ログイン状態を確認しています。" loading />
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell>
        <form onSubmit={signIn} className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold text-ink">Admin</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              管理者メールアドレスとパスワードでログインしてください。
            </p>
          </div>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />
          {authError ? <ErrorText>{authError}</ErrorText> : null}
          <button className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white">
            ログイン
          </button>
        </form>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Admin</h1>
          <p className="mt-1 text-xs text-muted">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium"
          aria-label="ログアウト"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </div>
      <AdminConsole />
    </AdminShell>
  );
}

function AdminConsole() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [works, setWorks] = useState<WorkWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workForm, setWorkForm] = useState<WorkFormInput>(emptyWorkForm);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryOrder, setCategoryOrder] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    const [categoryResult, workResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("works")
        .select("*, category:categories(*)")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

    if (categoryResult.error || workResult.error) {
      setError(
        categoryResult.error?.message ??
          workResult.error?.message ??
          "データの取得に失敗しました。",
      );
    } else {
      setCategories(categoryResult.data ?? []);
      setWorks((workResult.data ?? []) as WorkWithCategory[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function uploadImage(file: File) {
    setError(null);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("JPEG、PNG、WebP、GIF の画像を選択してください。");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("画像サイズは8MB以下にしてください。");
      return;
    }

    setIsUploading(true);
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `works/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("portfolio")
      .upload(path, file, { cacheControl: "31536000", upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
    setWorkForm((current) => ({ ...current, image_url: data.publicUrl }));
    setStatus("画像をアップロードしました。");
    setIsUploading(false);
  }

  async function saveWork(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!workForm.title.trim()) {
      setError("タイトルは必須です。");
      return;
    }
    if (workForm.type === "image" && !workForm.image_url) {
      setError("画像作品には画像が必要です。");
      return;
    }
    if (workForm.type === "video" && !getYouTubeVideoId(workForm.youtube_url)) {
      setError("正しいYouTube URLを入力してください。");
      return;
    }

    const payload = {
      ...workForm,
      title: workForm.title.trim(),
      description: workForm.description?.trim() || null,
      image_url: workForm.type === "image" ? workForm.image_url : null,
      youtube_url: workForm.type === "video" ? workForm.youtube_url : null,
      updated_at: new Date().toISOString(),
    };
    const request = editingWorkId
      ? supabase.from("works").update(payload).eq("id", editingWorkId)
      : supabase.from("works").insert(payload);
    const { error: saveError } = await request;

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setWorkForm(emptyWorkForm);
    setEditingWorkId(null);
    setStatus(editingWorkId ? "作品を更新しました。" : "作品を登録しました。");
    await refresh();
  }

  async function deleteWork(work: WorkWithCategory) {
    if (!confirm("この作品を削除しますか？")) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("works")
      .delete()
      .eq("id", work.id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setStatus("作品を削除しました。");
      await refresh();
    }
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!categoryName.trim()) {
      setError("カテゴリ名は必須です。");
      return;
    }

    const payload = {
      name: categoryName.trim(),
      display_order: categoryOrder,
      updated_at: new Date().toISOString(),
    };
    const request = editingCategoryId
      ? supabase.from("categories").update(payload).eq("id", editingCategoryId)
      : supabase.from("categories").insert(payload);
    const { error: saveError } = await request;
    if (saveError) {
      setError(saveError.message);
      return;
    }

    setCategoryName("");
    setCategoryOrder(0);
    setEditingCategoryId(null);
    setStatus(editingCategoryId ? "カテゴリを更新しました。" : "カテゴリを追加しました。");
    await refresh();
  }

  async function deleteCategory(category: Category) {
    const count = works.filter((work) => work.category_id === category.id).length;
    const message =
      count > 0
        ? `このカテゴリには${count}作品が登録されています。カテゴリを削除しますか？作品は削除されず未分類になります。`
        : "このカテゴリを削除しますか？";

    if (!confirm(message)) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setStatus("カテゴリを削除しました。");
      await refresh();
    }
  }

  function editWork(work: WorkWithCategory) {
    setEditingWorkId(work.id);
    setWorkForm({
      title: work.title,
      type: work.type,
      image_url: work.image_url,
      youtube_url: work.youtube_url,
      description: work.description ?? "",
      category_id: work.category_id,
      display_order: work.display_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryOrder(category.display_order);
  }

  if (isLoading) {
    return <StateBox title="読み込み中" body="管理データを取得しています。" loading />;
  }

  return (
    <div className="space-y-8">
      {error ? <Notice tone="error">{error}</Notice> : null}
      {status ? <Notice tone="success">{status}</Notice> : null}

      <section className="space-y-4">
        <SectionTitle title={editingWorkId ? "作品編集" : "作品登録"} />
        <form onSubmit={saveWork} className="space-y-4">
          <Input
            label="タイトル"
            value={workForm.title}
            onChange={(value) => setWorkForm({ ...workForm, title: value })}
            required
          />
          <Select
            label="種別"
            value={workForm.type}
            onChange={(value) =>
              setWorkForm({ ...workForm, type: value as WorkType })
            }
            options={[
              { value: "image", label: "image" },
              { value: "video", label: "video" },
            ]}
          />
          {workForm.type === "image" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">画像</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) uploadImage(file);
                }}
                className="block w-full text-sm"
              />
              {isUploading ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  アップロード中
                </p>
              ) : null}
              {workForm.image_url ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-white">
                  <Image
                    src={workForm.image_url}
                    alt="アップロード済み画像"
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <Input
              label="YouTube URL"
              type="url"
              value={workForm.youtube_url ?? ""}
              onChange={(value) =>
                setWorkForm({ ...workForm, youtube_url: value })
              }
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          )}
          <Textarea
            label="説明文"
            value={workForm.description ?? ""}
            onChange={(value) => setWorkForm({ ...workForm, description: value })}
          />
          <Select
            label="カテゴリ"
            value={workForm.category_id ?? ""}
            onChange={(value) =>
              setWorkForm({ ...workForm, category_id: value || null })
            }
            options={[
              { value: "", label: "未分類" },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          />
          <Input
            label="表示順"
            type="number"
            value={String(workForm.display_order)}
            onChange={(value) =>
              setWorkForm({ ...workForm, display_order: Number(value) || 0 })
            }
          />
          <div className="flex gap-2">
            <button className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white">
              <Save className="h-4 w-4" aria-hidden="true" />
              保存
            </button>
            {editingWorkId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingWorkId(null);
                  setWorkForm(emptyWorkForm);
                }}
                className="min-h-12 rounded-md border border-line px-4 text-sm font-medium"
              >
                取消
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <SectionTitle title="作品一覧" />
        {works.length === 0 ? (
          <StateBox title="作品なし" body="最初の作品を登録してください。" />
        ) : (
          <div className="space-y-2">
            {works.map((work) => (
              <div
                key={work.id}
                className="flex gap-3 rounded-md border border-line bg-white p-2"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-[#e9e4da]">
                  {work.image_url ? (
                    <Image
                      src={work.image_url}
                      alt={work.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      <ImageIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{work.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {work.type} / {work.category?.name ?? "未分類"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => editWork(work)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-md border border-line px-3 text-xs font-medium"
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteWork(work)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-md border border-line px-3 text-xs font-medium text-accent"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 pb-10">
        <SectionTitle title={editingCategoryId ? "カテゴリ編集" : "カテゴリ追加"} />
        <form onSubmit={saveCategory} className="space-y-3">
          <Input label="カテゴリ名" value={categoryName} onChange={setCategoryName} />
          <Input
            label="表示順"
            type="number"
            value={String(categoryOrder)}
            onChange={(value) => setCategoryOrder(Number(value) || 0)}
          />
          <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-moss px-4 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" aria-hidden="true" />
            保存
          </button>
        </form>
        {categories.length === 0 ? (
          <StateBox title="カテゴリなし" body="カテゴリを追加できます。" />
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line bg-white p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{category.name}</p>
                  <p className="text-xs text-muted">order {category.display_order}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editCategory(category)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line"
                    aria-label={`${category.name}を編集`}
                  >
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-accent"
                    aria-label={`${category.name}を削除`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl bg-paper px-4 py-5">
      {children}
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold text-ink">{title}</h2>;
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "error" | "success";
}) {
  return (
    <div
      className={`flex gap-2 rounded-md border p-3 text-sm ${
        tone === "error"
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-moss/30 bg-moss/10 text-moss"
      }`}
    >
      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
      {children}
    </div>
  );
}

function StateBox({
  title,
  body,
  loading = false,
}: {
  title: string;
  body: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-md border border-dashed border-line p-5 text-center">
      {loading ? (
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-moss" />
      ) : null}
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-accent">{children}</p>;
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="min-h-12 w-full rounded-md border border-line bg-white px-3 text-base outline-none focus:border-accent"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        rows={4}
        className="w-full rounded-md border border-line bg-white px-3 py-3 text-base outline-none focus:border-accent"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="min-h-12 w-full rounded-md border border-line bg-white px-3 text-base outline-none focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
