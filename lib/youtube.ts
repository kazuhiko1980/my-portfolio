export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.replace(/^www\./, "");

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const watchId = parsed.searchParams.get("v");
      if (watchId) {
        return sanitizeVideoId(watchId);
      }

      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?#]+)/);
      return sanitizeVideoId(embedMatch?.[1]);
    }

    if (hostname === "youtu.be") {
      return sanitizeVideoId(parsed.pathname.split("/").filter(Boolean)[0]);
    }
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export function getYouTubeThumbnailUrl(url: string | null | undefined): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

function sanitizeVideoId(value: string | undefined): string | null {
  if (!value || !/^[a-zA-Z0-9_-]{6,}$/.test(value)) {
    return null;
  }

  return value;
}
