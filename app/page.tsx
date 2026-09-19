'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Reader } from '@/components/Reader';
import { emptyStory, mergeStory, storyWordCount } from '@/lib/parse-story';
import { PHASE_STARTERS, SYSTEM_PROMPT } from '@/lib/system-prompt';
import type { ChatMessage, Phase, StoryData } from '@/lib/types';

type Tab = Phase;

async function streamGenerate(
  systemPrompt: string,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
): Promise<string> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages, temperature: 0.85 }),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || '生成失败');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content || '';
        if (delta) {
          full += delta;
          onDelta(full);
        }
      } catch {
        /* ignore malformed sse chunk */
      }
    }
  }
  return full;
}

function saveLocal(payload: unknown) {
  try {
    localStorage.setItem('spark-studio', JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export default function StudioPage() {
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [tab, setTab] = useState<Tab>('topic');
  const [topicDoc, setTopicDoc] = useState('');
  const [designDoc, setDesignDoc] = useState('');
  const [proseDoc, setProseDoc] = useState('');
  const [story, setStory] = useState<StoryData>(emptyStory());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('左侧是写作 Agent 的 System Prompt，右侧按三阶段产出文档。');
  const [error, setError] = useState('');
  const [showSource, setShowSource] = useState(false);
  const [evalNote, setEvalNote] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const abortBusy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem('spark-studio');
        const saved = raw ? JSON.parse(raw) : {};
        const remote = await fetch('/api/load').then((r) => r.json()).catch(() => ({}));
        const topic = saved.topicDoc || remote.topicDoc || '';
        const design = saved.designDoc || remote.designDoc || '';
        const prose = saved.proseDoc || remote.proseDoc || '';
        if (cancelled) return;
        if (saved.systemPrompt) setSystemPrompt(saved.systemPrompt);
        if (topic) setTopicDoc(topic);
        if (design) setDesignDoc(design);
        if (prose) {
          setProseDoc(prose);
          setStory(mergeStory(emptyStory(), prose));
        }
        if (saved.messages?.length) setMessages(saved.messages);
        else if (remote.messages?.length) setMessages(remote.messages);
        if (saved.topicTitle) setTopicTitle(saved.topicTitle);
        if (saved.evalNote || remote.evalNote) setEvalNote(saved.evalNote || remote.evalNote);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveLocal({ systemPrompt, topicDoc, designDoc, proseDoc, messages, topicTitle, evalNote });
  }, [hydrated, systemPrompt, topicDoc, designDoc, proseDoc, messages, topicTitle, evalNote]);

  const nodeCount = Object.keys(story.nodes).length;
  const words = useMemo(() => storyWordCount(story), [story]);

  async function persistOutput(name: string, content: string) {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content }),
    }).catch(() => null);
  }

  async function run(userText: string, nextTab: Tab) {
    if (busy) return;
    setBusy(true);
    setError('');
    setTab(nextTab);
    setStatus('正在调用 DeepSeek V4.1 Flash…');
    const history: ChatMessage[] = [...messages, { role: 'user', content: userText }];
    const baseProse = proseDoc;
    const baseStory = story;
    let assembled = '';
    try {
      const full = await streamGenerate(systemPrompt, history, (text) => {
        assembled = text;
        if (nextTab === 'topic') setTopicDoc(text);
        if (nextTab === 'design') setDesignDoc(text);
        if (nextTab === 'prose') {
          const combined = baseProse ? `${baseProse.trim()}\n\n${text}` : text;
          setProseDoc(combined);
          setStory(mergeStory(baseStory, text));
        }
      });
      const nextMessages = [...history, { role: 'assistant', content: full }];
      setMessages(nextMessages);
      if (nextTab === 'topic') {
        setTopicDoc(full);
        await persistOutput('选题文档.md', full);
      }
      if (nextTab === 'design') {
        setDesignDoc(full);
        await persistOutput('故事设计文档.md', full);
      }
      if (nextTab === 'prose') {
        const combined = baseProse ? `${baseProse.trim()}\n\n${full}` : full;
        setProseDoc(combined);
        setStory(mergeStory(baseStory, full));
        await persistOutput('小说正文.md', combined);
      }
      setStatus('本轮生成完成。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
      if (assembled) {
        const nextMessages = [...history, { role: 'assistant', content: assembled }];
        setMessages(nextMessages);
      }
    } finally {
      setBusy(false);
    }
  }

  async function runProseLoop() {
    if (busy) return;
    abortBusy.current = false;
    setBusy(true);
    setError('');
    setTab('prose');
    let history = messages;
    let currentStory = story;
    let currentProse = proseDoc;
    try {
      const startPrompt = currentStory.meta
        ? PHASE_STARTERS.proseContinue('请写尚未完成的下一章，含本章全部分支与汇合节点。')
        : PHASE_STARTERS.proseStart;
      if (!currentStory.meta) {
        history = [...history, { role: 'user', content: startPrompt }];
        setStatus('正在写第一章…');
        const first = await streamGenerate(systemPrompt, history, (text) => {
          setProseDoc(text);
          setStory(mergeStory(emptyStory(), text));
        });
        history = [...history, { role: 'assistant', content: first }];
        currentProse = first;
        currentStory = mergeStory(emptyStory(), first);
        setMessages(history);
        setProseDoc(currentProse);
        setStory(currentStory);
      }

      for (let i = 0; i < 16; i++) {
        if (abortBusy.current) break;
        const endings = Object.values(currentStory.nodes).filter((n) => n.isEnding).length;
        const missing = Object.values(currentStory.nodes).flatMap((n) =>
          n.choices.filter((c) => !currentStory.nodes[c.next]).map((c) => c.next),
        );
        const count = storyWordCount(currentStory);
        if (endings >= 3 && missing.length === 0 && count >= 80000) break;
        if (endings >= 3 && missing.length === 0 && i >= 11) break;
        const hint =
          missing.length > 0
            ? `还缺这些节点：${[...new Set(missing)].slice(0, 12).join('、')}。请把它们和本章其余节点写完。当前汉字约 ${count}。`
            : `请写下一章的完整节点。已有节点 ${Object.keys(currentStory.nodes).length} 个，结局 ${endings} 个，汉字约 ${count}。目标约 10 万字，写到全部结局为止。`;
        setStatus(`连续写作中（第 ${i + 1} 轮）… ${hint}`);
        history = [...history, { role: 'user', content: PHASE_STARTERS.proseContinue(hint) }];
        const chunk = await streamGenerate(systemPrompt, history, (text) => {
          const live = `${currentProse.trim()}\n\n${text}`;
          setProseDoc(live);
          setStory(mergeStory(currentStory, text));
        });
        history = [...history, { role: 'assistant', content: chunk }];
        currentProse = `${currentProse.trim()}\n\n${chunk}`;
        currentStory = mergeStory(currentStory, chunk);
        setMessages(history);
        setProseDoc(currentProse);
        setStory(currentStory);
        await persistOutput('小说正文.md', currentProse);
      }
      setStatus(`连续写作结束。节点 ${Object.keys(currentStory.nodes).length}，汉字约 ${storyWordCount(currentStory)}。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '连续写作失败');
    } finally {
      setBusy(false);
    }
  }

  const currentDoc = tab === 'topic' ? topicDoc : tab === 'design' ? designDoc : proseDoc;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <b>火花创作 Studio</b>
          <span>INTERACTIVE NOVEL AGENT</span>
        </div>
        <div className="topbar-meta">
          <span>模型 <em>deepseek/deepseek-v4.1-flash</em></span>
          <span>节点 <em>{nodeCount}</em></span>
          <span>正文汉字 <em>{words}</em></span>
        </div>
      </header>
      <div className="workspace">
        <section className="left">
          <div className="pane-head">
            <div>
              <h2>SYSTEM PROMPT</h2>
              <p>写作 Agent 的指南，生成时会带上当前文本</p>
            </div>
            <button className="ghost" onClick={() => setSystemPrompt(SYSTEM_PROMPT)} disabled={busy}>
              恢复默认
            </button>
          </div>
          <textarea className="prompt-box" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
        </section>
        <section className="right">
          <div className="pane-head">
            <div className="tabs">
              {([
                ['topic', '选题文档'],
                ['design', '故事设计文档'],
                ['prose', '小说正文'],
              ] as const).map(([id, label]) => (
                <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </div>
            {tab === 'prose' ? (
              <button className="ghost" onClick={() => setShowSource((v) => !v)}>
                {showSource ? '打开阅读器' : '查看生成原文'}
              </button>
            ) : (
              <p>三类文档会分别留在对应页签</p>
            )}
          </div>

          {tab === 'prose' && nodeCount > 0 && !showSource ? (
            <Reader story={story} />
          ) : (
            <div className={`doc-body${currentDoc ? '' : ' empty'}`}>
              {evalNote && tab === 'topic' ? (
                <div className="eval-box">
                  <h3>PROMPT 评测</h3>
                  <Markdown remarkPlugins={[remarkGfm]}>{evalNote}</Markdown>
                </div>
              ) : null}
              {currentDoc ? (
                <div className="doc-paper">
                  <Markdown remarkPlugins={[remarkGfm]}>{currentDoc}</Markdown>
                </div>
              ) : (
                <div className="placeholder">
                  <p>
                    还没有{tab === 'topic' ? '选题' : tab === 'design' ? '故事设计' : '正文'}。
                  </p>
                  <p>
                    从 <b>生成选题</b> 开始。对话区可以直接改选题、人物、结局和文风；正文从序章写起。
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="composer">
            <div className="composer-actions">
              <button className="primary" disabled={busy} onClick={() => run(PHASE_STARTERS.topic, 'topic')}>
                生成选题
              </button>
              <button className="ghost" disabled={busy} onClick={() => run(PHASE_STARTERS.shortLoop, 'topic')}>
                短篇闭环选题
              </button>
              <input
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="确认的选题名"
                style={{
                  border: '1px solid var(--line)',
                  background: 'var(--panel)',
                  color: 'var(--text)',
                  borderRadius: 999,
                  padding: '6px 12px',
                  width: 180,
                }}
              />
              <button
                className="ghost"
                disabled={busy || !topicTitle.trim()}
                onClick={() => run(PHASE_STARTERS.design(topicTitle.trim()), 'design')}
              >
                确认选题并设计
              </button>
              <button
                className="ghost"
                disabled={busy || !designDoc}
                onClick={() => run(PHASE_STARTERS.proseStart, 'prose')}
              >
                写序章
              </button>
              <button
                className="ghost"
                disabled={busy || !story.meta}
                onClick={() =>
                  run(PHASE_STARTERS.proseContinue('请写下一章完整节点，含分支与汇合。'), 'prose')
                }
              >
                继续下一章
              </button>
              <button className="ghost" disabled={busy || !designDoc} onClick={runProseLoop}>
                连续写完全书
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="对话区可改稿，例如：「把女二改得更锋利」「结局不要只换陪着的人」「文风再冷一点，少抒情」「序章前八百字必须出现选择」"
            />
            <div className="composer-actions">
              <button
                className="primary"
                disabled={busy || !draft.trim()}
                onClick={() => {
                  const text = draft.trim();
                  setDraft('');
                  let next: Tab = tab;
                  if (/选题/.test(text)) next = 'topic';
                  else if (/设计|人物|角色|结局|情节/.test(text)) next = 'design';
                  else if (/正文|章节|序章|STORY|写完|文风/.test(text)) next = 'prose';
                  const payload = /改|重写|文风|不要|更|删|加/.test(text) ? PHASE_STARTERS.revise(text) : text;
                  run(payload, next);
                }}
              >
                发送
              </button>
              <span className={`status-line${error ? ' error' : ''}`}>{error || status}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
