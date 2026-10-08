/** A single chart mark introduces its annotation and chart copy. */
import { line, drawOn, svgLayer } from '../_shared/stroke.js';
import { px } from '../_shared/timeline.js';

const parts = (ctx, name) => (ctx.skipParts.includes(name) ? [] : ctx.beat.part(name));
export default {
  id: 'dot-seed',
  family: 'data',
  role: 'enter',
  accepts: ['chart'],
  sources: ['scale-pop', 'annotation-callout'],
  reduce: 'fade',
  params: {
    duration: { type: 'number', default: 1, min: 0.5, max: 2, doc: '전체 길이(u)' },
    noteSide: { type: 'enum', default: 'right', values: ['left', 'right', 'top'], doc: '주석이 놓일 방향' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      mark = parts(ctx, 'mark')[0],
      note = parts(ctx, 'note')[0];
    const title = parts(ctx, 'title'),
      dek = parts(ctx, 'dek');
    if (mark) {
      ctx.initial(mark, { autoAlpha: 0, scale: 0.4 });
      tl.to(mark, { autoAlpha: 1, scale: 1, duration: d * 0.25, ease: ctx.ease('out') }, 0);
    }
    if (note) {
      const a = ctx.beat.anchor('mark').point,
        b = ctx.beat.anchor('note').point;
      const side = params.noteSide === 'left' ? -1 : params.noteSide === 'top' ? 0 : 1;
      const svg = svgLayer(ctx),
        leader = line(svg, a.x, a.y, b.x, b.y, { stroke: '#8a8a8a', 'stroke-width': px(ctx, 2) });
      drawOn(tl, leader, { at: d * 0.2, duration: d * 0.35, ease: ctx.ease('out') });
      ctx.initial(note, {
        autoAlpha: 0,
        x: px(ctx, side * 12),
        y: params.noteSide === 'top' ? px(ctx, 12) : 0,
      });
      tl.to(note, { autoAlpha: 1, x: 0, y: 0, duration: d * 0.3, ease: ctx.ease('out') }, d * 0.45);
    }
    [title, dek].forEach((nodes, i) => {
      if (nodes.length) {
        ctx.initial(nodes, { yPercent: 100 });
        tl.to(nodes, { yPercent: 0, duration: d * 0.33, ease: ctx.ease('out') }, d * (0.55 + i * 0.12));
      }
    });
  },
};
