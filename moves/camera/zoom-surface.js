/** Surface from a deep frame into its port inside the enclosing beat. */
import { transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { finishLink, ghost } from '../_shared/link.js';
import { px } from '../_shared/timeline.js';

const boxRect = (rect, box) => ({
  x: rect.x + rect.w * box.x,
  y: rect.y + rect.h * box.y,
  w: rect.w * box.w,
  h: rect.h * box.h,
});
const center = (rect) => ({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });
const originFor = (rect, fixed) => `${fixed.x - rect.x}px ${fixed.y - rect.y}px`;
const unique = (nodes) => [...new Set(nodes)];
const rectFor = (beat, node) => {
  for (const [name, nodes] of Object.entries(beat.parts)) {
    const index = nodes.indexOf(node);
    if (index >= 0) return beat.anchor(name, index).rect;
  }
  return { x: 0, y: 0, w: 0, h: 0 };
};
const worldParts = (beat, hud, ctx) => {
  const all = unique(
    Object.entries(beat.parts)
      .filter(([name]) => !hud.has(name) && !ctx.skipParts.includes(name))
      .flatMap(([, nodes]) => nodes)
      .filter((node) => !ctx.skipNodes?.includes(node)),
  );
  return all.filter((node) => !all.some((other) => other !== node && other.contains(node)));
};
const hudParts = (beat, names, ctx) =>
  unique(names.flatMap((name) => beat.part(name))).filter(
    (node) => !ctx.skipParts.includes(node.dataset.part) && !ctx.skipNodes?.includes(node),
  );
const autoK = (port, frame, tokens) =>
  Math.min(
    tokens.diveKMax ?? 40,
    1 / ((tokens.diveFill ?? 0.86) * Math.min(port.w / frame.w, port.h / frame.h)),
  );

function ring(ctx, rect) {
  const pad = 10;
  const node = document.createElement('div');
  node.className = 'sl-zoom-ring';
  Object.assign(node.style, {
    position: 'absolute',
    border: `2px solid ${colorOf(ctx, 'accent')}`,
    pointerEvents: 'none',
  });
  ctx.overlay.append(node);
  return {
    node,
    start: { left: rect.x - 24, top: rect.y - 24, width: rect.w + 48, height: rect.h + 48 },
    end: { left: rect.x - pad, top: rect.y - pad, width: rect.w + pad * 2, height: rect.h + pad * 2 },
  };
}

export default {
  id: 'zoom-surface',
  family: 'camera',
  role: 'link',
  accepts: ['chart', 'number', 'compare', 'photo', 'video', 'text'],
  sources: ['infinite-zoom', 'scale-swap', 'zoom-to-detail', 'focus-contraction'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 2.2, min: 1.2, max: 4, doc: '전체 길이(u)' },
    fromPart: { type: 'part', default: '', doc: 'A frame part. 비우면 primary' },
    toPart: { type: 'part', default: '', doc: 'B 포트 part. 비우면 primary' },
    toIndex: { type: 'integer', default: 0, min: 0, max: 31, doc: 'B 포트 요소 index' },
    toBox: { type: 'object', default: { x: 0, y: 0, w: 1, h: 1 }, doc: '포트 안 부분 상자(0..1)' },
    k: { type: 'number', default: 0, min: 0, max: 60, doc: '0=자동, 아니면 4..60 배율' },
    hudParts: {
      type: 'array',
      default: ['title', 'note', 'source', 'legend', 'caption', 'verdict'],
      doc: '배율에서 제외할 HUD part',
    },
    ease: { type: 'ease', default: 'dive', doc: 'dive | none | in | out' },
    keepRing: { type: 'boolean', default: true, doc: '끝난 뒤 링을 남긴다' },
  },
  handoff(params) {
    return {
      from: { part: params.fromPart || undefined },
      to: { part: params.toPart || undefined, index: params.toIndex },
    };
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const d = params.duration;
    const port = boxRect(ctx.handoff.to.rect, params.toBox),
      frame = ctx.handoff.from.rect;
    const k = Math.max(1.01, params.k || autoK(port, frame, ctx.tokens));
    const P = center(port),
      F = center(frame);
    const fixed = { x: (k * P.x - F.x) / (k - 1), y: (k * P.y - F.y) / (k - 1) };
    const hudNames = new Set(params.hudParts);
    if (ctx.from.type === 'number') hudNames.add('label');
    if (ctx.beat.type === 'number') hudNames.add('label');
    const fromWorld = worldParts(ctx.from, hudNames, { ...ctx, skipParts: [], skipNodes: [] });
    const toWorld = worldParts(ctx.beat, hudNames, ctx);
    const fromHud = hudParts(ctx.from, [...hudNames], { ...ctx, skipParts: [], skipNodes: [] });
    const toHud = hudParts(ctx.beat, [...hudNames], ctx);
    const carrier = ghost(ctx, ctx.handoff.from.node, ctx.handoff.from.rect);
    carrier.classList.add('sl-zoom-carrier');
    const focusRing = ring(ctx, port);
    ctx.initial(carrier, { autoAlpha: 1, transformOrigin: '0 0' });
    fromWorld.forEach((node) =>
      ctx.initial(node, {
        scale: 1,
        autoAlpha: 1,
        transformOrigin: originFor(rectFor(ctx.from, node), fixed),
      }),
    );
    toWorld.forEach((node) =>
      ctx.initial(node, {
        scale: ctx.reduce ? 1 : k,
        autoAlpha: 0,
        transformOrigin: originFor(rectFor(ctx.beat, node), fixed),
      }),
    );
    ctx.initial(fromHud, { autoAlpha: 1, y: 0 });
    ctx.initial(toHud, { autoAlpha: 0, y: px(ctx, 16), filter: ctx.reduce ? 'none' : 'blur(4px)' });
    ctx.initial(focusRing.node, { ...focusRing.start, autoAlpha: 0 });
    if (ctx.reduce) {
      tl.to(fromWorld, { autoAlpha: 0, duration: d * 0.5, ease: ctx.ease('in') }, 0);
      tl.to(
        toWorld.filter((node) => node !== ctx.handoff.to.node),
        { autoAlpha: 1, duration: d * 0.5, ease: ctx.ease('out') },
        d * 0.5,
      );
    } else {
      const midpoint = 1 / Math.sqrt(k),
        nonTarget = toWorld.filter((node) => node !== ctx.handoff.to.node);
      tl.to(fromWorld, { scale: midpoint, duration: d * 0.5, ease: ctx.ease(params.ease) }, 0);
      tl.to(toWorld, { scale: Math.sqrt(k), duration: d * 0.5, ease: ctx.ease(params.ease) }, 0);
      tl.to(fromWorld, { scale: 1 / k, duration: d * 0.5, ease: ctx.ease(params.ease) }, d * 0.5);
      tl.to(toWorld, { scale: 1, duration: d * 0.5, ease: ctx.ease(params.ease) }, d * 0.5);
      if (nonTarget.length)
        tl.to(nonTarget, { autoAlpha: 1, duration: d * 0.35, ease: ctx.ease('out') }, d * 0.05);
      tl.to(fromWorld, { autoAlpha: 0, duration: d * 0.35, ease: ctx.ease('in') }, d * 0.6);
    }
    tl.to(fromHud, { y: -px(ctx, 12), autoAlpha: 0, duration: d * 0.1, ease: ctx.ease('in') }, 0);
    tl.to(toHud, { y: 0, autoAlpha: 1, filter: 'none', duration: d * 0.12, ease: ctx.ease('out') }, d * 0.88);
    tl.to(
      focusRing.node,
      { ...focusRing.end, autoAlpha: params.keepRing ? 0.9 : 0, duration: d * 0.35, ease: ctx.ease('out') },
      d * 0.6,
    );
    tl.to(
      carrier,
      {
        ...transferVars(ctx.handoff.from.rect, ctx.handoff.to.rect),
        autoAlpha: 0,
        duration: d * 0.15,
        ease: ctx.ease('in'),
      },
      d * 0.8,
    );
    finishLink(tl, ctx, { at: d, cross: 0.15, from: [ctx.handoff.from.node], to: [ctx.handoff.to.node] });
    tl.set(toWorld, { scale: 1 }, d);
    tl.set(toHud, { filter: 'none', y: 0, autoAlpha: 1 }, d);
  },
};
