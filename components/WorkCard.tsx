"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Play } from "lucide-react";
import type { WorkType, WorkWithCategory } from "@/lib/types";
import { getYouTubeThumbnailUrl } from "@/lib/youtube";

type WorkCardProps = {
  work: WorkWithCategory;
  activeCategoryId: string | null;
  activeType: WorkType;
};

export function WorkCard({
  work,
  activeCategoryId,
  activeType,
}: WorkCardProps) {
  const thumbnail =
    work.type === "image"
      ? work.image_url
      : getYouTubeThumbnailUrl(work.youtube_url) ?? work.image_url;
  const searchParams = new URLSearchParams({ type: activeType });
  if (activeCategoryId) {
    searchParams.set("category", activeCategoryId);
  }
  const href = `/works/${work.id}?${searchParams.toString()}`;

  return (
    <Link
      href={href}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`${work.title} の詳細を開く`}
    >
      <article className="overflow-hidden rounded-[20px] bg-white shadow-soft transition duration-200 group-active:scale-[0.98]">
        <div
          className={`relative overflow-hidden bg-[#e9e4da] ${
            work.type === "video" ? "aspect-video" : "aspect-[3/2]"
          }`}
        >
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={work.title}
              fill
              sizes="(max-width: 640px) 50vw, 260px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              {work.type === "video" ? (
                <Play className="h-8 w-8" aria-hidden="true" />
              ) : (
                <ImageIcon className="h-8 w-8" aria-hidden="true" />
              )}
            </div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
            {work.title}
          </h2>
          <p className="truncate text-xs text-muted">
            {work.category?.name ?? "Uncategorized"}
          </p>
        </div>
      </article>
    </Link>
  );
}
