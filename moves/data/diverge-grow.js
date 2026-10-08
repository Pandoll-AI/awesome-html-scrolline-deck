/** Splits a bar chart around zero: negative bars fall before positive bars rise. */
import { colorOf } from '../_shared/color.js';
import { line, svgLayer, drawOn } from '../_shared/stroke.js';

const part = (ctx, name) => (ctx.skipParts.includes(name) ? [] : ctx.beat.part(name));
const chartText = (ctx) => ['title', 'dek', 'source'].flatMap((name) => part(ctx, name));

export default {
  id: 'diverge-grow',
  family: 'data',
  role: 'enter',
  accepts: ['chart'],
  sources: ['bar-grow', 'change-arrows'],
  reduce: 'fade',
  params: { duration: { type: 'number', default: 1.4, min: 0.6, max: 2.6, doc: '전체 길이(u)' } },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      marks = part(ctx, 'mark'),
      horizontal = ctx.beat.data.orient === 'h';
    const existing = part(ctx, 'baseline')[0];
    let zero = existing;
    if (!zero) {
      const rect = ctx.beat.anchor('plot').rect,
        svg = svgLayer(ctx);
      zero = horizontal
        ? line(svg, rect.x + rect.w / 2, rect.y, rect.x + rect.w / 2, rect.y + rect.h, {
            stroke: colorOf(ctx, 'rule'),
            'stroke-width': 2,
          })
        : line(svg, rect.x, rect.y + rect.h / 2, rect.x + rect.w, rect.y + rect.h / 2, {
            stroke: colorOf(ctx, 'rule'),
            'stroke-width': 2,
          });
    }
    zero.setAttribute?.('pathLength', '1');
    zero.style.strokeDasharray = '1 1';
    ctx.initial(zero, { strokeDashoffset: 1 });
    tl.to(zero, { strokeDashoffset: 0, duration: d * 0.2, ease: ctx.ease('out') }, 0);
    const negative = marks.filter((node) => node.dataset.sign === 'neg');
    const positive = marks.filter((node) => node.dataset.sign !== 'neg');
    const grow = (node, at, ease, color) => {
      const axis = horizontal ? 'scaleX' : 'scaleY';
      ctx.initial(node, {
        [axis]: 0,
        transformOrigin: horizontal
          ? 'center center'
          : node.dataset.sign === 'neg'
            ? 'center top'
            : 'center bottom',
        fill: color,
      });
      tl.to(node, { [axis]: 1, duration: d * 0.35, ease }, at);
    };
    negative.forEach((node, i) => grow(node, d * (0.15 + i * 0.05), ctx.ease('in'), colorOf(ctx, 'accent')));
    positive.forEach((node, i) => grow(node, d * (0.45 + i * 0.05), ctx.ease('out'), colorOf(ctx, 'fg')));
    const labels = part(ctx, 'label');
    ctx.initial(labels, { autoAlpha: 0 });
    tl.to(labels, { autoAlpha: 1, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.75);
    const text = chartText(ctx);
    ctx.initial(text, { autoAlpha: 0 });
    tl.to(text, { autoAlpha: 1, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.75);
  },
};
