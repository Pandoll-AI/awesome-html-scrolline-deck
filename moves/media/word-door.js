/** Splits a giant word-mask into two doors, leaving full-bleed video. Kinetic signature. */
import { applyTextMask, clearMask } from '../_shared/mask.js';
import { seg } from '../_shared/timeline.js';

export default {
  id: 'word-door',
  family: 'media',
  role: 'step',
  accepts: ['video'],
  sources: ['text-window-fill', 'text-cutout-zoom', 'split-slide', 'inline-image-expand'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 2.4, min: 1.2, max: 4, doc: '전체 길이(u)' },
    split: { type: 'integer', default: -1, doc: '갈라질 글자 index(−1 = 가운데)' },
    gap: { type: 'number', default: 0.06, min: 0, max: 0.2, doc: '점 간격(px)' },
    mediaScaleFrom: {
      type: 'number',
      default: 1.08,
      min: 1,
      max: 1.3,
      doc: 'mediaScaleFrom(안무 설명의 같은 이름)',
    },
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const media = ctx.beat.part('media').filter((n) => !ctx.skipNodes?.includes(n));
    const source = ctx.beat.data.mask?.text ?? media[0]?.dataset.maskText ?? 'WORD';
    const chars = [...source];
    const split =
      params.split < 0 ? Math.ceil(chars.length / 2) : Math.max(0, Math.min(chars.length, params.split));
    const leftText = chars.slice(0, split).join('') || chars[0] || 'W';
    const rightText = chars.slice(split).join('') || chars.at(-1) || 'D';
    const rect = ctx.beat.anchor('media').rect;
    const left = document.createElement('div');
    const right = document.createElement('div');
    const gap = document.createElement('div');
    left.className = 'sl-word-door__left';
    right.className = 'sl-word-door__right';
    gap.className = 'sl-word-door__gap';
    ctx.overlay.append(left, right, gap);
    applyTextMask(ctx, left, leftText, { rect, align: 'left' });
    applyTextMask(ctx, right, rightText, { rect, align: 'right' });
    ctx.initial([left, right], { autoAlpha: 1, backgroundColor: '#000' });
    ctx.initial(gap, { width: '0%', autoAlpha: 1 });
    ctx.initial(media, { scale: params.mediaScaleFrom, filter: 'brightness(0.92)' });
    if (ctx.reduce) {
      tl.to([left, right], { autoAlpha: 0, ...seg(params.duration, 0, 0.9), ease: ctx.ease('inout') }, 0);
    } else {
      tl.to(
        gap,
        { width: `${params.gap * 100}%`, ...seg(params.duration, 0, 0.2), ease: ctx.ease('out') },
        0,
      );
      tl.to(left, { x: '-0.5em', ...seg(params.duration, 0, 0.2), ease: ctx.ease('out') }, 0);
      tl.to(right, { x: '0.5em', ...seg(params.duration, 0, 0.2), ease: ctx.ease('out') }, 0);
      tl.to(left, { x: '-100vw', ...seg(params.duration, 0.2, 0.75), ease: ctx.ease('inout') }, 0);
      tl.to(right, { x: '100vw', ...seg(params.duration, 0.2, 0.75), ease: ctx.ease('inout') }, 0);
      tl.to(gap, { width: '100%', ...seg(params.duration, 0.2, 0.75), ease: ctx.ease('inout') }, 0);
    }
    tl.to(
      media,
      { scale: 1, filter: 'brightness(1)', ...seg(params.duration, 0.2, 0.9), ease: ctx.ease('inout') },
      0,
    );
    clearMask(tl, left, params.duration);
    clearMask(tl, right, params.duration);
    tl.set([left, right, gap], { autoAlpha: 0 }, params.duration);
  },
};
