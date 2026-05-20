import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "给你的秘密页面",
  description: "这个世界上，只有你会看到这里。一封藏在互联网里的互动式情书。",
  openGraph: {
    title: "给你的秘密页面",
    description: "这个世界上，只有你会看到这里。",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#0b1026",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
