/** Stream prompt-result words through an overlay, leaving the authored result intact. */
import { colorOf } from '../_shared/color.js';
import { ghost } from '../_shared/link.js';
import { slots } from '../_shared/timeline.js';
import { ghostWords } from '../_shared/words.js';

export default {
  id: 'result-stream',
  family: 'type',
  role: 'step',
  accepts: ['prompt'],
  sources: ['word-pop-caption', 'karaoke-caption', 'typewriter'],
  reduce: 'fade',
  params: {
    duration: { type: 'number', default: 2.2, min: 1, max: 4, doc: '전체 길이(u)' },
    compress: { type: 'number', default: 0.85, min: 0.5, max: 1, doc: '어절 간격 감소 배율' },
  },
  timing: (p) => ({ duration: p.duration, stops: [] }),
  build(tl, ctx, p) {
    const result = ctx.skipParts.includes('result') ? [] : ctx.beat.part('result');
    if (!result.length) return;
    const source = result[0],
      rect = ctx.beat.anchor('result').rect;
    const words = ctx.beat.part('word').length ? ctx.beat.part('word') : ghostWords(ctx, source, rect);
    const overlayWords = words.map((word) =>
      word.parentElement === ctx.overlay ? word : ghost(ctx, word, rect),
    );
    const caret = document.createElement('i');
    caret.className = 'sl-result-stream__caret';
    caret.textContent = '▍';
    Object.assign(caret.style, {
      position: 'absolute',
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      color: colorOf(ctx, 'accent'),
    });
    ctx.overlay.append(caret);
    ctx.initial(source, { autoAlpha: 0 });
    ctx.initial(overlayWords, { autoAlpha: 0, color: colorOf(ctx, 'fg') });
    ctx.initial(caret, { autoAlpha: 1 });
    const times = slots(overlayWords.length, {
      start: 0,
      span: p.duration * 0.9,
      compress: p.compress,
      minRatio: 0.4,
    });
    overlayWords.forEach((node, i) => {
      const at = times[i].at;
      tl.to(
        node,
        {
          autoAlpha: 1,
          color: colorOf(ctx, 'accent'),
          duration: Math.min(0.04, p.duration * 0.04),
          ease: ctx.ease('out'),
        },
        at,
      );
      if (i)
        tl.to(
          overlayWords[i - 1],
          { color: colorOf(ctx, 'fg'), duration: Math.min(0.08, p.duration * 0.08), ease: ctx.ease('out') },
          at,
        );
      const anchor = ctx.beat.anchor('word', Math.min(i, ctx.beat.part('word').length - 1)).rect;
      tl.set(caret, { x: anchor.x + anchor.w - rect.x }, at);
    });
    if (overlayWords.length)
      tl.to(
        overlayWords.at(-1),
        { color: colorOf(ctx, 'fg'), duration: Math.min(0.08, p.duration * 0.08), ease: ctx.ease('out') },
        p.duration * 0.9,
      );
    tl.set(overlayWords, { autoAlpha: 0 }, p.duration);
    tl.set(source, { autoAlpha: 1 }, p.duration);
  },
};
