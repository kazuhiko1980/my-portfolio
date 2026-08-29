import type { Metadata } from "next";
import { PortfolioHome } from "@/components/PortfolioHome";

export const metadata: Metadata = {
  title: "Videos",
  description: "動画作品一覧",
};

export default function VideosPage() {
  return <PortfolioHome type="video" />;
}
