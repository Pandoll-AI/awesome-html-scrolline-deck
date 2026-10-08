/** Draws a reference rule through a chart and mutes marks beneath its value. */
import { colorOf } from '../_shared/color.js';
import { line, svgLayer, drawOn } from '../_shared/stroke.js';
import { px } from '../_shared/timeline.js';
const part = (ctx, name) => (ctx.skipParts.includes(name) ? [] : ctx.beat.part(name));
export default {
  id: 'threshold-line',
  family: 'data',
  role: 'step',
  accepts: ['chart'],
  sources: ['threshold-pulse', 'chart-filter-fade', 'line-draw'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1, min: 0.5, max: 2, doc: '전체 길이(u)' },
    refIndex: { type: 'integer', default: 0, min: 0, max: 40, doc: 'refIndex(안무 설명의 같은 이름)' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      data = ctx.beat.data,
      si = Number(data.highlight?.series ?? 0),
      ref = data.series?.[si]?.values?.[params.refIndex] ?? 0,
      plot = ctx.beat.anchor('plot').rect;
    const refMark = part(ctx, 'mark').find(
        (n) => Number(n.dataset.series) === si && Number(n.dataset.index) === params.refIndex,
      ),
      rr = refMark ? ctx.beat.anchor('mark', part(ctx, 'mark').indexOf(refMark)).rect : plot,
      x = rr.x + rr.w / 2;
    const svg = svgLayer(ctx),
      rule = line(svg, x, plot.y, x, plot.y + plot.h, { stroke: colorOf(ctx, 'accent'), 'stroke-width': 2 });
    drawOn(tl, rule, { at: 0, duration: d * 0.4, ease: ctx.ease('out') });
    const label = document.createElement('span');
    label.textContent = `${data.categories?.[params.refIndex] ?? ''} ${ref}`;
    Object.assign(label.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${plot.y + plot.h}px`,
      color: colorOf(ctx, 'accent'),
    });
    ctx.overlay.append(label);
    ctx.initial(label, { autoAlpha: 0, y: px(ctx, 8) });
    tl.to(label, { autoAlpha: 1, y: 0, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.3);
    const hi = data.highlight?.index ?? params.refIndex;
    part(ctx, 'mark').forEach((node) => {
      const index = Number(node.dataset.index),
        value = data.series?.[Number(node.dataset.series)]?.values?.[index];
      ctx.initial(node, { fill: colorOf(ctx, 'fg') });
      if (Number.isFinite(value) && value < ref)
        tl.to(node, { fill: colorOf(ctx, 'rule'), duration: d * 0.4, ease: ctx.ease('out') }, d * 0.4);
      if (index === hi && Number(node.dataset.series) === si)
        tl.to(node, { fill: colorOf(ctx, 'accent'), duration: d * 0.3, ease: ctx.ease('out') }, d * 0.5);
    });
  },
};
