/** Condenses a media iris into the first mark of a chart. */
import { transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { finishLink } from '../_shared/link.js';
import { frameSeqOf, scrubTo } from '../_shared/media.js';
import { seg } from '../_shared/timeline.js';

const circle = (radius, x, y) => `circle(${radius}% at ${x}% ${y}%)`;
export default {
  id: 'iris-to-dot',
  family: 'morph',
  role: 'link',
  accepts: ['chart'],
  sources: ['morph-match-cut', 'scale-swap', 'shape-morph', 'text-cutout-zoom'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.4, min: 0.8, max: 2.4, doc: '전체 길이(u)' },
    focusX: { type: 'number', default: 0.52, min: 0, max: 1, doc: 'focusX(안무 설명의 같은 이름)' },
    focusY: { type: 'number', default: 0.46, min: 0, max: 1, doc: 'focusY(안무 설명의 같은 이름)' },
    desaturate: { type: 'number', default: 1, min: 0, max: 1, doc: 'desaturate(안무 설명의 같은 이름)' },
  },
  handoff() {
    return { from: { part: 'frame' }, to: { part: 'mark', index: 0 } };
  },
  timing: (p) => ({ duration: p.duration ?? 1.4, stops: [] }),
  build(tl, ctx, p) {
    const { from, to } = ctx.handoff,
      d = p.duration,
      part = (a, b) => ({ duration: d * (b - a) });
    const marks = ctx.beat.part('mark'),
      axis = ctx.beat.part('axis'),
      title = ctx.beat.part('title');
    const carry = from.node;
    const startX = p.focusX * 100,
      startY = p.focusY * 100;
    const diameter = Math.max(to.rect.w, to.rect.h);
    const endRadius = (diameter / Math.max(ctx.viewport.w, ctx.viewport.h)) * 50;
    const dot = document.createElement('i');
    dot.className = 'sl-iris-to-dot__accent';
    ctx.overlay.append(dot);
    Object.assign(dot.style, {
      position: 'absolute',
      left: `${to.rect.x}px`,
      top: `${to.rect.y}px`,
      width: `${to.rect.w}px`,
      height: `${to.rect.h}px`,
      borderRadius: '50%',
      backgroundColor: colorOf(ctx, 'accent'),
    });
    ctx.initial(carry, {
      clipPath: circle(150, startX, startY),
      autoAlpha: 1,
      transformOrigin: '0 0',
      filter: 'brightness(1) saturate(1)',
    });
    ctx.initial(dot, { autoAlpha: 0 });
    ctx.initial(marks, { autoAlpha: 0 });
    ctx.initial(axis, { autoAlpha: 0 });
    ctx.initial(title, { autoAlpha: 0 });
    if (ctx.reduce) {
      finishLink(tl, ctx, { at: d, cross: 0.12, from: [from.node], to: [to.node] });
      return;
    }
    tl.to(
      carry,
      { clipPath: circle(endRadius, startX, startY), ...part(0, 0.45), ease: ctx.ease('inout') },
      0,
    );
    tl.to(
      carry,
      {
        ...transferVars(from.rect, to.rect),
        filter: `brightness(1.6) saturate(${1 - p.desaturate})`,
        ...part(0.35, 0.75),
        ease: ctx.ease('inout'),
      },
      d * 0.35,
    );
    const seq = frameSeqOf(ctx.from);
    if (seq) scrubTo(tl, seq, { from: 1, to: 1, at: 0, duration: d * 0.45 });
    tl.to(carry, { autoAlpha: 0, ...part(0.7, 0.85), ease: ctx.ease('in') }, d * 0.7);
    tl.to(dot, { autoAlpha: 1, ...part(0.7, 0.85), ease: ctx.ease('out') }, d * 0.7);
    tl.set(marks, { autoAlpha: 1 }, d * 0.85);
    tl.to(axis, { autoAlpha: 1, ...part(0.85, 1), ease: ctx.ease('out') }, d * 0.85);
    finishLink(tl, ctx, { at: d, cross: 0, from: [from.node], to: [to.node] });
  },
};
