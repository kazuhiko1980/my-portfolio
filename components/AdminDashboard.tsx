"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
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

export type AdminPage = "register" | "works" | "categories" | "logo";
type DeleteTarget = {
  kind: "work" | "category";
  id: string;
  message: string;
};

export function AdminDashboard({ page = "works" }: { page?: AdminPage }) {
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

  return <AuthenticatedAdmin page={page} />;
}

function AuthenticatedAdmin({ page }: { page: AdminPage }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <h1 className="text-3xl font-semibold text-ink">haconiwa</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              管理者メールアドレスとパスワードでログインしてください。
            </p>
          </div>
          <Input
            label="メールアドレス"
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <Input
            label="パスワード"
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
          <Link
            href="/admin/works"
            className="text-3xl font-semibold text-ink"
            aria-label="管理画面トップへ移動"
          >
            haconiwa
          </Link>
          <p className="mt-1 text-xs text-muted">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/register"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink"
            aria-label="作品登録ページを開く"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink"
            aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={isMenuOpen}
            aria-controls="admin-drawer"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <div
        className={`fixed inset-0 z-40 bg-ink/30 transition-opacity duration-300 ${
          isMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!isMenuOpen}
        onClick={() => setIsMenuOpen(false)}
      />
      <aside
        id="admin-drawer"
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(82vw,20rem)] flex-col bg-white shadow-[-12px_0_32px_rgba(18,18,18,0.12)] transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="管理メニュー"
        aria-hidden={!isMenuOpen}
      >
        <div className="flex min-h-16 items-center justify-end border-b border-line px-4">
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="メニューを閉じる"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <AdminNavLink href="/admin/works" active={page === "works"} label="作品一覧" onSelect={() => setIsMenuOpen(false)} />
          <AdminNavLink href="/admin/register" active={page === "register"} label="作品を登録" onSelect={() => setIsMenuOpen(false)} />
          <AdminNavLink href="/admin/categories" active={page === "categories"} label="カテゴリ追加" onSelect={() => setIsMenuOpen(false)} />
          <AdminNavLink href="/admin/logo" active={page === "logo"} label="ロゴ設定" onSelect={() => setIsMenuOpen(false)} />
        </nav>
        <div className="mt-auto border-t border-line p-3">
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-line px-4 text-sm font-medium"
            aria-label="ログアウト"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            ログアウト
          </button>
        </div>
      </aside>
      {page === "register" ? (
        <Link
          href="/admin/works"
          className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 text-sm font-medium text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          戻る
        </Link>
      ) : null}
      <AdminConsole page={page} />
    </AdminShell>
  );
}

function AdminConsole({ page }: { page: AdminPage }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
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
  const [workListType, setWorkListType] = useState<WorkType>("image");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggingWorkId, setDraggingWorkId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoSource, setLogoSource] = useState<string | null>(null);
  const [logoZoom, setLogoZoom] = useState(1);
  const [logoOffsetX, setLogoOffsetX] = useState(0);
  const [logoOffsetY, setLogoOffsetY] = useState(0);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  const visibleWorks = works.filter((work) => work.type === workListType);

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

  useEffect(() => {
    if (page !== "register" || !editId) {
      return;
    }

    const work = works.find((item) => item.id === editId);
    if (work) {
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
    }
  }, [editId, page, works]);

  useEffect(() => {
    if (page !== "logo") return;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "logo_url")
      .maybeSingle()
      .then(({ data }) => setLogoUrl(data?.value ?? ""));
  }, [page, supabase]);

  useEffect(() => {
    if (!status) return;
    const timeoutId = window.setTimeout(() => setStatus(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [status]);

  async function uploadImage(file: File) {
    setSelectedFileName(file.name);
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

  async function uploadLogo(file: File) {
    setLogoFileName(file.name);
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("ロゴ画像は4MB以下にしてください。");
      return;
    }
    setIsUploading(true);
    const extension = file.name.split(".").pop() ?? "png";
    const path = `logo/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file, { cacheControl: "31536000", upsert: false });
    if (uploadError) {
      setError(uploadError.message);
      setIsUploading(false);
      return;
    }
    setLogoUrl(supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl);
    setStatus("ロゴ画像をアップロードしました。保存してください。");
    setIsUploading(false);
  }

  function selectLogo(file: File) {
    setLogoFileName(file.name);
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("ロゴ画像は4MB以下にしてください。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoSource(String(reader.result));
    reader.readAsDataURL(file);
  }

  function drawLogoCrop(sourceUrl: string, canvas: HTMLCanvasElement) {
    return new Promise<void>((resolve, reject) => {
    const source = new window.Image();
    source.onload = () => {
      const outputWidth = 1200;
      const outputHeight = 400;
      const cropRatio = outputWidth / outputHeight;
      const sourceRatio = source.width / source.height;
      const cropWidth = sourceRatio > cropRatio ? source.height * cropRatio : source.width;
      const cropHeight = sourceRatio > cropRatio ? source.height : source.width / cropRatio;
      const scaledWidth = cropWidth / logoZoom;
      const scaledHeight = cropHeight / logoZoom;
      const maxOffsetX = Math.max(0, (source.width - scaledWidth) / 2);
      const maxOffsetY = Math.max(0, (source.height - scaledHeight) / 2);
      const sourceX = (source.width - scaledWidth) / 2 + (logoOffsetX / 100) * maxOffsetX;
      const sourceY = (source.height - scaledHeight) / 2 + (logoOffsetY / 100) * maxOffsetY;
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("トリミング画像を作成できませんでした。"));
        return;
      }
      context.drawImage(source, sourceX, sourceY, scaledWidth, scaledHeight, 0, 0, outputWidth, outputHeight);
      resolve();
    };
    source.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    source.src = sourceUrl;
    });
  }

  useEffect(() => {
    if (!logoSource || !cropCanvasRef.current) return;
    drawLogoCrop(logoSource, cropCanvasRef.current).catch((caught) =>
      setError(caught instanceof Error ? caught.message : "トリミング画像を作成できませんでした。"),
    );
  }, [logoSource, logoZoom, logoOffsetX, logoOffsetY]);

  async function cropAndUploadLogo() {
    if (!logoSource || !cropCanvasRef.current) return;
    setIsUploading(true);
    setError(null);
    try {
      await drawLogoCrop(logoSource, cropCanvasRef.current);
      const blob = await new Promise<Blob | null>((resolve) =>
        cropCanvasRef.current?.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("トリミング画像を作成できませんでした。");
      await uploadLogo(new File([blob], "logo.png", { type: "image/png" }));
      setLogoSource(null);
      setLogoZoom(1);
      setLogoOffsetX(0);
      setLogoOffsetY(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "トリミング画像を作成できませんでした。");
      setIsUploading(false);
    }
  }

  async function saveLogo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!logoUrl) {
      setError("ロゴ画像を選択してください。");
      return;
    }
    const { error: saveError } = await supabase.from("site_settings").upsert({ key: "logo_url", value: logoUrl, updated_at: new Date().toISOString() });
    if (saveError) setError(saveError.message);
    else setStatus("ロゴを保存しました。ユーザー画面に反映されます。");
  }

  async function deleteLogo() {
    if (!logoUrl) return;
    setError(null);
    const marker = "/storage/v1/object/public/portfolio/";
    const storagePath = logoUrl.split(marker)[1];
    if (storagePath) {
      await supabase.storage.from("portfolio").remove([storagePath]);
    }
    const { error: deleteError } = await supabase
      .from("site_settings")
      .delete()
      .eq("key", "logo_url");
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setLogoUrl("");
    setLogoFileName(null);
    setStatus("ロゴを削除しました。");
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
    setDeleteTarget({
      kind: "work",
      id: work.id,
      message: "この作品を削除しますか？",
    });
  }

  async function reorderWorks(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const current = [...visibleWorks];
    const sourceIndex = current.findIndex((work) => work.id === sourceId);
    const targetIndex = current.findIndex((work) => work.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = current.splice(sourceIndex, 1);
    current.splice(targetIndex, 0, moved);
    setWorks((items) => items.map((work) => {
      const nextIndex = current.findIndex((item) => item.id === work.id);
      return nextIndex < 0 ? work : { ...work, display_order: nextIndex };
    }));
    const results = await Promise.all(
      current.map((work, index) =>
        supabase.from("works").update({ display_order: index }).eq("id", work.id),
      ),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setError(failed.error.message);
      await refresh();
      return;
    }
    setStatus("作品の並び順を保存しました。");
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

    setDeleteTarget({ kind: "category", id: category.id, message });
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    const table = deleteTarget.kind === "work" ? "works" : "categories";
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("id", deleteTarget.id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setStatus(
        deleteTarget.kind === "work"
          ? "作品を削除しました。"
          : "カテゴリを削除しました。",
      );
      await refresh();
    }
    setDeleteTarget(null);
  }

  function editWork(work: WorkWithCategory) {
    if (page === "works") {
      router.push(`/admin/register?edit=${work.id}`);
      return;
    }

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
    return page === "works" ? (
      <AdminWorksSkeleton />
    ) : (
      <StateBox title="読み込み中" body="管理データを取得しています。" loading />
    );
  }

  return (
    <div className="space-y-8">
      {error ? <Notice tone="error">{error}</Notice> : null}
      {status ? <Notice tone="success">{status}</Notice> : null}
      {deleteTarget ? (
        <ConfirmDialog
          message={deleteTarget.message}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}

      {page === "register" ? (
      <section className="space-y-4 pb-24">
        <SectionTitle title={editingWorkId ? "作品編集" : "作品を登録"} />
        <form onSubmit={saveWork} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-2 text-sm font-medium text-ink">
              種別
              <RequiredLabel />
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(["image", "video"] as WorkType[]).map((type) => (
                <label
                  key={type}
                  className={`flex min-h-14 cursor-pointer items-center rounded-md border px-4 text-sm font-medium transition ${
                    workForm.type === type
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="work-type"
                    value={type}
                    checked={workForm.type === type}
                    required
                    onChange={() =>
                      setWorkForm({
                        ...workForm,
                        type,
                        image_url: type === "image" ? workForm.image_url : null,
                        youtube_url: type === "video" ? workForm.youtube_url : null,
                      })
                    }
                    className="sr-only"
                  />
                  {type === "image" ? "Image" : "Video"}
                </label>
              ))}
            </div>
          </fieldset>
          {workForm.type === "image" ? (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                画像
                <RequiredLabel />
              </label>
              <label className="mx-auto flex min-h-12 w-fit cursor-pointer items-center rounded-md border border-ink bg-white px-5 text-sm font-medium text-ink transition hover:bg-ink hover:text-white">
                ファイルを選択
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) uploadImage(file);
                  }}
                  className="sr-only"
                />
              </label>
              <p className="text-center text-sm text-muted">
                {selectedFileName ?? "ファイルが選択されていません"}
              </p>
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
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                YouTube URL
                <RequiredLabel />
              </label>
              <input
                type="url"
                value={workForm.youtube_url ?? ""}
                onChange={(event) =>
                  setWorkForm({ ...workForm, youtube_url: event.currentTarget.value })
                }
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="min-h-12 w-full rounded-md border border-line bg-white px-3 text-base outline-none focus:border-2 focus:border-blue-500"
              />
            </div>
          )}
          <Input
            label="タイトル"
            value={workForm.title}
            onChange={(value) => setWorkForm({ ...workForm, title: value })}
            required
          />
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
          <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-2xl gap-2 bg-paper/95 p-3 backdrop-blur safe-bottom">
            <button className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white">
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
      ) : null}

      {page === "logo" ? (
        <section className="space-y-4 pb-24">
          <SectionTitle title="ロゴ設定" />
          <form onSubmit={saveLogo} className="space-y-4">
            <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-md border border-ink bg-white px-5 text-sm font-medium text-ink">
              ロゴ画像を選択
              <input type="file" accept="image/*" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) selectLogo(file); }} className="sr-only" />
            </label>
            <p className="text-center text-sm text-muted">{logoFileName ?? "ファイルが選択されていません"}</p>
            {logoSource ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" role="dialog" aria-modal="true" aria-label="ロゴのトリミング">
                <div className="w-full max-w-lg space-y-4 rounded-lg bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-ink">ロゴをトリミング</p>
                    <button type="button" onClick={() => setLogoSource(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink" aria-label="トリミングを閉じる"><X className="h-5 w-5" aria-hidden="true" /></button>
                  </div>
                  <p className="text-sm text-muted">このプレビューの範囲が、そのまま3:1で保存されます。</p>
                  <canvas ref={cropCanvasRef} className="aspect-[3/1] w-full rounded-md bg-[#e9e4da]" aria-label="ロゴのトリミングプレビュー" />
                  <label className="block text-sm text-muted">
                    ズーム
                    <input type="range" min="1" max="3" step="0.1" value={logoZoom} onChange={(event) => setLogoZoom(Number(event.currentTarget.value))} className="mt-2 w-full accent-ink" />
                  </label>
                  <label className="block text-sm text-muted">
                    左右位置
                    <input type="range" min="-100" max="100" value={logoOffsetX} onChange={(event) => setLogoOffsetX(Number(event.currentTarget.value))} className="mt-2 w-full accent-ink" />
                  </label>
                  <label className="block text-sm text-muted">
                    上下位置
                    <input type="range" min="-100" max="100" value={logoOffsetY} onChange={(event) => setLogoOffsetY(Number(event.currentTarget.value))} className="mt-2 w-full accent-ink" />
                  </label>
                  <button type="button" onClick={cropAndUploadLogo} disabled={isUploading} className="min-h-12 w-full rounded-md bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50">トリミングしてアップロード</button>
                </div>
              </div>
            ) : null}
            {logoUrl ? <div className="relative mx-auto aspect-[3/1] w-full max-w-lg rounded-md border border-line bg-white p-4"><Image src={logoUrl} alt="ロゴプレビュー" fill sizes="(max-width: 672px) 100vw, 672px" className="object-contain" /></div> : null}
            {logoUrl ? <button type="button" onClick={deleteLogo} className="min-h-12 w-full rounded-md border border-accent px-4 text-sm font-semibold text-accent">ロゴを削除</button> : null}
            <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl bg-paper/95 p-3 backdrop-blur safe-bottom">
              <button className="min-h-12 w-full rounded-md bg-ink px-4 text-sm font-semibold text-white">保存</button>
            </div>
          </form>
        </section>
      ) : null}

      {page === "works" ? (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle title="作品一覧" />
          <button type="button" onClick={() => setIsReorderMode((mode) => !mode)} className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs font-medium ${isReorderMode ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"}`} aria-pressed={isReorderMode}>
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            {isReorderMode ? "完了" : "並び替え"}
          </button>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="作品種別">
          {(["image", "video"] as WorkType[]).map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={workListType === type}
              onClick={() => setWorkListType(type)}
              className={`min-h-11 flex-1 rounded-md px-4 text-sm font-medium ${
                workListType === type
                  ? "bg-ink text-white"
                  : "bg-white text-ink"
              }`}
            >
              {type === "image" ? "Image" : "Video"}
            </button>
          ))}
        </div>
        {visibleWorks.length === 0 ? (
          <StateBox title="作品なし" body="最初の作品を登録してください。" />
        ) : (
          <div className="space-y-2">
            {visibleWorks.map((work) => (
              <div
                key={work.id}
                draggable={isReorderMode}
                onDragStart={() => setDraggingWorkId(work.id)}
                onDragEnd={() => setDraggingWorkId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggingWorkId) reorderWorks(draggingWorkId, work.id);
                  setDraggingWorkId(null);
                }}
                className={`flex items-center gap-3 rounded-md border border-line bg-white p-2 ${isReorderMode ? "cursor-grab active:cursor-grabbing" : ""} ${draggingWorkId === work.id ? "opacity-50" : ""}`}
              >
                {isReorderMode ? <GripVertical className="h-5 w-5 shrink-0 text-muted" aria-label="移動" /> : null}
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
      ) : null}

      {page === "categories" ? (
      <section className="space-y-4 pb-24">
        <SectionTitle title={editingCategoryId ? "カテゴリ編集" : "カテゴリ追加"} />
        <form onSubmit={saveCategory} className="space-y-3">
          <Input label="カテゴリ名" value={categoryName} onChange={setCategoryName} />
          <Input
            label="表示順"
            type="number"
            value={String(categoryOrder)}
            onChange={(value) => setCategoryOrder(Number(value) || 0)}
          />
          <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl bg-paper/95 p-3 backdrop-blur safe-bottom">
            <button className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white">
              保存
            </button>
          </div>
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
      ) : null}
    </div>
  );
}

function AdminNavLink({
  href,
  active,
  label,
  onSelect,
}: {
  href: string;
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={`flex min-h-12 items-center rounded-md px-4 text-sm font-medium ${
        active ? "bg-ink text-white" : "text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function ConfirmDialog({
  message,
  onCancel,
  onConfirm,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="削除の確認"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-soft">
        <p className="text-sm leading-6 text-ink">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 flex-1 rounded-md border border-line px-4 text-sm font-medium text-ink"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 flex-1 rounded-md bg-accent px-4 text-sm font-semibold text-white"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminWorksSkeleton() {
  return (
    <div className="space-y-3" aria-label="作品一覧を読み込み中" aria-busy="true">
      <div className="h-6 w-28 animate-pulse rounded bg-[#e9e4da]" />
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="flex gap-3 rounded-md border border-line bg-white p-2"
        >
          <div className="h-20 w-20 shrink-0 animate-pulse rounded bg-[#e9e4da]" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
            <div className="h-4 w-3/5 animate-pulse rounded bg-[#e9e4da]" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-[#e9e4da]" />
            <div className="h-9 w-24 animate-pulse rounded bg-[#e9e4da]" />
          </div>
        </div>
      ))}
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
      className={`fixed inset-x-4 top-4 z-[70] mx-auto flex max-w-lg gap-2 rounded-md border p-3 text-sm ${
        tone === "error"
          ? "border-accent/30 bg-accent/10 text-accent"
          : "notice-slide-in border-moss bg-moss text-white shadow-soft"
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

function RequiredLabel() {
  return <span className="text-xs font-medium text-accent">必須</span>;
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-sm font-medium text-ink">
        {label}
        {required ? <RequiredLabel /> : null}
      </span>
      <span className="relative block">
        <input
          type={isPassword && isPasswordVisible ? "text" : type}
          value={value}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.currentTarget.value)}
          className={`min-h-12 w-full rounded-md border border-line bg-white px-3 text-base outline-none focus:border-2 focus:border-blue-500 ${
            isPassword ? "pr-12" : ""
          }`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-muted"
            aria-label={isPasswordVisible ? "パスワードを隠す" : "パスワードを表示"}
          >
            {isPasswordVisible ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </span>
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
        className="w-full rounded-md border border-line bg-white px-3 py-3 text-base outline-none focus:border-2 focus:border-blue-500"
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
        className="min-h-12 w-full rounded-md border border-line bg-white px-3 text-base outline-none focus:border-2 focus:border-blue-500"
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
