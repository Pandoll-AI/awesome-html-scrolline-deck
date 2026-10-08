/** Recounts a chart percentage waffle for the current chart state. */
import { colorOf } from '../_shared/color.js';
import { countTo } from '../_shared/count.js';
import { canvasLayer, drawDots, gridLayout } from '../_shared/grid.js';
import { clamp, px } from '../_shared/timeline.js';

const stateOf = (ctx) =>
  ctx.beat.data.states?.find((s) => s.name === ctx.step?.name) ?? ctx.beat.data.states?.[0] ?? ctx.beat.data;
const valueAt = (data, index) => data.series?.[0]?.values?.[index] ?? data.value ?? 0;
export default {
  id: 'waffle-recount',
  family: 'data',
  role: 'step',
  accepts: ['chart'],
  sources: ['unit-grid', 'color-encoding-transition'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.2, min: 0.6, max: 2.4, doc: '전체 길이(u)' },
    index: { type: 'integer', default: 1, min: 0, max: 10, doc: '대상 요소 index' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      old = valueAt(ctx.beat.data, params.index),
      next = valueAt(stateOf(ctx), params.index);
    const a = clamp(Math.round(old), 0, 100),
      b = clamp(Math.round(next), 0, 100),
      layer = canvasLayer(ctx),
      proxy = { p: 0 };
    const rect = ctx.beat.anchor('plot').rect,
      cell = Math.min(rect.w, rect.h) / 12,
      cells = gridLayout({
        n: 100,
        cols: 10,
        cell,
        gap: cell * 0.12,
        origin: { x: rect.x + cell, y: rect.y + cell },
      });
    const paint = () => {
      const current = ctx.reduce ? b : Math.round(a + (b - a) * proxy.p);
      drawDots(layer, cells.slice(0, current), { r: cell * 0.38, color: colorOf(ctx, 'accent') });
      drawDots(layer, cells.slice(current), { r: cell * 0.38, color: colorOf(ctx, 'rule') });
    };
    paint();
    tl.to(proxy, { p: 1, duration: ctx.reduce ? 0 : d * 0.65, ease: 'none', onUpdate: paint }, d * 0.1);
    const note = ctx.beat.part('note')[0];
    if (note) countTo(tl, note, { from: a, to: b, at: d * 0.2, duration: d * 0.55, ease: 'none' });
    const label = ctx.beat.part('label');
    if (label.length)
      tl.to(label, { color: colorOf(ctx, 'fg-muted'), duration: d * 0.1, ease: ctx.ease('out') }, 0);
    const previous = [...ctx.beat.part('title'), ...ctx.beat.part('dek')].filter(
      (node) => node.closest?.('[data-state]')?.dataset.state !== ctx.step?.name,
    );
    const fresh = [...ctx.beat.part('title'), ...ctx.beat.part('dek')].filter(
      (node) => node.closest?.('[data-state]')?.dataset.state === ctx.step?.name,
    );
    if (fresh.length) {
      ctx.initial(fresh, { autoAlpha: 0, yPercent: 40 });
      tl.to(previous, { autoAlpha: 0, yPercent: -40, duration: d * 0.25, ease: ctx.ease('in') }, d * 0.65);
      tl.to(fresh, { autoAlpha: 1, yPercent: 0, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.65);
    }
  },
};
