/** Expands a chart value into a deterministic unit-dot grid. Signature data move. */
import { colorOf } from '../_shared/color.js';
import { canvasLayer, drawDots, gridLayout } from '../_shared/grid.js';
import { countTo } from '../_shared/count.js';
import { clamp, lerp, px } from '../_shared/timeline.js';

const stateOf = (ctx) =>
  ctx.beat.data.states?.find((s) => s.name === ctx.step?.name) ?? ctx.beat.data.states?.[0] ?? ctx.beat.data;
const valueOf = (data) => data.series?.[0]?.values?.[0] ?? data.value ?? 1;
const dotCount = (data, max) =>
  Math.min(max, Math.max(1, Math.round(valueOf(data) / (data.unitValue ?? data.unit ?? 1))));
const dotStart = (k, n) => 0.1 + 0.55 * (k / n) ** 0.7;
export default {
  id: 'dot-multiply',
  family: 'data',
  role: 'step',
  accepts: ['chart'],
  sources: ['unit-grid', 'particle-assemble', 'aggregate-split-merge', 'dot-regroup'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.8, min: 1, max: 3.5, doc: '전체 길이(u)' },
    cols: { type: 'integer', default: 18, min: 6, max: 60, doc: '격자 열 수' },
    gap: { type: 'number', default: 6, min: 2, max: 24, doc: '점 간격(px)' },
    maxDots: { type: 'integer', default: 2400, min: 50, max: 6000, doc: '점 개수 상한' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      next = stateOf(ctx),
      n = dotCount(next, params.maxDots),
      source = ctx.beat.anchor('mark').point;
    const cell = px(ctx, 5),
      origin = { x: source.x - (params.cols * (cell + params.gap)) / 2, y: source.y - cell * 3 };
    const cells = gridLayout({
      n,
      cols: params.cols,
      cell,
      gap: px(ctx, params.gap),
      origin,
      order: 'near',
      from: source,
    });
    const layer = canvasLayer(ctx),
      proxy = { p: 0 },
      accent = colorOf(ctx, 'accent');
    const paint = () =>
      drawDots(
        layer,
        cells.map((cell, i) => {
          const q = ctx.reduce ? 1 : clamp((proxy.p - dotStart(i + 1, n)) / 0.12, 0, 1);
          return { x: lerp(source.x, cell.x, q), y: lerp(source.y, cell.y, q) };
        }),
        { r: cell / 2, color: accent },
      );
    paint();
    tl.to(proxy, { p: 1, duration: ctx.reduce ? 0 : d * 0.8, ease: 'none', onUpdate: paint }, 0);
    const note = ctx.beat.part('note')[0];
    if (note) countTo(tl, note, { from: 1, to: n, at: d * 0.15, duration: d * 0.65, ease: 'none' });
    const old = [...ctx.beat.part('title'), ...ctx.beat.part('dek')].filter(
      (node) => node.closest?.('[data-state]')?.dataset.state !== ctx.step?.name,
    );
    const fresh = [...ctx.beat.part('title'), ...ctx.beat.part('dek')].filter(
      (node) => node.closest?.('[data-state]')?.dataset.state === ctx.step?.name,
    );
    if (fresh.length) {
      ctx.initial(fresh, { autoAlpha: 0, yPercent: 40 });
      tl.to(old, { autoAlpha: 0, yPercent: -40, duration: d * 0.3, ease: ctx.ease('in') }, d * 0.7);
      tl.to(fresh, { autoAlpha: 1, yPercent: 0, duration: d * 0.3, ease: ctx.ease('out') }, d * 0.7);
    }
  },
};
