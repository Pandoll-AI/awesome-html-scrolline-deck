/** Folds a masked media glyph into a selected chart bar. */
import { toInset, transferVars } from '../../engine/index.js';
import { finishLink } from '../_shared/link.js';
import { applyTextMask, clearMask } from '../_shared/mask.js';
import { seg, slots } from '../_shared/timeline.js';

export default {
  id: 'glyph-to-bar',
  family: 'morph',
  role: 'link',
  accepts: ['chart'],
  sources: ['text-cutout-zoom', 'shape-morph', 'bar-grow'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.6, min: 0.8, max: 2.6, doc: '전체 길이(u)' },
    toIndex: { type: 'integer', default: 0, min: 0, max: 40, doc: 'B 쪽 대상 index' },
  },
  handoff(p) {
    return { from: { part: 'frame' }, to: { part: 'mark', index: p.toIndex } };
  },
  timing: (p) => ({ duration: p.duration ?? 1.6, stops: [] }),
  build(tl, ctx, p) {
    const { from, to } = ctx.handoff,
      d = p.duration,
      part = (a, b) => ({ duration: d * (b - a) });
    const caption = ctx.from.part('caption'),
      marks = ctx.beat.part('mark');
    const others = marks.filter((node) => node !== to.node && !ctx.skipNodes?.includes(node));
    const support = ['axis', 'label'].flatMap((name) => ctx.beat.part(name));
    const headings = ['title', 'dek'].flatMap((name) => ctx.beat.part(name));
    ctx.initial(from.node, { clipPath: 'inset(0% 0% 0% 0%)', transformOrigin: '0 0', autoAlpha: 1 });
    ctx.initial(to.node, { autoAlpha: 0 });
    ctx.initial(others, { scaleY: 0, transformOrigin: '50% 100%', autoAlpha: 0 });
    ctx.initial(support, { autoAlpha: 0 });
    ctx.initial(headings, { autoAlpha: 0 });
    if (caption.length) ctx.initial(caption, { autoAlpha: 1 });
    if (ctx.reduce) {
      finishLink(tl, ctx, { at: d, cross: 0.12 });
      return;
    }
    applyTextMask(ctx, from.node, ctx.from.data?.value?.toString?.() ?? '', { rect: from.rect });
    if (caption.length) tl.to(caption, { autoAlpha: 0, ...part(0, 0.3), ease: ctx.ease('in') }, 0);
    clearMask(tl, from.node, d * 0.3);
    tl.to(
      from.node,
      {
        ...transferVars(from.rect, to.rect),
        clipPath: toInset(to.rect, ctx.viewport),
        ...part(0.25, 0.65),
        ease: ctx.ease('inout'),
      },
      d * 0.25,
    );
    tl.to(from.node, { autoAlpha: 0, ...part(0.6, 0.75), ease: ctx.ease('in') }, d * 0.6);
    tl.to(to.node, { autoAlpha: 1, ...part(0.6, 0.75), ease: ctx.ease('out') }, d * 0.6);
    if (support.length)
      tl.to(support, { autoAlpha: 1, ...part(0.55, 0.75), ease: ctx.ease('out') }, d * 0.55);
    slots(others.length, { start: d * 0.55, span: d * 0.2, each: d * 0.04 }).forEach((slot) =>
      tl.to(others, { scaleY: 1, autoAlpha: 1, duration: d * 0.2, ease: ctx.ease('land') }, slot.at),
    );
    if (headings.length) tl.to(headings, { autoAlpha: 1, ...part(0.85, 1), ease: ctx.ease('out') }, d * 0.85);
    finishLink(tl, ctx, { at: d, cross: 0, from: [from.node], to: [to.node] });
  },
};
