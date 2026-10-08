/** Morphs a chart's bars into a new-state line without replacing the chart. */
import { colorOf } from '../_shared/color.js';
import { gridLayout } from '../_shared/grid.js';
import { polyline, svgLayer, drawOn } from '../_shared/stroke.js';
import { px } from '../_shared/timeline.js';

const usable = (ctx, name) =>
  ctx.skipParts.includes(name)
    ? []
    : ctx.beat.part(name).filter((node) => !(ctx.skipNodes ?? []).includes(node));
const stateFor = (ctx) =>
  ctx.beat.data.states?.find((state) => state.name === ctx.step?.name) ?? ctx.beat.data.states?.[0] ?? {};
const seriesFor = (data, state) => state.series ?? data.series ?? [];
const valuesFor = (data, state) =>
  (seriesFor(data, state)[0]?.values ?? data.series?.[0]?.values ?? []).map(Number);
const stateText = (ctx, name) => usable(ctx, name).filter((node) => node.dataset.state === ctx.step?.name);
const priorText = (ctx, name) => usable(ctx, name).filter((node) => node.dataset.state !== ctx.step?.name);

export default {
  id: 'mark-morph',
  family: 'data',
  role: 'step',
  accepts: ['chart'],
  sources: ['chart-path-morph', 'axis-rescale', 'staged-chart-transition', 'line-draw'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.8, min: 1, max: 3, doc: '전체 길이(u)' },
    rollTicks: { type: 'boolean', default: true, doc: 'rollTicks(안무 설명의 같은 이름)' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration;
    const state = stateFor(ctx);
    const values = valuesFor(ctx.beat.data, state);
    const plot = ctx.beat.anchor('plot').rect;
    const marks = usable(ctx, 'mark');
    const count = Math.max(values.length, marks.length);
    const range = Math.max(1, ...values, 0);
    const cells = gridLayout({
      n: count,
      cols: Math.max(1, count),
      cell: count > 1 ? plot.w / (count - 1) : 0,
      origin: { x: plot.x, y: plot.y },
    });
    const points = cells.map((cell, index) => ({
      x: cell.x,
      y: plot.y + plot.h - ((values[index] ?? 0) / range) * plot.h,
    }));
    const svg = svgLayer(ctx);
    const dots = points.map((point, index) => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      node.setAttribute('cx', String(point.x));
      node.setAttribute('cy', String(marks[index] ? ctx.beat.anchor('mark', index).rect.y : point.y));
      node.setAttribute('r', '0');
      node.setAttribute('fill', colorOf(ctx, 'fg'));
      svg.append(node);
      return node;
    });
    const line = polyline(svg, points, { stroke: colorOf(ctx, 'fg'), 'stroke-width': 3 });
    ctx.initial(dots, { autoAlpha: 0 });
    ctx.initial(line, { autoAlpha: 0, strokeDashoffset: 1 });
    const oldText = ['title', 'dek'].flatMap((name) => priorText(ctx, name));
    const newText = ['title', 'dek'].flatMap((name) => stateText(ctx, name));
    if (oldText.length) ctx.initial(oldText, { autoAlpha: 1, y: 0 });
    if (newText.length) ctx.initial(newText, { autoAlpha: 0, y: px(ctx, 16) });
    if (ctx.reduce) {
      tl.set(dots, { autoAlpha: 1, attr: { r: 6 } }, 0);
      tl.set(line, { autoAlpha: 1, strokeDashoffset: 0 }, 0);
      if (oldText.length)
        tl.to(oldText, { autoAlpha: 0, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.55);
      if (newText.length)
        tl.to(newText, { autoAlpha: 1, y: 0, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.55);
      return;
    }
    marks.forEach((mark, index) => {
      const top = ctx.beat.anchor('mark', index).rect.y;
      ctx.initial(mark, { transformOrigin: 'center top' });
      tl.to(mark, { scaleY: 0, duration: d * 0.3, ease: ctx.ease('inout') }, 0);
      tl.to(
        dots[index],
        { autoAlpha: 1, attr: { cy: top, r: 6 }, duration: d * 0.3, ease: ctx.ease('inout') },
        0,
      );
      tl.to(
        dots[index],
        { attr: { cy: points[index].y }, duration: d * 0.35, ease: ctx.ease('inout') },
        d * (0.45 + index * 0.02),
      );
    });
    if (params.rollTicks) {
      const ticks = usable(ctx, 'axis').concat(usable(ctx, 'unit'));
      tl.to(ticks, { yPercent: -100, duration: d * 0.25, ease: ctx.ease('inout') }, d * 0.25);
    }
    tl.to(line, { autoAlpha: 1, duration: 0.001 }, d * 0.45);
    drawOn(tl, line, { at: d * 0.45, duration: d * 0.35, ease: ctx.ease('inout') });
    if (oldText.length)
      tl.to(
        oldText,
        { autoAlpha: 0, y: px(ctx, -16), duration: d * 0.35, ease: ctx.ease('inout') },
        d * 0.55,
      );
    if (newText.length)
      tl.to(newText, { autoAlpha: 1, y: 0, duration: d * 0.35, ease: ctx.ease('out') }, d * 0.55);
    if (dots.length)
      tl.to(
        dots.at(-1),
        { attr: { r: 9, fill: colorOf(ctx, 'accent') }, duration: d * 0.15, ease: ctx.ease('out') },
        d * 0.85,
      );
  },
};
