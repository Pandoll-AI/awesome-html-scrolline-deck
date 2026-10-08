/** Pins chart notes to their marks with short, ordered leader lines. Signature(data). */
import { colorOf } from '../_shared/color.js';
import { line, svgLayer, drawOn } from '../_shared/stroke.js';
import { px } from '../_shared/timeline.js';
const part = (ctx, name) => (ctx.skipParts.includes(name) ? [] : ctx.beat.part(name));
const notesFor = (ctx) => {
  const name = ctx.step?.name;
  return (
    (name ? ctx.beat.data.states?.find((s) => s.name === name) : ctx.beat.data.states?.[0])?.notes ??
    ctx.beat.data.notes ??
    []
  );
};
export default {
  id: 'annotation-pin',
  family: 'data',
  role: 'step',
  accepts: ['chart'],
  sources: ['annotation-callout', 'annotation-tracking', 'underline-draw'],
  reduce: 'fade',
  params: {
    duration: { type: 'number', default: 0.9, min: 0.4, max: 2, doc: '전체 길이(u)' },
    offset: { type: 'number', default: 28, min: 12, max: 80, doc: '주석 거리(px)' },
    stagger: { type: 'number', default: 0.08, min: 0, max: 0.3, doc: '항목 간 시차(u)' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      notes = [...notesFor(ctx)].sort((a, b) => a.index - b.index),
      svg = svgLayer(ctx);
    part(ctx, 'note').forEach((node) => {
      if (!node.dataset.state || node.dataset.state !== ctx.step?.name) {
        ctx.initial(node, { color: colorOf(ctx, 'fg'), autoAlpha: 1 });
        tl.to(
          node,
          { color: colorOf(ctx, 'fg-muted'), autoAlpha: 0.35, duration: d * 0.15, ease: ctx.ease('out') },
          0,
        );
      }
    });
    notes.forEach((note, i) => {
      const mark = part(ctx, 'mark').find(
        (n) =>
          Number(n.dataset.index) === note.index && Number(n.dataset.series) === Number(note.series ?? 0),
      );
      if (!mark) return;
      const r = ctx.beat.anchor('mark', part(ctx, 'mark').indexOf(mark)).rect,
        x = r.x + r.w / 2,
        y = r.y,
        endX = x + px(ctx, params.offset),
        at = d * 0.1 + i * params.stagger;
      const leader = line(svg, x, y, endX, y - px(ctx, 8), { stroke: colorOf(ctx, 'fg'), 'stroke-width': 2 });
      drawOn(tl, leader, { at, duration: d * 0.5, ease: ctx.ease('out') });
      const label = document.createElement('span');
      label.textContent = note.text;
      Object.assign(label.style, {
        position: 'absolute',
        left: `${endX}px`,
        top: `${y - px(ctx, 8)}px`,
        color: colorOf(ctx, 'fg'),
      });
      ctx.overlay.append(label);
      ctx.initial(label, { autoAlpha: 0, x: px(ctx, 12) });
      tl.to(
        label,
        { autoAlpha: 1, x: 0, duration: d * 0.5, ease: ctx.ease('out') },
        d * 0.35 + i * params.stagger,
      );
      ctx.initial(mark, { fill: colorOf(ctx, 'fg') });
      tl.to(
        mark,
        { fill: colorOf(ctx, 'accent'), duration: d * 0.3, ease: ctx.ease('out') },
        d * 0.6 + i * params.stagger,
      );
    });
  },
};
