import { applyDocUpdates, lastUpdatedKind, parseAssistantPayload, peelEditorTalk } from './parse-docs';
import { mergeProseAppend, proseShouldAppend, storyFromProse } from './parse-story';
import { parseStructure } from './structure';
import type { DocKind, StudioDocs } from './types';

function looksLikeStyleDoc(text: string) {
  return /(?:^|\n)#{1,3}\s*已锁定|\*\*已锁定|候选\s*[一二三123]/.test(text);
}

export function replyPreview(base: { docs: StudioDocs }, text: string, fallback?: DocKind, structure?: ReturnType<typeof parseStructure>) {
  const parsed = parseAssistantPayload(text);
  let updates = parsed.updates;
  if (base.docs.prose.trim()) {
    updates = updates.map((update) => {
      if (update.kind !== 'prose' || update.append) return update;
      return fallback === 'prose' || proseShouldAppend(base.docs.prose, update.content)
        ? { ...update, append: true }
        : update;
    });
  }
  let nextDocs = applyDocUpdates(base.docs, updates);
  if (!updates.length && fallback) {
    if (fallback === 'prose' && base.docs.prose.trim()) {
      if (/^##\s+/m.test(text)) nextDocs = { ...nextDocs, prose: mergeProseAppend(base.docs.prose, text) };
    } else if (!(fallback === 'style' && !looksLikeStyleDoc(text))) {
      nextDocs = { ...nextDocs, [fallback]: text };
    }
  }
  if (fallback === 'design' || nextDocs.design) {
    nextDocs = { ...nextDocs, design: peelEditorTalk(nextDocs.design).doc };
  }
  return {
    parsed,
    nextDocs,
    nextStory: storyFromProse(nextDocs.prose, parseStructure(nextDocs.chapters) || structure),
    kind: lastUpdatedKind(updates) || (updates.length === 0 ? fallback : null),
  };
}
