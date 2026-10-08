/** Carries a video frame into a word of the following text beat. */
import { colorOf } from '../_shared/color.js';
import { finishLink, ghost } from '../_shared/link.js';
import { applyTextMask } from '../_shared/mask.js';
import { seg } from '../_shared/timeline.js';

export default {
  id: 'into-word',
  family: 'media',
  role: 'link',
  accepts: ['text'],
  sources: ['inline-image-expand', 'text-window-fill', 'clip-reveal'],
  reduce: 'fade',
  params: {
    word: { type: 'integer', default: 0, doc: 'B 쪽 도착 어절 index' },
    duration: { type: 'number', default: 1.6, min: 0.8, max: 3, doc: '전체 길이(u)' },
  },
  handoff(params) {
    return { from: { part: 'frame' }, to: { part: 'word', index: params.word } };
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const { from, to } = ctx.handoff;
    const carry = ghost(ctx, from.node, from.rect);
    const dx = to.rect.x - from.rect.x;
    const dy = to.rect.y - from.rect.y;
    const words = ctx.beat.part('word');
    const rest = words.filter((node) => node !== to.node && !ctx.skipNodes?.includes(node));
    const fill = document.createElement('div');
    fill.className = 'sl-into-word__fill';
    ctx.overlay.append(fill);
    Object.assign(fill.style, {
      position: 'absolute',
      left: `${to.rect.x}px`,
      top: `${to.rect.y}px`,
      width: `${to.rect.w}px`,
      height: `${to.rect.h}px`,
    });
    applyTextMask(ctx, fill, to.node.textContent || 'WORD', { rect: to.rect });
    ctx.initial(from.node, { autoAlpha: 1 });
    ctx.initial(carry, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', transformOrigin: '0 0' });
    ctx.initial(to.node, { color: colorOf(ctx, 'accent') });
    ctx.initial(fill, { autoAlpha: 0, backgroundColor: colorOf(ctx, 'accent') });
    if (rest.length) ctx.initial(rest, { autoAlpha: 0, x: 12 });
    tl.to(
      carry,
      {
        x: dx,
        y: dy,
        scaleX: from.rect.w ? to.rect.w / from.rect.w : 1,
        scaleY: from.rect.h ? to.rect.h / from.rect.h : 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        ...seg(params.duration, 0, 0.45),
        ease: ctx.ease('inout'),
      },
      0,
    );
    tl.to(carry, { autoAlpha: 0, duration: 0.01, ease: ctx.ease('out') }, params.duration - 0.01);
    tl.to(fill, { autoAlpha: 1, ...seg(params.duration, 0.4, 0.6), ease: ctx.ease('out') }, 0);
    tl.to(fill, { autoAlpha: 0, ...seg(params.duration, 0.8, 1), ease: ctx.ease('out') }, 0);
    if (rest.length)
      tl.to(rest, { autoAlpha: 1, x: 0, ...seg(params.duration, 0.55, 0.8), ease: ctx.ease('out') }, 0);
    finishLink(tl, ctx, { at: params.duration, cross: 0.12, from: [from.node], to: [to.node] });
  },
};
