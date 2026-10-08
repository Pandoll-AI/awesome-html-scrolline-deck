/** Carries a source unit grid into a destination bar chart. */
import { transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { canvasLayer, drawDots, gridLayout } from '../_shared/grid.js';
import { finishLink, ghost } from '../_shared/link.js';
import { drawOn } from '../_shared/stroke.js';
import { clamp, lerp, px } from '../_shared/timeline.js';

export default {
  id: 'dots-pour',
  family: 'data',
  role: 'link',
  accepts: ['chart'],
  sources: ['dot-regroup', 'unit-aggregate-transition', 'beeswarm-settling'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.8, min: 1, max: 3, doc: '전체 길이(u)' },
    toIndex: { type: 'integer', default: -1, min: -1, max: 40, doc: 'B 쪽 대상 index' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  handoff(params) {
    return { to: { part: 'mark', index: params.toIndex } };
  },
  build(tl, ctx, params) {
    const d = params.duration,
      to = ctx.handoff.to,
      from = ctx.handoff.from,
      target = to.rect;
    const carrier = ghost(ctx, from.node, from.rect);
    ctx.initial([carrier, from.node], { autoAlpha: 1 });
    tl.to(
      carrier,
      { ...transferVars(from.rect, target), duration: ctx.reduce ? 0 : d * 0.65, ease: ctx.ease('inout') },
      d * 0.1,
    );
    const n = Math.max(
      1,
      Math.round(
        (ctx.from.data.series?.[0]?.values?.at(-1) ?? 1) /
          (ctx.from.data.unitValue ?? ctx.from.data.unit ?? 1),
      ),
    );
    const layer = canvasLayer(ctx),
      dots = gridLayout({
        n,
        cols: Math.max(1, Math.round(target.w / px(ctx, 6))),
        cell: Math.max(1, target.w / Math.max(1, Math.round(target.w / px(ctx, 6)))),
        origin: { x: target.x, y: target.y },
        gap: 0,
      });
    const proxy = { p: 0 },
      paint = () =>
        drawDots(
          layer,
          dots.map((dot, i) => {
            const q = ctx.reduce ? 1 : clamp((proxy.p - (i / n) * 0.55) / 0.25, 0, 1);
            return { x: lerp(from.point.x, dot.x, q), y: lerp(from.point.y, dot.y, q) };
          }),
          { r: px(ctx, 2), color: colorOf(ctx, 'accent') },
        );
    paint();
    tl.to(proxy, { p: 1, duration: ctx.reduce ? 0 : d * 0.85, ease: 'none', onUpdate: paint }, 0);
    const baseline = ctx.beat.part('baseline')[0];
    if (baseline) drawOn(tl, baseline, { at: 0, duration: d * 0.2, ease: ctx.ease('out') });
    const marks = ctx.beat.part('mark');
    ctx.initial(marks, { autoAlpha: 0 });
    tl.to(marks, { autoAlpha: 1, duration: d * 0.5, stagger: d * 0.03, ease: ctx.ease('out') }, d * 0.3);
    const copy = [...ctx.beat.part('title'), ...ctx.beat.part('dek')];
    if (copy.length) {
      ctx.initial(copy, { autoAlpha: 0, yPercent: 40 });
      tl.to(copy, { autoAlpha: 1, yPercent: 0, duration: d * 0.15, ease: ctx.ease('out') }, d * 0.85);
    }
    finishLink(tl, ctx, { at: d, from: [ctx.handoff.from.node], to: [ctx.handoff.to.node] });
    tl.to(carrier, { autoAlpha: 0, duration: 0.001 }, d - 0.001);
  },
};
