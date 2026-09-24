'use client';

import { useState } from 'react';
import { layoutFlowPieces, type FlowNode, type FlowTree, type StoryStructure } from '@/lib/structure';
import { useLocale } from '@/components/LocaleProvider';

type Panel = 'flow' | 'nodes' | 'states';

const KIND_LABEL: Record<FlowNode['kind'], string> = {
  linear: '线性',
  choice: '选择',
  branch: '分支',
  merge: '汇合',
  ending: '结局',
};

export function StoryStructurePanel({
  data,
  pending = false,
  error = '',
  activeId = '',
  onOpen,
  onRetry,
  hint = '只显示最新一版。改设计后会整份重做。',
}: {
  data: StoryStructure | null;
  pending?: boolean;
  error?: string;
  activeId?: string;
  onOpen?: (id: string) => void;
  onRetry?: () => void;
  hint?: string;
}) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const [panel, setPanel] = useState<Panel>('flow');
  return (
    <section className="structure-panel" aria-label={en ? 'Nodes and flowchart' : '节点与流程图'}>
      <header className="structure-head">
        <div>
          <h3>{en ? 'Nodes and flow' : '节点与流程'}</h3>
          <p>{pending ? (en ? 'Rebuilding the flow, nodes, and state model from the latest design.' : '正在分三次按最新的故事设计重写。') : (en && hint === '只显示最新一版。改设计后会整份重做。' ? 'Only the latest version is shown. Changing the design rebuilds the structure.' : hint)}</p>
        </div>
        <div className="structure-switch" role="tablist" aria-label="结构分栏">
          {(
            [
              ['flow', en ? 'Flow' : '流程图'],
              ['nodes', en ? 'Nodes' : '节点表'],
              ['states', en ? 'State' : '状态表'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={panel === id} className={panel === id ? 'on' : ''} onClick={() => setPanel(id)}>
              {label}
            </button>
          ))}
        </div>
      </header>
      {error ? <p className="structure-error">{error}</p> : null}
      {pending && !data ? <p className="structure-pending">{en ? 'Writing the flowchart first, then nodes, then state.' : '先写流程图，再补节点表，最后写状态表。'}</p> : null}
      {!pending && !data && !error ? <p className="structure-pending">{en ? 'The flowchart, nodes, and state model will appear after the story design is ready.' : '故事设计写完后，流程图、节点表和状态表会出现在这里。'}</p> : null}
      {!pending && !data && onRetry ? (
        <button type="button" className="structure-retry" onClick={onRetry}>
          {en ? 'Rebuild structure' : '重新整理结构'}
        </button>
      ) : null}
      {data && panel === 'flow' ? <FlowChart data={data} activeId={activeId} onOpen={onOpen} /> : null}
      {data && panel === 'nodes' ? <NodeTable data={data} activeId={activeId} onOpen={onOpen} /> : null}
      {data && panel === 'states' ? <StateTable data={data} /> : null}
    </section>
  );
}

function FlowChart({
  data,
  activeId,
  onOpen,
}: {
  data: StoryStructure;
  activeId?: string;
  onOpen?: (id: string) => void;
}) {
  const trees = layoutFlowPieces(data.flowchart);
  if (!trees.length) return null;
  return (
    <div className="structure-flow">
      {trees.map((tree) => (
        <FlowTreeView key={tree.node.id} tree={tree} activeId={activeId} onOpen={onOpen} />
      ))}
    </div>
  );
}

function FlowTreeView({
  tree,
  activeId,
  onOpen,
}: {
  tree: FlowTree;
  activeId?: string;
  onOpen?: (id: string) => void;
}) {
  if (tree.type === 'node') {
    return (
      <div className="flow-chain">
        <FlowCard node={tree.node} active={activeId === tree.node.id} onOpen={onOpen} />
        {tree.next ? (
          <>
            <div className="flow-line" aria-hidden="true" />
            <FlowTreeView tree={tree.next} activeId={activeId} onOpen={onOpen} />
          </>
        ) : null}
      </div>
    );
  }
  return (
    <div className="flow-chain">
      <FlowCard node={tree.node} active={activeId === tree.node.id} onOpen={onOpen} />
      {tree.arms.length > 0 ? (
        <div className="flow-fork">
          <div className="flow-split" aria-hidden="true" />
          <div className="flow-fork-row">
            {tree.arms.map((arm) => (
              <div className="flow-fork-col" key={armId(arm)}>
                <FlowTreeView tree={arm} activeId={activeId} onOpen={onOpen} />
              </div>
            ))}
          </div>
          {tree.join ? <div className="structure-join" aria-hidden="true" /> : null}
        </div>
      ) : null}
      {tree.join ? (
        <>
          <div className="flow-line" aria-hidden="true" />
          <FlowTreeView tree={tree.join} activeId={activeId} onOpen={onOpen} />
        </>
      ) : null}
    </div>
  );
}

function armId(tree: FlowTree): string {
  return tree.node.id;
}

function FlowCard({ node, active, onOpen }: { node: FlowNode; active?: boolean; onOpen?: (id: string) => void }) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const kind = en ? ({ linear: 'Linear', choice: 'Choice', branch: 'Branch', merge: 'Merge', ending: 'Ending' } as const)[node.kind] : KIND_LABEL[node.kind];
  const mark = [kind, node.join, node.mergeAt ? `${en ? 'Merges at ' : '汇合于'}${node.mergeAt}` : '', node.ending].filter(Boolean).join(' · ');
  const note = [node.meaning, node.enter, node.stateChange && node.stateChange !== '无' ? node.stateChange : ''].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      className={`toc-card structure-card${active ? ' current' : ''}${node.kind === 'choice' ? ' choice' : ''}${node.kind === 'ending' ? ' ending' : ''}${node.kind === 'merge' ? ' merge' : ''}${node.kind === 'branch' ? ' branch' : ''}`}
      onClick={() => onOpen?.(node.id)}
    >
      <span>
        <em>{node.id}</em>
        {node.chapter ? <small>{node.chapter}</small> : null}
        {node.summary ? <small>{node.summary}</small> : null}
        {note ? <small>{note}</small> : null}
      </span>
      {mark ? <i>{mark}</i> : null}
    </button>
  );
}

