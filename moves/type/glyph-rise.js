/** Characters rise from a baseline mask and close by transform, never letter spacing. */
import { applyTextMask } from '../_shared/mask.js';
export default {
  id: 'glyph-rise',
  family: 'type',
  role: 'enter',
  accepts: ['text'],
  sources: ['mask-reveal', 'tracking-reveal', 'char-stagger'],
  reduce: 'fade',
  params: {
    duration: { type: 'number', default: 1.2, min: 0.6, max: 2.4, doc: '전체 길이(u)' },
    stagger: { type: 'number', default: 0.08, min: 0.02, max: 0.2, doc: '항목 간 시차(u)' },
    spread: { type: 'number', default: 0.12, min: 0, max: 0.2, doc: '벌림 거리' },
  },
  timing: (p) => ({ duration: p.duration, stops: [] }),
  build(tl, ctx, p) {
    const chars = ctx.skipParts.includes('char') ? [] : ctx.beat.part('char');
    const mid = (chars.length - 1) / 2;
    chars.forEach((node, i) => {
      const at = Math.min(i * p.stagger, p.duration * 0.2);
      ctx.initial(node, {
        yPercent: 100,
        x: `${(i - mid) * p.spread}em`,
        autoAlpha: 0,
        clipPath: 'inset(0)',
      });
      tl.to(node, { yPercent: 0, autoAlpha: 1, duration: p.duration * 0.6, ease: ctx.ease('out') }, at);
      tl.to(
        node,
        { x: 0, duration: p.duration * 0.5, ease: ctx.ease('out') },
        Math.min(p.duration * 0.3 + at, p.duration * 0.5),
      );
    });
    const labels = ['caption', 'label'].flatMap((name) =>
      ctx.skipParts.includes(name) ? [] : ctx.beat.part(name),
    );
    ctx.initial(labels, { autoAlpha: 0 });
    tl.to(labels, { autoAlpha: 1, duration: p.duration * 0.3, ease: ctx.ease('out') }, p.duration * 0.7);
    const media = ctx.beat.part('media')[0];
    if (!chars.length && media)
      applyTextMask(ctx, media, ctx.beat.data.text, { rect: ctx.beat.anchor('media').rect });
  },
};
