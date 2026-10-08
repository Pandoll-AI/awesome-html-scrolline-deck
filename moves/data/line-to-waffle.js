/** Expands the selected line endpoint into a percentage waffle. */
import { transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { canvasLayer, drawDots, gridLayout } from '../_shared/grid.js';
import { finishLink, ghost } from '../_shared/link.js';
import { clamp } from '../_shared/timeline.js';

export default {
  id: 'line-to-waffle',
  family: 'data',
  role: 'link',
  accepts: ['chart'],
  sources: ['unit-grid', 'scale-swap', 'fractional-icon-fill'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.6, min: 0.8, max: 2.6, doc: '전체 길이(u)' },
    cols: { type: 'integer', default: 10, min: 5, max: 20, doc: '격자 열 수' },
    cells: { type: 'integer', default: 100, min: 20, max: 400, doc: '격자 칸 수' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  handoff() {
    return { from: { part: 'mark', index: -1 } };
  },
  build(tl, ctx, params) {
    const d = params.duration,
      from = ctx.handoff.from,
      to = ctx.handoff.to,
      carrier = ghost(ctx, from.node, from.rect);
    const size = Math.min(to.rect.w, to.rect.h) * 0.8,
      cell = size / params.cols,
      origin = { x: to.point.x - size / 2, y: to.point.y - size / 2 };
    const cells = gridLayout({
      n: params.cells,
      cols: params.cols,
      cell,
      origin,
      from: to.point,
      order: 'near',
    });
    const value = ctx.from.data.series?.[0]?.values?.at(-1) ?? ctx.from.data.value ?? 0,
      lit = clamp(Math.round((value * params.cells) / 100), 0, params.cells);
    const layer = canvasLayer(ctx),
      proxy = { p: 0 },
      paint = () => {
        const shown = cells.filter(
          (_, i) => ctx.reduce || proxy.p >= 0.45 + Math.min(0.4, (i / params.cells) * 0.4),
        );
        drawDots(layer, shown.slice(0, lit), { r: cell * 0.38, color: colorOf(ctx, 'accent') });
        drawDots(layer, shown.slice(lit), { r: cell * 0.38, color: colorOf(ctx, 'rule') });
      };
    ctx.initial([carrier, from.node], { autoAlpha: 1 });
    tl.to(
      carrier,
      { ...transferVars(from.rect, to.rect), duration: ctx.reduce ? 0 : d * 0.35, ease: ctx.ease('inout') },
      d * 0.2,
    );
    paint();
    tl.to(proxy, { p: 1, duration: ctx.reduce ? 0 : d * 0.85, ease: 'none', onUpdate: paint }, 0);
    const copy = [...ctx.beat.part('title'), ...ctx.beat.part('dek'), ...ctx.beat.part('label')];
    if (copy.length) {
      ctx.initial(copy, { autoAlpha: 0, yPercent: 40 });
      tl.to(copy, { autoAlpha: 1, yPercent: 0, duration: d * 0.2, ease: ctx.ease('out') }, d * 0.8);
    }
    finishLink(tl, ctx, { at: d });
    tl.to(carrier, { autoAlpha: 0, duration: 0.001 }, d - 0.001);
    // The canvas uses value-coloring when painted; the count is retained for tests/data auditing.
    layer.canvas.dataset.litCells = String(lit);
  },
};
