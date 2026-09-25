const PLACEHOLDER_TITLES = new Set(['未命名故事', '未命名互动小说', '目录']);

export function meaningfulTitle(title: string) {
  const name = title.trim();
  return name && !PLACEHOLDER_TITLES.has(name) ? name : '';
}

function plainDoc(text: string) {
  return text.replace(/\*\*/g, '');
}

export function pickTitle(topic: string) {
  const text = plainDoc(topic);
  const recBlock = (text.split(/##\s*推荐/)[1] || '').trim();
  const rec = recBlock.match(/[《「]([^》」]{2,80})[》」]/);
  if (rec) return rec[1].trim();
  const rec2 = text.match(/推荐[^\n《]*[《「]([^》」]+)[》」]/);
  if (rec2) return rec2[1].trim();
  const bookName = text.match(/书名[：:]\s*[《「]([^》」]+)[》」]/);
  if (bookName) return bookName[1].trim();
  const named = [...text.matchAll(/[#]{2,3}[^\n]*[《]([^》]+)[》]/g)].pop();
  if (named) return named[1].trim();
  const h1 = text.match(/^#\s+《([^》\n]+)》/m);
  return h1 ? h1[1].trim() : '';
}

export function pickDesignTitle(design: string) {
  const text = plainDoc(design);
  const named = text.match(/^\s*书名[：:]\s*[《「]([^》」\n]+)[》」]/m);
  if (named) return named[1].trim();
  const marked = text.match(/^#\s*《([^》\n]+)》/m);
  return marked ? marked[1].trim() : '';
}

export function storyTitle(opts: { topicTitle?: string; topicDoc?: string; designDoc?: string; metaTitle?: string }) {
  return pickDesignTitle(opts.designDoc || '') || meaningfulTitle(opts.topicTitle || '') ||
    pickTitle(opts.topicDoc || '') || meaningfulTitle(opts.metaTitle || '') || '未命名故事';
}
