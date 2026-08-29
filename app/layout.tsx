import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Artfolio",
    template: "%s | Artfolio",
  },
  description:
    "A mobile-first portfolio for original illustrations, AI art, animation, and embedded video works.",
  openGraph: {
    title: "Artfolio",
    description:
      "A mobile-first portfolio for original illustrations and video works.",
    type: "website",
    url: siteUrl,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
