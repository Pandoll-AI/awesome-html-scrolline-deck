/** Extends observed chart data into a visibly dashed forecast interval. */
import { colorOf } from '../_shared/color.js';
import { line, polyline, svgLayer, drawOn } from '../_shared/stroke.js';
import { px } from '../_shared/timeline.js';

const part = (ctx, name) => (ctx.skipParts.includes(name) ? [] : ctx.beat.part(name));
const values = (node) =>
  (node.getAttribute('d')?.match(/-?\d*\.?\d+/g) ?? []).reduce(
    (a, n, i, x) => (i % 2 ? a : [...a, { x: +n, y: +x[i + 1] }]),
    [],
  );
const stateName = (ctx) => ctx.step?.name ?? ctx.beat.data.states?.[0]?.name;
function stateText(tl, ctx, d) {
  const name = stateName(ctx);
  if (!name) return;
  ['title', 'dek', 'note'].forEach((key) =>
    part(ctx, key).forEach((node) => {
      const active = node.dataset.state === name;
      if (active) ctx.initial(node, { autoAlpha: 0, y: px(ctx, 8) });
      tl.to(node, { autoAlpha: active ? 1 : 0, y: 0, duration: d * 0.3, ease: ctx.ease('out') }, d * 0.7);
    }),
  );
}
export default {
  id: 'forecast-extend',
  family: 'data',
  role: 'step',
  accepts: ['chart'],
  sources: ['confidence-band-reveal', 'point-to-point-build'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.2, min: 0.6, max: 2.4, doc: '전체 길이(u)' },
    fromIndex: { type: 'integer', default: 0, min: 0, max: 40, doc: 'A 쪽 대상 index' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      paths = part(ctx, 'mark').filter((n) => n.tagName?.toLowerCase() === 'path'),
      first = paths[0];
    if (!first) return;
    const all = values(first),
      from = Math.min(Math.max(0, params.fromIndex), Math.max(0, all.length - 1)),
      forecast = all.slice(from),
      svg = svgLayer(ctx),
      plot = ctx.beat.anchor('plot').rect;
    const band = document.createElement('div');
    Object.assign(band.style, {
      position: 'absolute',
      left: `${forecast[0]?.x ?? plot.x}px`,
      top: `${plot.y}px`,
      width: `${Math.max(0, (forecast.at(-1)?.x ?? plot.x) - (forecast[0]?.x ?? plot.x))}px`,
      height: `${plot.h}px`,
      background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(255,255,255,.14) 6px 8px)',
    });
    band.textContent = '전망';
    ctx.overlay.append(band);
    ctx.initial(band, { autoAlpha: 0 });
    tl.to(band, { autoAlpha: 1, duration: d * 0.3, ease: ctx.ease('out') }, 0);
    const path = polyline(svg, forecast, {
      stroke: colorOf(ctx, 'fg'),
      'stroke-width': 4,
      'stroke-dasharray': '7 7',
    });
    drawOn(tl, path, { at: d * 0.2, duration: d * 0.55, ease: ctx.ease('inout') });
    const end = part(ctx, 'mark').find(
      (n) => Number(n.dataset.index) === from + forecast.length - 1 && n.tagName?.toLowerCase() !== 'path',
    );
    if (end) {
      ctx.initial(end, { attr: { r: 0 }, fill: colorOf(ctx, 'accent') });
      tl.to(end, { attr: { r: 9 }, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.5);
    }
    stateText(tl, ctx, d);
  },
};
