/** Link two chronology eras with a travelling boundary. Used by rail chapter transitions; signature rail move. */
import { transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { finishLink } from '../_shared/link.js';
import { reelFrom, rollReel } from '../_shared/reel.js';
import { px } from '../_shared/timeline.js';

const usable = (ctx, beat, name) =>
  ctx.skipParts.includes(name) && beat === ctx.beat
    ? []
    : beat.part(name).filter((node) => !(ctx.skipNodes ?? []).includes(node));
const digits = (date, kind) =>
  String(date)
    .replace(/\D/g, '')
    .slice(0, kind === 'month' ? 6 : 4)
    .padEnd(kind === 'month' ? 6 : 4, '0');
export default {
  id: 'era-shift',
  family: 'rail',
  role: 'link',
  accepts: ['chronology'],
  sources: ['wipe', 'luma-wipe', 'pan', 'tracking-reveal', 'rolling-digits', 'match-on-action'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 2, min: 1, max: 3.6, doc: 'Overall duration.' },
    boundaryWidth: { type: 'number', default: 2, min: 1, max: 6, doc: 'Boundary width in px.' },
    labelTracking: { type: 'number', default: 0.12, min: 0, max: 0.3, doc: 'Incoming label tracking in em.' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = ctx.duration,
      a = ctx.from,
      b = ctx.beat,
      aTrack = usable(ctx, a, 'track'),
      bTrack = usable(ctx, b, 'track'),
      aGround = usable(ctx, a, 'ground'),
      bGround = usable(ctx, b, 'ground');
    const dx = ctx.handoff.to.rect.x - ctx.handoff.from.rect.x;
    ctx.initial(bTrack, { x: dx, autoAlpha: 1 });
    ctx.initial(bGround, { clipPath: 'inset(0 0 0 100%)', autoAlpha: 1 });
    if (!ctx.reduce) {
      tl.to(aTrack, { x: dx, duration: d * 0.75, ease: ctx.ease('travel') }, 0);
      tl.to(bTrack, { x: 0, duration: d * 0.75, ease: ctx.ease('travel') }, 0);
    } else {
      tl.to(aTrack, { autoAlpha: 0, duration: d * 0.12 }, d * 0.68);
    }
    tl.to(
      bGround,
      {
        clipPath: ctx.reduce ? 'inset(0 0 0 0)' : 'inset(0 0 0 0)',
        duration: d * 0.6,
        ease: ctx.ease('inout'),
      },
      d * 0.2,
    );
    const boundary = document.createElement('div');
    Object.assign(boundary.style, {
      position: 'absolute',
      top: '0',
      bottom: '0',
      width: `${px(ctx, params.boundaryWidth)}px`,
      backgroundColor: colorOf(ctx, 'accent'),
    });
    ctx.overlay.append(boundary);
    ctx.initial(boundary, { x: ctx.viewport.w });
    tl.to(boundary, { x: 0, duration: d * 0.6, ease: ctx.ease('inout') }, d * 0.2);
    const aLabel = usable(ctx, a, 'label'),
      bLabel = usable(ctx, b, 'label');
    ctx.initial(bLabel, { autoAlpha: 0, letterSpacing: `${params.labelTracking}em` });
    tl.to(aLabel, { x: -px(ctx, 24), autoAlpha: 0, duration: d * 0.2, ease: ctx.ease('in') }, d * 0.55);
    tl.to(
      bLabel,
      { autoAlpha: 1, letterSpacing: '0em', duration: d * 0.24, ease: ctx.ease('out') },
      d * 0.56,
    );
    const aCounter = usable(ctx, a, 'counter')[0],
      bCounter = usable(ctx, b, 'counter')[0];
    if (aCounter) {
      const reel = reelFrom(aCounter),
        fromText = digits(a.data.events.at(-1)?.date, a.data.counter),
        toText = digits(b.data.events[0]?.date, b.data.counter);
      reel.cols.forEach((col, i) => ctx.initial(col, { yPercent: -Number(fromText[i] ?? 0) * 10 }));
      if (ctx.reduce)
        reel.cols.forEach((col, i) => tl.set(col, { yPercent: -Number(toText[i] ?? 0) * 10 }, d * 0.75));
      else
        rollReel(tl, reel, fromText, toText, { at: d * 0.1, duration: d * 0.65, ease: ctx.ease('travel') });
    }
    if (bCounter) ctx.initial(bCounter, { autoAlpha: 0 });
    const stem = usable(ctx, b, 'stem').slice(0, 1),
      title = usable(ctx, b, 'title').slice(0, 1);
    ctx.initial(stem, { scaleY: 0, transformOrigin: 'bottom' });
    ctx.initial(title, { y: px(ctx, 18), autoAlpha: 0 });
    tl.to(stem, { scaleY: 1, duration: d * 0.18, ease: ctx.ease('arrive') }, d * 0.75);
    tl.to(title, { y: 0, autoAlpha: 1, duration: d * 0.18, ease: ctx.ease('out') }, d * 0.82);
    tl.to(
      ctx.handoff.from.node,
      {
        ...transferVars(ctx.handoff.from.rect, ctx.handoff.to.rect),
        duration: d * 0.75,
        ease: ctx.ease('travel'),
      },
      0,
    );
    finishLink(tl, ctx, {
      at: d,
      cross: 0.1,
      from: [ctx.handoff.from.node, ...(aCounter ? [aCounter] : [])],
      to: [ctx.handoff.to.node, ...(bCounter ? [bCounter] : [])],
    });
  },
};
