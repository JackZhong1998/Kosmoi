'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="desk-md">
      <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
    </div>
  );
}
