/** Opens an outgoing prompt field into an incoming media frame. */
import { toInset, transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { finishLink } from '../_shared/link.js';
import { seg, slots } from '../_shared/timeline.js';

export default {
  id: 'field-burst',
  family: 'morph',
  role: 'link',
  accepts: ['video', 'photo'],
  sources: ['clip-reveal', 'split-panel-handoff', 'text-particle-dissolve'],
  reduce: 'fade',
  params: { duration: { type: 'number', default: 1.3, min: 0.6, max: 2.4, doc: '전체 길이(u)' } },
  handoff() {
    return { from: { part: 'field' }, to: { part: 'frame' } };
  },
  timing: (p) => ({ duration: p.duration ?? 1.3, stops: [] }),
  build(tl, ctx, p) {
    const { from, to } = ctx.handoff,
      d = p.duration,
      part = (a, b) => ({ duration: d * (b - a) });
    const caret = ctx.from.part('caret'),
      chars = ctx.from.part('char');
    ctx.initial(from.node, { autoAlpha: 1, transformOrigin: '0 0' });
    ctx.initial(to.node, { clipPath: toInset(from.rect, ctx.viewport), autoAlpha: 0 });
    if (caret.length) ctx.initial(caret, { scaleX: 1, backgroundColor: colorOf(ctx, 'accent') });
    if (chars.length) ctx.initial(chars, { autoAlpha: 1, y: 0, filter: 'none' });
    if (caret.length) tl.to(caret, { scaleX: 1.08, ...part(0, 0.075), ease: ctx.ease('out') }, 0);
    if (caret.length) tl.to(caret, { scaleX: 1, ...part(0.075, 0.15), ease: ctx.ease('in') }, d * 0.075);
    if (!ctx.reduce)
      slots(chars.length, {
        start: d * 0.1,
        span: Math.min(d * 0.2, d * 0.02 * Math.max(0, chars.length - 1)),
        each: d * 0.02,
      }).forEach((slot, i) =>
        tl.to(
          chars[i],
          {
            y: -24 * ctx.viewport.px,
            autoAlpha: 0,
            filter: 'blur(3px)',
            duration: d * 0.25,
            ease: ctx.ease('in'),
          },
          slot.at,
        ),
      );
    tl.to(
      to.node,
      { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, ...part(0.25, 0.8), ease: ctx.ease('inout') },
      d * 0.25,
    );
    tl.to(
      from.node,
      { ...transferVars(from.rect, to.rect), ...part(0.25, 0.8), ease: ctx.ease('inout') },
      d * 0.25,
    );
    finishLink(tl, ctx, { at: d, cross: Math.min(0.15, d * 0.2) });
  },
};
