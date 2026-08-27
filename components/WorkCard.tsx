"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Play } from "lucide-react";
import type { WorkWithCategory } from "@/lib/types";
import { getYouTubeThumbnailUrl } from "@/lib/youtube";

type WorkCardProps = {
  work: WorkWithCategory;
  activeCategoryId: string | null;
};

export function WorkCard({ work, activeCategoryId }: WorkCardProps) {
  const thumbnail =
    work.type === "image"
      ? work.image_url
      : getYouTubeThumbnailUrl(work.youtube_url) ?? work.image_url;
  const href = activeCategoryId
    ? `/works/${work.id}?category=${activeCategoryId}`
    : `/works/${work.id}`;

  return (
    <Link
      href={href}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`${work.title} の詳細を開く`}
    >
      <article className="overflow-hidden rounded-md bg-white shadow-soft transition duration-200 group-active:scale-[0.98]">
        <div className="relative aspect-[4/5] bg-[#e9e4da]">
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
          <span className="absolute left-2 top-2 inline-flex min-h-8 items-center gap-1 rounded-full bg-ink/80 px-2.5 text-xs font-medium text-white backdrop-blur">
            {work.type === "video" ? (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {work.type}
          </span>
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
