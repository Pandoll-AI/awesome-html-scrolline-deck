/** Focus text lines in sequence, then settle them into their authored state. */
import { colorOf } from '../_shared/color.js';

const lineCount = (data) =>
  data?.lines?.length ||
  String(data?.text ?? '')
    .split('\n')
    .filter(Boolean).length ||
  1;
export default {
  id: 'line-focus',
  family: 'type',
  role: 'enter',
  accepts: ['text'],
  sources: ['lyric-line-focus', 'word-relay'],
  reduce: 'fade',
  params: { perLine: { type: 'number', default: 1.1, min: 0.6, max: 2, doc: '줄당 길이(u)' } },
  timing(p, data) {
    const n = lineCount(data);
    return {
      duration: p.perLine * n + 0.1,
      stops: Array.apply(null, { length: n }).map((_, i) => ({ name: `l${i + 1}`, at: p.perLine * (i + 1) })),
    };
  },
  build(tl, ctx, p) {
    const lines = ctx.skipParts.includes('line') ? [] : ctx.beat.part('line'),
      d = ctx.duration;
    if (!lines.length) return;
    const own = ctx.beat.part('block')[0];
    // a link that delivered the block owns it (skipNodes): then lines move, the block stays put
    const block = own && !ctx.skipNodes?.includes(own) && !ctx.skipParts.includes('block') ? own : null;
    const boxOf = (i) => ctx.beat.anchor('line', i).rect;
    const blockRect = block ? ctx.beat.anchor('block').rect : null;
    // The line being read sits at the block's centre; earlier lines are pushed up and recede.
    const centreOn = (i) => (blockRect ? blockRect.y + blockRect.h / 2 - (boxOf(i).y + boxOf(i).h / 2) : 0);
    ctx.initial(lines, {
      autoAlpha: 0,
      y: '0.4em',
      scale: 1,
      color: colorOf(ctx, 'fg'),
      transformOrigin: '50% 50%',
    });
    if (block && !ctx.reduce) ctx.initial(block, { y: centreOn(0) });
    lines.forEach((node, i) => {
      const at = i * p.perLine;
      tl.to(node, { autoAlpha: 1, y: 0, duration: p.perLine * 0.6, ease: ctx.ease('out') }, at);
      if (!ctx.reduce && i) {
        tl.to(block, { y: centreOn(i), duration: p.perLine * 0.5, ease: ctx.ease('inout') }, at);
        tl.to(
          lines.slice(0, i),
          {
            color: colorOf(ctx, 'fg-muted'),
            scale: 0.92,
            duration: p.perLine * 0.35,
            ease: ctx.ease('inout'),
          },
          at,
        );
      }
    });
    tl.to(
      lines,
      { color: colorOf(ctx, 'fg'), scale: 1, y: 0, duration: 0.1, ease: ctx.ease('out') },
      d - 0.1,
    );
    if (block && !ctx.reduce) tl.to(block, { y: 0, duration: 0.1, ease: ctx.ease('out') }, d - 0.1);
  },
};