function NodeTable({
  data,
  activeId,
  onOpen,
}: {
  data: StoryStructure;
  activeId?: string;
  onOpen?: (id: string) => void;
}) {
  const { locale } = useLocale();
  const en = locale === 'en';
  return (
    <div className="structure-list">
      {data.nodeState.nodes.map((node) => (
        <article key={node.id} className={`structure-node${activeId === node.id ? ' current' : ''}`}>
          <button type="button" onClick={() => onOpen?.(node.id)}>
            <b>{node.id}</b>
            <span>{node.chapter}</span>
          </button>
          <dl>
            <Row k={en ? 'Scene' : '场面'} v={node.whenWhereWho} />
            <Row k={en ? 'Entry' : '进入'} v={node.enter} />
            <Row k={en ? 'Purpose' : '目的'} v={node.purpose} />
            <Row k={en ? 'Desire' : '欲望'} v={node.desire} />
            <Row k={en ? 'Must happen' : '必须发生'} v={node.must} />
            <Row k={en ? 'Feedback' : '反馈'} v={node.feedback} />
            <Row k={en ? 'State' : '状态'} v={node.stateChange} />
            <Row k={en ? 'Settlement' : '结算'} v={node.settleWhen} />
            <Row k={en ? 'Impact' : '影响'} v={node.affects} />
            <Row k={en ? 'Next node' : '下一节点'} v={node.next} />
            <Row k={en ? 'Setup' : '伏笔'} v={node.plant} />
            <Row k={en ? 'Words' : '字数'} v={node.words} />
          </dl>
          {node.options.length > 0 ? (
            <ul>
              {node.options.map((option) => (
                <li key={option.text}>
                  {option.text}
                  {option.meaning ? <small>{option.meaning}</small> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function StateTable({ data }: { data: StoryStructure }) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const { play, stats, facts, choices, endings, simulations } = data.nodeState;
  return (
    <div className="structure-list">
      {play ? <p className="structure-play">{play}</p> : null}
      {stats.length > 0 ? (
        <article className="structure-node">
          <h4>{en ? 'Stats' : '数值'}</h4>
          {stats.map((stat) => (
            <p key={stat.name}>
              <b>{stat.name}</b> {stat.initial} ({stat.min}–{stat.max}){stat.visible ? ` · ${en ? 'Visible' : '可见'}` : ` · ${en ? 'Hidden' : '隐藏'}`}
              <small>
                {stat.means}
                {stat.step ? ` · ${stat.step}` : ''}
                {stat.affects ? ` · ${stat.affects}` : ''}
              </small>
            </p>
          ))}
        </article>
      ) : null}
      {facts.length > 0 ? (
        <article className="structure-node">
          <h4>{en ? 'Facts' : '事实'}</h4>
          {facts.map((fact) => (
            <p key={fact.key}>
              <b>{fact.key}</b> · {fact.use}
              <small>
                {fact.means}
                {fact.mutex ? ` · ${en ? 'Exclusive' : '互斥'}: ${fact.mutex}` : ''}
              </small>
            </p>
          ))}
        </article>
      ) : null}
      {choices.length > 0 ? (
        <article className="structure-node">
          <h4>{en ? 'Choice effects' : '选择效果'}</h4>
          {choices.map((choice) => (
            <p key={`${choice.node}-${choice.option}`}>
              <b>
                {choice.node} · {choice.option}
              </b>
              <small>
                {[choice.stats !== '无' ? choice.stats : '', choice.facts !== '无' ? `${en ? 'Remember' : '记下'} ${choice.facts}` : '', choice.settleWhen, choice.later]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </p>
          ))}
        </article>
      ) : null}
      {endings.length > 0 ? (
        <article className="structure-node">
          <h4>{en ? 'Ending conditions' : '结局条件'}</h4>
          {endings.map((ending) => (
            <p key={ending.name}>
              <b>{ending.name}</b> · {ending.trigger}
              {ending.priority ? ` · ${ending.priority}` : ''}
              <small>
                {[
                  ending.stats !== '无' ? `数值 ${ending.stats}` : '',
                  ending.events !== '无' ? `事件 ${ending.events}` : '',
                  ending.forbid !== '无' ? `排除 ${ending.forbid}` : '',
                  ending.finalChoice !== '无' ? `最后选择 ${ending.finalChoice}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ') || (en ? 'No additional threshold' : '无额外门槛')}
              </small>
            </p>
          ))}
        </article>
      ) : null}
      {simulations.length > 0 ? (
        <article className="structure-node">
          <h4>{en ? 'Route simulation' : '路线模拟'}</h4>
          {simulations.map((row) => (
            <p key={row.route}>
              <b>{row.route}</b> · {row.pass ? (en ? 'Pass' : '通过') : (en ? 'Fail' : '未通过')}
              <small>
                {row.choices ? `${row.choices} · ` : ''}
                {en ? 'Expected' : '预计'} {row.expected || '—'} · {en ? 'Actual' : '实际'} {row.actual || '—'}
                {row.stats ? ` · ${row.stats}` : ''}
              </small>
            </p>
          ))}
        </article>
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v || v === '无') return null;
  return (
    <div>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
