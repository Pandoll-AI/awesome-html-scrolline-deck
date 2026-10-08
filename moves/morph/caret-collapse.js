/** Collapses a source frame into the receiving prompt caret. */
import { transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { finishLink } from '../_shared/link.js';
import { seg } from '../_shared/timeline.js';

export default {
  id: 'caret-collapse',
  family: 'morph',
  role: 'link',
  accepts: ['prompt'],
  sources: ['origami-fold', 'split-slide', 'morph-match-cut', 'context-caret'],
  reduce: 'fade',
  params: {
    duration: { type: 'number', default: 1.4, min: 0.8, max: 2.5, doc: '전체 길이(u)' },
    toPart: { type: 'part', default: 'caret', doc: 'B 도착 part' },
  },
  handoff(p) {
    return { from: { part: 'frame' }, to: { part: p.toPart } };
  },
  timing: (p) => ({ duration: p.duration ?? 1.4, stops: [] }),
  build(tl, ctx, p) {
    const { from, to } = ctx.handoff,
      d = p.duration,
      part = (a, b) => ({ duration: d * (b - a) }),
      field = ctx.beat.part('field'),
      label = ctx.beat.part('label');
    const shade = document.createElement('i');
    shade.className = 'sl-caret-collapse__ink';
    ctx.overlay.append(shade);
    Object.assign(shade.style, {
      position: 'absolute',
      left: `${from.rect.x}px`,
      top: `${from.rect.y}px`,
      width: `${from.rect.w}px`,
      height: `${from.rect.h}px`,
      backgroundColor: colorOf(ctx, 'accent'),
    });
    ctx.initial(from.node, {
      clipPath: 'inset(0% 0% 0% 0%)',
      transformOrigin: '0 0',
      filter: 'brightness(1)',
      autoAlpha: 1,
    });
    ctx.initial(shade, { autoAlpha: 0, transformOrigin: '0 0' });
    ctx.initial(to.node, { autoAlpha: 0 });
    if (field.length) ctx.initial(field, { scaleX: 0, transformOrigin: '0 50%' });
    if (label.length) ctx.initial(label, { autoAlpha: 0 });
    tl.to(
      from.node,
      {
        clipPath: 'inset(0% calc(50% - 3px) 0% calc(50% - 3px))',
        filter: 'brightness(0.6)',
        ...part(0, 0.4),
        ease: ctx.ease('inout'),
      },
      0,
    );
    tl.to(
      shade,
      {
        autoAlpha: 1,
        height: to.rect.h,
        y: to.point.y - from.rect.y - to.rect.h / 2,
        ...part(0.35, 0.55),
        ease: ctx.ease('inout'),
      },
      d * 0.35,
    );
    tl.to(
      from.node,
      { ...transferVars(from.rect, to.rect), ...part(0.55, 0.85), ease: ctx.ease('inout') },
      d * 0.55,
    );
    tl.to(
      shade,
      { ...transferVars(from.rect, to.rect), ...part(0.55, 0.85), ease: ctx.ease('inout') },
      d * 0.55,
    );
    if (field.length) tl.to(field, { scaleX: 1, ...part(0.55, 0.85), ease: ctx.ease('out') }, d * 0.55);
    if (label.length) tl.to(label, { autoAlpha: 1, ...part(0.85, 1), ease: ctx.ease('out') }, d * 0.85);
    finishLink(tl, ctx, { at: d, cross: Math.min(0.15, d * 0.15), from: [from.node, shade] });
  },
};
