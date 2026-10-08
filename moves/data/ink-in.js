/** Lays a dashed memory of a line down, then inks it up to a selected point. */
import { colorOf } from '../_shared/color.js';
import { polyline, svgLayer, drawOn } from '../_shared/stroke.js';

const part = (ctx, name) => (ctx.skipParts.includes(name) ? [] : ctx.beat.part(name));
const pts = (node) =>
  (node.getAttribute('d')?.match(/-?\d*\.?\d+/g) ?? []).reduce(
    (a, n, i, x) => (i % 2 ? a : [...a, { x: Number(n), y: Number(x[i + 1]) }]),
    [],
  );
export default {
  id: 'ink-in',
  family: 'data',
  role: 'enter',
  accepts: ['chart'],
  sources: ['outline-then-fill', 'line-draw'],
  reduce: 'fade',
  params: {
    duration: { type: 'number', default: 1.2, min: 0.6, max: 2.4, doc: '전체 길이(u)' },
    upto: { type: 'integer', default: -1, min: -1, max: 40, doc: 'upto(안무 설명의 같은 이름)' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      paths = part(ctx, 'mark').filter((n) => n.tagName?.toLowerCase() === 'path'),
      dots = part(ctx, 'mark').filter((n) => n.tagName?.toLowerCase() !== 'path');
    ctx.initial(part(ctx, 'axis'), { autoAlpha: 0 });
    tl.to(part(ctx, 'axis'), { autoAlpha: 1, duration: d * 0.25, ease: ctx.ease('out') }, 0);
    const svg = svgLayer(ctx),
      ratio =
        params.upto < 0
          ? 1
          : Math.min(1, (params.upto + 1) / Math.max(1, ctx.beat.data.categories?.length ?? 1));
    paths.forEach((original) => {
      const ghost = polyline(svg, pts(original), {
        stroke: colorOf(ctx, 'rule'),
        'stroke-width': 3,
        'stroke-dasharray': '6 6',
      });
      const ink = polyline(svg, pts(original), { stroke: colorOf(ctx, 'fg'), 'stroke-width': 4 });
      ctx.initial(ghost, { autoAlpha: 0 });
      tl.to(ghost, { autoAlpha: 1, duration: d * 0.25, ease: ctx.ease('out') }, 0);
      drawOn(tl, ink, { at: d * 0.2, duration: d * 0.65, to: ratio, ease: 'none' });
    });
    ctx.initial(dots, { autoAlpha: 0.3 });
    dots.forEach((node) => {
      const r = Number(node.dataset.index) / Math.max(1, (ctx.beat.data.categories?.length ?? 1) - 1);
      if (r <= ratio)
        tl.to(
          node,
          { autoAlpha: 1, fill: colorOf(ctx, 'fg'), duration: d * 0.08, ease: ctx.ease('out') },
          d * (0.2 + 0.65 * r),
        );
    });
    const text = [...part(ctx, 'title'), ...part(ctx, 'dek'), ...part(ctx, 'source')];
    ctx.initial(text, { autoAlpha: 0 });
    tl.to(text, { autoAlpha: 1, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.75);
  },
};
