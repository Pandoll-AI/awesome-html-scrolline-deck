/** Strike one word, scramble it deterministically, and settle on its replacement. */
import { colorOf } from '../_shared/color.js';
import { scrambleAt, scrambleTable } from '../_shared/scramble.js';
import { line, svgLayer } from '../_shared/stroke.js';

export default {
  id: 'scramble-swap',
  family: 'type',
  role: 'step',
  accepts: ['text'],
  sources: ['text-scramble', 'strikethrough-replace', 'word-slot-cycle'],
  reduce: 'self',
  params: {
    word: { type: 'integer', default: 0, doc: '대상 어절 index' },
    from: { type: 'string', default: '이전', doc: '처음 보여 줄 단어' },
    duration: { type: 'number', default: 1.6, min: 0.8, max: 3, doc: '전체 길이(u)' },
    glyphs: { type: 'string', default: '#%&@*+=/<>', doc: '들끓는 기호 집합' },
  },
  timing: (p) => ({ duration: p.duration, stops: [] }),
  build(tl, ctx, p) {
    const node = ctx.beat.part('word')[p.word];
    if (!node || ctx.skipParts.includes('word') || (ctx.skipNodes ?? []).includes(node)) return;
    const d = p.duration,
      to = node.textContent ?? '',
      rect = ctx.beat.anchor('word', p.word).rect;
    const table = scrambleTable(
      ctx.rng,
      Math.max(p.from.length, to.length),
      Math.max(2, Math.ceil((d * 0.5) / 0.05)),
      p.glyphs,
    );
    const svg = svgLayer(ctx),
      stroke = line(svg, rect.x, rect.y + rect.h / 2, rect.x + rect.w, rect.y + rect.h / 2, {
        stroke: colorOf(ctx, 'accent'),
        'stroke-width': 2,
      });
    const proxy = { p: 0 };
    const paint = () => {
      node.textContent = ctx.reduce ? (proxy.p < 0.5 ? p.from : to) : scrambleAt(p.from, to, proxy.p, table);
    };
    ctx.initial(node, {
      autoAlpha: 1,
      color: colorOf(ctx, 'fg'),
      minWidth: `${rect.w}px`,
      display: 'inline-block',
    });
    ctx.initial(stroke, { scaleX: 0, transformOrigin: 'left center' });
    paint();
    tl.to(stroke, { scaleX: 1, duration: d * 0.25, ease: ctx.ease('inout') }, 0);
    tl.to(node, { autoAlpha: 0.45, duration: d * 0.1, ease: ctx.ease('out') }, d * 0.25);
    tl.to(proxy, { p: 1, duration: d * 0.5, ease: 'none', onUpdate: paint }, d * 0.35);
    tl.to(stroke, { autoAlpha: 0, duration: d * 0.5, ease: ctx.ease('out') }, d * 0.35);
    tl.to(
      node,
      { autoAlpha: 1, color: colorOf(ctx, 'accent'), duration: d * 0.15, ease: ctx.ease('out') },
      d * 0.85,
    );
  },
};
