import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "运营视觉一键延展平台",
  description:
    "AI驱动的营销图片多语言延展工具，支持OCR识别、智能翻译、高保真图片重绘",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
