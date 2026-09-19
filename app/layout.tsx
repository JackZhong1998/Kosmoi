import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '火花创作 Studio',
  description: '用 DeepSeek 写一本深度叙事的互动小说',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
