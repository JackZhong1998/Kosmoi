export type BubbleNode = {
  id: string;
  label: string;
  level: number;
  x: number;
  y: number;
  px: number;
  py: number;
  parent?: string;
};

export function radius(node: BubbleNode) {
  const hash = Array.from(node.id).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const sizes =
    node.level === 0 ? [48, 54, 60, 66] : node.level === 1 ? [40, 46, 52, 56] : [34, 38, 44, 48];
  return sizes[hash % 4];
}

const GAP = 12;

export function restDistance(a: BubbleNode, b: BubbleNode) {
  return radius(a) + radius(b) + GAP;
}

export function childRingRadius(parent: BubbleNode, count: number, childR = 42) {
  const rest = radius(parent) + childR + GAP;
  const fit = count > 0 ? (count * (2 * childR + GAP)) / (2 * Math.PI) : 0;
  return Math.max(rest, fit);
}

function collide(nodes: BubbleNode[], pinned: Set<string>) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      if (d < 0.001) {
        const ang = i * 2.399 + j * 0.73;
        dx = Math.cos(ang);
        dy = Math.sin(ang);
        d = 1;
      }
      const min = restDistance(a, b);
      if (d >= min) continue;
      const push = min - d;
      const nx = dx / d;
      const ny = dy / d;
      const pinA = pinned.has(a.id);
      const pinB = pinned.has(b.id);
      if (pinA && !pinB) {
        b.x += nx * push;
        b.y += ny * push;
      } else if (pinB && !pinA) {
        a.x -= nx * push;
        a.y -= ny * push;
      } else {
        a.x -= nx * push * 0.5;
        a.y -= ny * push * 0.5;
        b.x += nx * push * 0.5;
        b.y += ny * push * 0.5;
      }
    }
  }
}

export function packBubbles(
  input: BubbleNode[],
  pinIds?: Iterable<string>,
  opts?: { compact?: boolean },
): BubbleNode[] {
  const nodes = input.map((n) => ({ ...n }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const pinned = new Set(pinIds ?? []);
  const compact = Boolean(opts?.compact);

  for (let step = 0; step < 200; step++) {
    let cx = 0;
    let cy = 0;
    for (const n of nodes) {
      cx += n.x;
      cy += n.y;
    }
    cx /= Math.max(nodes.length, 1);
    cy /= Math.max(nodes.length, 1);
    const gather = compact ? 0.028 : 0.018;
    for (const n of nodes) {
      if (pinned.has(n.id)) continue;
      n.x += (cx - n.x) * gather;
      n.y += (cy - n.y) * gather;
    }

    for (const n of nodes) {
      if (pinned.has(n.id) || !n.parent) continue;
      const p = byId.get(n.parent);
      if (!p) continue;
      const dx = p.x - n.x;
      const dy = p.y - n.y;
      const d = Math.hypot(dx, dy) || 1;
      const rest = restDistance(n, p);
      if (d <= rest + 0.5) continue;
      const pull = Math.min(0.14, ((d - rest) / d) * 0.12);
      n.x += dx * pull;
      n.y += dy * pull;
    }

    collide(nodes, pinned);
  }

  for (let step = 0; step < 140; step++) collide(nodes, pinned);

  if (compact) {
    let cx = 0;
    let cy = 0;
    for (const n of nodes) {
      cx += n.x;
      cy += n.y;
    }
    cx /= Math.max(nodes.length, 1);
    cy /= Math.max(nodes.length, 1);
    for (const n of nodes) {
      n.x -= cx;
      n.y -= cy;
      n.px -= cx;
      n.py -= cy;
    }
  }

  return nodes;
}

export function placeSeeds(
  seeds: { id: string; label: string; level: number; parent?: string }[],
): BubbleNode[] {
  const roots = seeds.filter((s) => !s.parent);
  const placed: BubbleNode[] = [];
  const byId = new Map<string, BubbleNode>();
  const dist = roots.length <= 3 ? 88 : 104;
  roots.forEach((item, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(roots.length, 1);
    const node: BubbleNode = {
      id: item.id,
      label: item.label,
      level: item.level,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      px: 0,
      py: 0,
    };
    placed.push(node);
    byId.set(node.id, node);
  });
  const children = seeds.filter((s) => s.parent);
  children.forEach((item, i) => {
    const parent = item.parent ? byId.get(item.parent) : undefined;
    const siblings = children.filter((c) => c.parent === item.parent);
    const idx = siblings.findIndex((c) => c.id === item.id);
    const dummy: BubbleNode = {
      id: item.id,
      label: item.label,
      level: item.level,
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      parent: item.parent,
    };
    const base = parent ? Math.atan2(parent.y, parent.x) : i * 2.39996;
    const ring = parent ? restDistance(parent, dummy) : 90;
    const angle = base + ((idx + 0.5) / Math.max(siblings.length, 1) - 0.5) * Math.min(2.0, siblings.length * 0.85);
    const ox = parent?.x ?? 0;
    const oy = parent?.y ?? 0;
    const node: BubbleNode = {
      ...dummy,
      x: ox + Math.cos(angle) * ring,
      y: oy + Math.sin(angle) * ring,
      px: ox,
      py: oy,
    };
    placed.push(node);
    byId.set(node.id, node);
  });
  return packBubbles(placed, undefined, { compact: true });
}
