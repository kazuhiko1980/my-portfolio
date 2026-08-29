"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Expand,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { fetchWorks } from "@/lib/data";
import type { WorkType, WorkWithCategory } from "@/lib/types";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export function WorkDetail() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const categoryContext = searchParams.get("category");
  const typeParam = searchParams.get("type");
  const typeContext: WorkType | null =
    typeParam === "image" || typeParam === "video" ? typeParam : null;
  const [works, setWorks] = useState<WorkWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const nextWorks = await fetchWorks();
        if (mounted) {
          setWorks(nextWorks);
          setError(null);
        }
      } catch (caught) {
        if (mounted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "作品データの取得に失敗しました。",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const scopedWorks = useMemo(() => {
    return works.filter((work) => {
      const matchesType = typeContext ? work.type === typeContext : true;
      const matchesCategory = categoryContext
        ? work.category_id === categoryContext
        : true;

      return matchesType && matchesCategory;
    });
  }, [categoryContext, typeContext, works]);

  const activeIndex = scopedWorks.findIndex((work) => work.id === params.id);
  const work = activeIndex >= 0 ? scopedWorks[activeIndex] : null;
  const previous = activeIndex > 0 ? scopedWorks[activeIndex - 1] : null;
  const next =
    activeIndex >= 0 && activeIndex < scopedWorks.length - 1
      ? scopedWorks[activeIndex + 1]
      : null;
  const contextSearchParams = new URLSearchParams();
  if (typeContext) {
    contextSearchParams.set("type", typeContext);
  }
  if (categoryContext) {
    contextSearchParams.set("category", categoryContext);
  }
  const contextQuery = contextSearchParams.toString()
    ? `?${contextSearchParams.toString()}`
    : "";
  const backHref = typeContext === "video" ? "/videos" : "/";

  if (isLoading) {
    return (
      <DetailShell>
        <Loader2
          className="h-7 w-7 animate-spin text-moss"
          aria-label="作品を読み込み中"
        />
      </DetailShell>
    );
  }

  if (error) {
    return <DetailShell>{error}</DetailShell>;
  }

  if (!work) {
    return (
      <DetailShell>
        存在しない作品、または指定カテゴリ内にない作品です。
      </DetailShell>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(work.youtube_url);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl bg-paper pb-24">
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-line/80 bg-paper/95 px-4 backdrop-blur">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 pr-3 text-sm font-medium text-ink"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          一覧に戻る
        </Link>
        <button
          type="button"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-sm"
          aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={isMenuOpen}
          aria-controls="detail-drawer"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-ink/30 transition-opacity duration-300 ${
          isMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!isMenuOpen}
        onClick={() => setIsMenuOpen(false)}
      />
      <aside
        id="detail-drawer"
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(82vw,20rem)] flex-col bg-white shadow-[-12px_0_32px_rgba(18,18,18,0.12)] transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="作品タイプ"
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
          <DetailMenuLink href="/" label="Images" onSelect={() => setIsMenuOpen(false)} />
          <DetailMenuLink href="/videos" label="Videos" onSelect={() => setIsMenuOpen(false)} />
        </nav>
      </aside>

      <section className="px-4 py-4">
        {work.type === "image" ? (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="group relative block w-full overflow-hidden rounded-none bg-[#e9e4da] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`${work.title} を拡大表示`}
          >
            {work.image_url ? (
              <Image
                src={work.image_url}
                alt={work.title}
                width={1200}
                height={1600}
                priority
                className="h-auto w-full object-contain"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-muted">
                画像URLが登録されていません。
              </div>
            )}
            {work.image_url ? (
              <span className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink/80 text-white backdrop-blur">
                <Expand className="h-5 w-5" aria-hidden="true" />
              </span>
            ) : null}
          </button>
        ) : embedUrl ? (
          <div className="overflow-hidden rounded-md bg-ink">
            <iframe
              title={work.title}
              src={embedUrl}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-line text-sm text-muted">
            YouTube URLが正しくありません。
          </div>
        )}
      </section>

      <section className="px-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-moss">
          <span>{work.type}</span>
          <span aria-hidden="true">/</span>
          <span>{work.category?.name ?? "Uncategorized"}</span>
        </div>
        <h1 className="text-3xl font-semibold leading-tight text-ink">
          {work.title}
        </h1>
        {work.description ? (
          <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-muted">
            {work.description}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">説明文は未登録です。</p>
        )}
      </section>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-3xl gap-2 bg-paper/95 p-3 backdrop-blur safe-bottom"
        aria-label="前後の作品"
      >
        <PagerLink
          href={previous ? `/works/${previous.id}${contextQuery}` : null}
          label="前へ"
          direction="previous"
        />
        <PagerLink
          href={next ? `/works/${next.id}${contextQuery}` : null}
          label="次へ"
          direction="next"
        />
      </nav>

      {isLightboxOpen && work.image_url ? (
        <Lightbox
          work={work}
          onClose={() => setIsLightboxOpen(false)}
        />
      ) : null}
    </main>
  );
}

function DetailMenuLink({
  href,
  label,
  onSelect,
}: {
  href: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex min-h-12 items-center rounded-md px-4 text-sm font-medium text-ink"
    >
      {label}
    </Link>
  );
}

function DetailShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center justify-center bg-paper px-6 text-center text-sm leading-6 text-muted">
      {children}
    </main>
  );
}

function PagerLink({
  href,
  label,
  direction,
}: {
  href: string | null;
  label: string;
  direction: "previous" | "next";
}) {
  const content = (
    <>
      {direction === "previous" ? (
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      ) : null}
      <span>{label}</span>
      {direction === "next" ? (
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      ) : null}
    </>
  );

  if (!href) {
    return (
      <span className="inline-flex min-h-12 flex-1 items-center justify-center gap-1 rounded-md border border-line text-sm font-medium text-muted/50">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex min-h-12 flex-1 items-center justify-center gap-1 rounded-md bg-ink text-sm font-medium text-white"
      aria-label={label}
    >
      {content}
    </Link>
  );
}

function Lightbox({
  work,
  onClose,
}: {
  work: WorkWithCategory;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`${work.title} の拡大表示`}
    >
      <div className="flex min-h-16 items-center justify-between px-3">
        <p className="truncate pr-3 text-sm font-medium">{work.title}</p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10"
          aria-label="拡大表示を閉じる"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <Image
          src={work.image_url ?? ""}
          alt={work.title}
          fill
          sizes="100vw"
          className="lightbox-image-in object-contain"
          priority
        />
      </div>
    </div>
  );
}
