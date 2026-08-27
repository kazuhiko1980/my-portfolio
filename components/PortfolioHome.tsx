"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Images, Loader2 } from "lucide-react";
import { fetchCategories, fetchWorks } from "@/lib/data";
import type { Category, WorkWithCategory } from "@/lib/types";
import { WorkCard } from "@/components/WorkCard";

export function PortfolioHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [works, setWorks] = useState<WorkWithCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const [nextCategories, nextWorks] = await Promise.all([
          fetchCategories(),
          fetchWorks(),
        ]);

        if (mounted) {
          setCategories(nextCategories);
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

  const visibleWorks = useMemo(() => {
    if (!activeCategoryId) {
      return works;
    }

    return works.filter((work) => work.category_id === activeCategoryId);
  }, [activeCategoryId, works]);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl bg-paper">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-moss">
              Portfolio
            </p>
            <h1 className="mt-1 text-3xl font-semibold leading-none text-ink">
              Artfolio
            </h1>
          </div>
          <div className="rounded-full border border-line px-3 py-1 text-xs text-muted">
            {works.length} works
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
                : "bg-white text-ink shadow-sm"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition ${
                activeCategoryId === category.id
                  ? "bg-ink text-white"
                  : "bg-white text-ink shadow-sm"
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </header>

      <section className="px-4 py-5 safe-bottom">
        {isLoading ? (
          <StateMessage
            icon={<Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />}
            title="読み込み中"
            body="作品を取得しています。"
          />
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="h-6 w-6" aria-hidden="true" />}
            title="取得できませんでした"
            body={error}
          />
        ) : works.length === 0 ? (
          <StateMessage
            icon={<Images className="h-6 w-6" aria-hidden="true" />}
            title="作品はまだありません"
            body="管理画面から作品とカテゴリを登録してください。"
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
              />
            ))}
          </div>
        )}
      </section>
    </main>
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
