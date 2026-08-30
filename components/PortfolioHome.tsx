"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Images,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { fetchCategories, fetchSiteLogo, fetchWorks } from "@/lib/data";
import type { Category, WorkType, WorkWithCategory } from "@/lib/types";
import { WorkCard } from "@/components/WorkCard";

type PortfolioHomeProps = {
  type: WorkType;
};

const pageMeta: Record<
  WorkType,
  {
    label: string;
    title: string;
    emptyTitle: string;
    emptyBody: string;
  }
> = {
  image: {
    label: "Images",
    title: "Images",
    emptyTitle: "画像作品はまだありません",
    emptyBody: "管理画面から画像作品を登録してください。",
  },
  video: {
    label: "Videos",
    title: "Videos",
    emptyTitle: "動画作品はまだありません",
    emptyBody: "管理画面から動画作品を登録してください。",
  },
};

export function PortfolioHome({ type }: PortfolioHomeProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [works, setWorks] = useState<WorkWithCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const currentPage = pageMeta[type];

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const [nextCategories, nextWorks, nextLogo] = await Promise.all([
          fetchCategories(),
          fetchWorks(),
          fetchSiteLogo(),
        ]);

        if (mounted) {
          setCategories(nextCategories);
          setWorks(nextWorks);
          setLogoUrl(nextLogo);
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

  const typedWorks = useMemo(
    () => works.filter((work) => work.type === type),
    [type, works],
  );

  const visibleWorks = useMemo(() => {
    if (!activeCategoryId) {
      return typedWorks;
    }

    return typedWorks.filter((work) => work.category_id === activeCategoryId);
  }, [activeCategoryId, typedWorks]);

  const visibleCategories = useMemo(() => {
    const usedCategoryIds = new Set(
      typedWorks
        .map((work) => work.category_id)
        .filter((categoryId): categoryId is string => Boolean(categoryId)),
    );

    return categories.filter((category) => usedCategoryIds.has(category.id));
  }, [categories, typedWorks]);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl bg-paper">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Image
            src={logoUrl ?? "/portfolio-logo.png"}
            alt="Portfolio logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink"
              aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={isMenuOpen}
              aria-controls="portfolio-drawer"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <nav
          className="-mx-4 flex gap-2 overflow-x-auto px-4 hide-scrollbar"
          aria-label="カテゴリ"
        >
          <button
            type="button"
            onClick={() => setActiveCategoryId(null)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition ${
              activeCategoryId === null
                ? "bg-ink text-white"
                : "bg-white text-ink"
            }`}
          >
            All
          </button>
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition ${
                activeCategoryId === category.id
                  ? "bg-ink text-white"
                  : "bg-white text-ink"
              }`}
            >
              {category.name}
            </button>
          ))}
          </nav>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-ink/30 transition-opacity duration-300 ${
          isMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!isMenuOpen}
        onClick={() => setIsMenuOpen(false)}
      />
      <aside
        id="portfolio-drawer"
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
          <MenuLink
            href="/"
            active={type === "image"}
            label="Images"
            onSelect={() => setIsMenuOpen(false)}
          />
          <MenuLink
            href="/videos"
            active={type === "video"}
            label="Videos"
            onSelect={() => setIsMenuOpen(false)}
          />
        </nav>
      </aside>

      <section className="px-4 py-5 safe-bottom">
        {isLoading ? (
          <WorkListSkeleton />
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="h-6 w-6" aria-hidden="true" />}
            title="取得できませんでした"
            body={error}
          />
        ) : typedWorks.length === 0 ? (
          <StateMessage
            icon={<Images className="h-6 w-6" aria-hidden="true" />}
            title={currentPage.emptyTitle}
            body={currentPage.emptyBody}
          />
        ) : visibleWorks.length === 0 ? (
          <StateMessage
            icon={<Images className="h-6 w-6" aria-hidden="true" />}
            title="このカテゴリは空です"
            body="別のカテゴリを選ぶか、管理画面で作品を追加してください。"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                activeCategoryId={activeCategoryId}
                activeType={type}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function WorkListSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      aria-label="作品を読み込み中"
      aria-busy="true"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg bg-white shadow-soft"
        >
          <div className="aspect-[3/2] animate-pulse bg-[#e9e4da]" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-4/5 animate-pulse rounded bg-[#e9e4da]" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-[#e9e4da]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MenuLink({
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
      className={`flex min-h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium ${
        active ? "bg-ink text-white" : "text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function StateMessage({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-[45dvh] flex-col items-center justify-center rounded-md border border-dashed border-line px-5 text-center">
      <div className="mb-3 text-moss">{icon}</div>
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
