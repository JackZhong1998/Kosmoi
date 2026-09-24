'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import {
  packBubbles,
  placeSeeds,
  radius,
  restDistance,
  type BubbleNode,
} from '@/lib/bubble-layout';
import { getChildren, getGardenSeeds, type Audience } from '@/lib/topic-tags';

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <path
        d="M3.2 8.2 6.4 11.3 12.8 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function chainOf(nodes: BubbleNode[], node: BubbleNode): BubbleNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const chain: BubbleNode[] = [];
  let cur: BubbleNode | undefined = node;
  while (cur) {
    chain.unshift(cur);
    cur = cur.parent ? byId.get(cur.parent) : undefined;
  }
  return chain;
}

export function BubbleGarden({
  audience,
  onChange,
  locale = 'zh',
}: {
  audience: Audience;
  onChange: (labels: string[]) => void;
  locale?: 'en' | 'zh';
}) {
  const seeds = useMemo(() => getGardenSeeds(audience, locale), [audience, locale]);
  const [nodes, setNodes] = useState<BubbleNode[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const pan = useRef({ x: 0, y: 0 });
  const drag = useRef({ id: -1, x: 0, y: 0, moved: false });
  const known = useRef(new Set<string>());
  const lastPick = useRef({ id: '', at: 0 });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function applyPan() {
    const el = world.current;
    if (!el) return;
    el.style.transform = `translate(${pan.current.x}px, ${pan.current.y}px)`;
  }

  useEffect(() => {
    known.current = new Set();
    setNodes(placeSeeds(seeds));
    setSelected([]);
    onChangeRef.current([]);
    pan.current = { x: 0, y: 0 };
    applyPan();
  }, [seeds]);

  useEffect(() => {
    for (const node of nodes) known.current.add(node.id);
  }, [nodes]);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      pan.current.x -= event.deltaX;
      pan.current.y -= event.deltaY;
      applyPan();
    };
    el.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', onWheel, true);
  }, []);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (drag.current.id !== event.pointerId) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (!drag.current.moved) {
      if (Math.hypot(dx, dy) < 10) return;
      drag.current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
    pan.current.x += dx;
    pan.current.y += dy;
    applyPan();
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (drag.current.id !== event.pointerId) return;
    drag.current.id = -1;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function pick(node: BubbleNode) {
    if (drag.current.moved) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (lastPick.current.id === node.id && now - lastPick.current.at < 400) return;
    lastPick.current = { id: node.id, at: now };
    const chain = chainOf(nodes, node);
    const isTip = selected.length === chain.length && selected[selected.length - 1] === node.id;
    const next = isTip ? chain.slice(0, -1) : chain;
    setSelected(next.map((item) => item.id));
    onChangeRef.current(next.map((item) => item.label));
    if (isTip || node.level >= 2) return;
    const children = getChildren(audience, node.id.split('/'), locale);
    const shown = new Set(nodes.filter((n) => n.parent === node.id).map((n) => n.label));
    const labels = children.filter((label) => !shown.has(label));
    if (!labels.length) return;
    const parent = node.parent ? nodes.find((n) => n.id === node.parent) : undefined;
    const direction = parent
      ? Math.atan2(node.y - parent.y, node.x - parent.x)
      : Math.atan2(node.y, node.x);
    const born = labels.map((label, i) => {
      const child: BubbleNode = {
        id: `${node.id}/${label}`,
        label,
        level: node.level + 1,
        x: 0,
        y: 0,
        px: node.x,
        py: node.y,
        parent: node.id,
      };
      const dist = restDistance(node, child);
      const angle = direction + ((i + 0.5) / labels.length) * Math.PI * 2;
      child.x = node.x + Math.cos(angle) * dist;
      child.y = node.y + Math.sin(angle) * dist;
      return child;
    });
    setNodes(packBubbles([...nodes, ...born], [node.id]));
  }

  return (
    <div
      className="water-viewport"
      ref={viewport}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="water-world" ref={world}>
        <div className="water-glow" />
        {nodes.map((node) => {
          const r = radius(node);
          const picked = selected.includes(node.id);
          const fresh = !known.current.has(node.id);
          return (
            <button
              key={node.id}
              type="button"
              data-orb={node.id}
              draggable={false}
              aria-pressed={picked}
              className={`water-orb level-${Math.min(node.level, 2)}${picked ? ' picked' : ''}${fresh ? ' fresh' : ''}`}
              style={
                {
                  left: node.x,
                  top: node.y,
                  width: r * 2,
                  height: r * 2,
                  marginLeft: -r,
                  marginTop: -r,
                } as CSSProperties
              }
              onClick={(event) => {
                event.preventDefault();
                pick(node);
              }}
            >
              <span>{node.label}</span>
              {picked ? (
                <i className="orb-check">
                  <CheckIcon />
                </i>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
