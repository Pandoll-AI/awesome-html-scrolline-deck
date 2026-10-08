/** Dive through a selected port into the next beat's already-contained world. */
import { transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { gridLayout } from '../_shared/grid.js';
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
const includes = (nodes, node) => nodes.some((other) => other !== node && other.contains(node));
const unique = (nodes) => [...new Set(nodes)];
const rectFor = (beat, node) => {
  for (const [name, nodes] of Object.entries(beat.parts)) {
    const index = nodes.indexOf(node);
    if (index >= 0) return beat.anchor(name, index).rect;
  }
  return { x: 0, y: 0, w: 0, h: 0 };
};
const worldParts = (beat, hud, ctx) =>
  unique(
    Object.entries(beat.parts)
      .filter(([name]) => !hud.has(name) && !ctx.skipParts.includes(name))
      .flatMap(([, nodes]) => nodes)
      .filter((node) => !ctx.skipNodes?.includes(node)),
  ).filter((node, _, all) => !includes(all, node));
const hudParts = (beat, names, ctx) =>
  unique(names.flatMap((name) => beat.part(name))).filter(
    (node) => !ctx.skipParts.includes(node.dataset.part) && !ctx.skipNodes?.includes(node),
  );
const autoK = (port, frame, tokens) =>
  Math.min(
    tokens.diveKMax ?? 40,
    1 / ((tokens.diveFill ?? 0.86) * Math.min(port.w / frame.w, port.h / frame.h)),
  );

function corners(ctx, rect) {
  const accent = colorOf(ctx, 'accent');
  const length = ctx.tokens.cornerLen ?? 28;
  const positions = gridLayout({ n: 4, cols: 2, cell: 1 }).map(({ i }) => [i % 2, Math.floor(i / 2)]);
  return positions.map(([column, row]) => {
    const corner = document.createElement('i');
    corner.className = 'sl-zoom-corner';
    Object.assign(corner.style, {
      position: 'absolute',
      left: `${rect.x + (column ? rect.w - length : 0)}px`,
      top: `${rect.y + (row ? rect.h - length : 0)}px`,
      width: `${length}px`,
      height: `${length}px`,
      borderColor: accent,
      borderStyle: 'solid',
      borderWidth: `${row ? 0 : 1.5}px ${column ? 0 : 1.5}px ${row ? 1.5 : 0}px ${column ? 1.5 : 0}px`,
      pointerEvents: 'none',
    });
    ctx.overlay.append(corner);
    return corner;
  });
}

export default {
  id: 'zoom-dive',
  family: 'camera',
  role: 'link',
  accepts: ['chart', 'number', 'compare', 'photo', 'video', 'text'],
  sources: ['infinite-zoom', 'zoom-to-detail', 'zoom-through', 'giant-mask-reveal', 'push-in'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 2.4, min: 1.4, max: 4, doc: '전체 길이(u)' },
    fromPart: { type: 'part', default: '', doc: 'A 포트 part. 비우면 primary' },
    fromIndex: { type: 'integer', default: 0, min: 0, max: 31, doc: 'A 포트 요소 index' },
    fromBox: { type: 'object', default: { x: 0, y: 0, w: 1, h: 1 }, doc: '포트 안 부분 상자(0..1)' },
    toPart: { type: 'part', default: '', doc: 'B frame part. 비우면 primary' },
    k: { type: 'number', default: 0, min: 0, max: 60, doc: '0=자동, 아니면 4..60 배율' },
    hudParts: {
      type: 'array',
      default: ['title', 'note', 'source', 'legend', 'caption', 'verdict'],
      doc: '배율에서 제외할 HUD part',
    },
    ease: { type: 'ease', default: 'dive', doc: 'dive | none | in | out' },
    corners: { type: 'boolean', default: true, doc: '도착 frame viewfinder 표시' },
  },
  handoff(params) {
    return {
      from: { part: params.fromPart || undefined, index: params.fromIndex },
      to: { part: params.toPart || undefined },
    };
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const d = params.duration;
    const port = boxRect(ctx.handoff.from.rect, params.fromBox);
    const frame = ctx.handoff.to.rect;
    const k = Math.max(1.01, params.k || autoK(port, frame, ctx.tokens));
    const P = center(port),
      F = center(frame);
    const fixed = { x: (k * P.x - F.x) / (k - 1), y: (k * P.y - F.y) / (k - 1) };
    const hudNames = new Set(params.hudParts);
    const fromWorld = worldParts(ctx.from, hudNames, { ...ctx, skipParts: [], skipNodes: [] });
    const toWorld = worldParts(ctx.beat, hudNames, ctx);
    const fromHud = hudParts(ctx.from, params.hudParts, { ...ctx, skipParts: [], skipNodes: [] });
    const toHud = hudParts(ctx.beat, params.hudParts, ctx);
    const carrier = ghost(ctx, ctx.handoff.from.node, ctx.handoff.from.rect);
    carrier.classList.add('sl-zoom-carrier');
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
        scale: ctx.reduce ? 1 : 1 / k,
        autoAlpha: 0,
        transformOrigin: originFor(rectFor(ctx.beat, node), fixed),
      }),
    );
    ctx.initial(fromHud, { autoAlpha: 1, y: 0 });
    ctx.initial(toHud, { autoAlpha: 0, y: px(ctx, 16), filter: ctx.reduce ? 'none' : 'blur(4px)' });
    const finder = params.corners ? corners(ctx, frame) : [];
    ctx.initial(finder, { autoAlpha: 1 });
    if (ctx.reduce) {
      tl.to(fromWorld, { autoAlpha: 0, duration: d * 0.5, ease: ctx.ease('in') }, 0);
      tl.to(
        toWorld.filter((node) => node !== ctx.handoff.to.node),
        { autoAlpha: 1, duration: d * 0.5, ease: ctx.ease('out') },
        d * 0.5,
      );
      tl.to(
        carrier,
        {
          ...transferVars(ctx.handoff.from.rect, frame),
          autoAlpha: 0,
          duration: d * 0.15,
          ease: ctx.ease('in'),
        },
        d * 0.85,
      );
    } else {
      const midpoint = Math.sqrt(k),
        nonTarget = toWorld.filter((node) => node !== ctx.handoff.to.node);
      tl.to(fromWorld, { scale: midpoint, duration: d * 0.5, ease: ctx.ease(params.ease) }, 0);
      tl.to(toWorld, { scale: 1 / midpoint, duration: d * 0.5, ease: ctx.ease(params.ease) }, 0);
      tl.to(fromWorld, { scale: k, duration: d * 0.5, ease: ctx.ease(params.ease) }, d * 0.5);
      tl.to(toWorld, { scale: 1, duration: d * 0.5, ease: ctx.ease(params.ease) }, d * 0.5);
      if (nonTarget.length)
        tl.to(nonTarget, { autoAlpha: 1, duration: d * 0.35, ease: ctx.ease('out') }, d * 0.1);
      tl.to(fromWorld, { autoAlpha: 0, duration: d * 0.3, ease: ctx.ease('in') }, d * 0.55);
      tl.to(
        carrier,
        {
          ...transferVars(ctx.handoff.from.rect, frame),
          autoAlpha: 0,
          duration: d * 0.15,
          ease: ctx.ease('in'),
        },
        d * 0.7,
      );
    }
    tl.to(fromHud, { y: -px(ctx, 12), autoAlpha: 0, duration: d * 0.12, ease: ctx.ease('in') }, 0);
    tl.to(toHud, { y: 0, autoAlpha: 1, filter: 'none', duration: d * 0.12, ease: ctx.ease('out') }, d * 0.88);
    if (!ctx.reduce) tl.to(finder, { autoAlpha: 0, duration: d * 0.12, ease: ctx.ease('in') }, d * 0.88);
    finishLink(tl, ctx, { at: d, cross: 0.15, from: [ctx.handoff.from.node], to: [ctx.handoff.to.node] });
    tl.set(toWorld, { scale: 1 }, d);
    tl.set(toHud, { filter: 'none', y: 0, autoAlpha: 1 }, d);
  },
};
