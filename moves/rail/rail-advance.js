/** Advance a chronology rail to its next dated event. Used by rail step beats; signature rail move. */
import { gridLayout } from '../_shared/grid.js';
import { reelFrom, rollReel } from '../_shared/reel.js';
import { clamp, px } from '../_shared/timeline.js';

const monthAt = (date) => {
  const match = String(date).match(/^(\d{4})(?:-(\d{1,2}))?/);
  return match ? Number(match[1]) * 12 + (Number(match[2] ?? 1) - 1) : 0;
};
const digits = (date, counter) =>
  String(date)
    .replace(/\D/g, '')
    .slice(0, counter === 'month' ? 6 : 4)
    .padEnd(counter === 'month' ? 6 : 4, '0');
const nodes = (ctx, name) =>
  ctx.skipParts.includes(name)
    ? []
    : ctx.beat.part(name).filter((node) => !(ctx.skipNodes ?? []).includes(node));
const eventPart = (ctx, name, index) => (nodes(ctx, name)[index] ? [nodes(ctx, name)[index]] : []);
const eventIndex = (params, events) =>
  clamp(params.from < 0 ? params.to - 1 : params.from, 0, events.length - 1);
const eventX = (ctx, index) =>
  ctx.beat.anchor('event', index).rect.x + ctx.beat.anchor('event', index).rect.w / 2;
const nowX = (ctx) => {
  const now = ctx.beat.part('now')[0];
  return now ? ctx.beat.anchor('now').rect.x + ctx.beat.anchor('now').rect.w / 2 : ctx.viewport.w / 2;
};

export default {
  id: 'rail-advance',
  family: 'rail',
  role: 'step',
  accepts: ['chronology'],
  sources: [
    'pan',
    'infinite-pan',
    'parallax',
    'rolling-digits',
    'glyph-roll',
    'motion-blur',
    'timeline-scrub',
    'focus-handoff',
  ],
  reduce: 'self',
  params: {
    from: { type: 'integer', default: -1, doc: '-1 = to-1, 0..events-1' },
    to: { type: 'integer', default: 1, doc: '0..events-1' },
    base: { type: 'number', default: 0.6, min: 0.3, max: 1.2, doc: 'Base travel duration.' },
    perMonth: { type: 'number', default: 0.05, min: 0, max: 0.15, doc: 'Extra duration per month.' },
    max: { type: 'number', default: 2.6, min: 0.8, max: 4, doc: 'Maximum travel duration.' },
    ghostParallax: { type: 'number', default: 0.35, min: 0, max: 0.8, doc: 'Ghost layer travel ratio.' },
    blurMax: { type: 'number', default: 4, min: 0, max: 8, doc: 'Maximum motion blur in px.' },
    trailOpacity: { type: 'number', default: 0.32, min: 0.15, max: 0.6, doc: 'Passed-event opacity.' },
  },
  timing(params, data) {
    const events = data.events ?? [],
      from = eventIndex(params, events),
      to = clamp(params.to, 0, Math.max(0, events.length - 1));
    return {
      duration: Math.min(
        params.max,
        params.base + params.perMonth * Math.abs(monthAt(events[to]?.date) - monthAt(events[from]?.date)),
      ),
      stops: [],
    };
  },
  build(tl, ctx, params) {
    const events = ctx.beat.data.events ?? [],
      from = eventIndex(params, events),
      to = clamp(params.to, 0, events.length - 1),
      d = ctx.duration;
    if (!events.length) return;
    gridLayout({ n: events.length, cols: events.length || 1, cell: 1 });
    const track = nodes(ctx, 'track'),
      start = nowX(ctx) - eventX(ctx, from),
      end = nowX(ctx) - eventX(ctx, to),
      travel = d * 0.7;
    ctx.initial(track, { x: start, filter: 'none' });
    tl.to(track, { x: end, duration: travel, ease: ctx.reduce ? 'none' : ctx.ease('travel') }, 0);
    if (!ctx.reduce && params.blurMax) {
      const blur = Math.min(params.blurMax, ctx.tokens.blurMax ?? 12);
      tl.to(track, { filter: `blur(${blur}px)`, duration: d * 0.15, ease: ctx.ease('out') }, 0);
      tl.to(track, { filter: `blur(${blur}px)`, duration: d * 0.25, ease: 'none' }, d * 0.15);
      tl.to(track, { filter: 'none', duration: d * 0.15, ease: ctx.ease('in') }, d * 0.4);
      const ground = nodes(ctx, 'ground');
      ctx.initial(ground, { x: start * params.ghostParallax });
      tl.to(ground, { x: end * params.ghostParallax, duration: travel, ease: ctx.ease('travel') }, 0);
    }
    const oldParts = ['title', 'note'].flatMap((name) => eventPart(ctx, name, from));
    tl.to(oldParts, { autoAlpha: params.trailOpacity, duration: d * 0.5, ease: ctx.ease('in') }, d * 0.1);
    const stem = eventPart(ctx, 'stem', to),
      title = eventPart(ctx, 'title', to),
      note = eventPart(ctx, 'note', to),
      media = eventPart(ctx, 'media', to);
    ctx.initial(stem, { scaleY: 0, transformOrigin: 'bottom' });
    ctx.initial(title, { y: px(ctx, 18), autoAlpha: 0 });
    ctx.initial(note, { autoAlpha: 0 });
    tl.to(stem, { scaleY: 1, duration: d * 0.4, ease: ctx.ease('arrive') }, d * 0.6);
    tl.to(title, { y: 0, autoAlpha: 1, duration: d * 0.24, ease: ctx.ease('out') }, d * 0.68);
    tl.to(note, { autoAlpha: 1, duration: d * 0.22, ease: ctx.ease('out') }, d * 0.78);
    if (events[to]?.weight === 'major') {
      ctx.initial(media, { clipPath: 'inset(100% 0 0 0)' });
      tl.to(media, { clipPath: 'inset(0 0 0 0)', duration: d * 0.22, ease: ctx.ease('out') }, d * 0.76);
    }
    for (let i = from + 1; i < to; i += 1) {
      const minor = ['stem', 'title'].flatMap((name) => eventPart(ctx, name, i));
      ctx.initial(minor, { autoAlpha: 0, scale: 0.92 });
      tl.to(
        minor,
        {
          autoAlpha: params.trailOpacity,
          scale: 0.92,
          duration: Math.min(d * 0.2, 0.24),
          ease: ctx.ease('out'),
        },
        d * (0.2 + ((i - from - 1) / Math.max(1, to - from)) * 0.35),
      );
    }
    const counter = nodes(ctx, 'counter')[0];
    if (counter) {
      const reel = reelFrom(counter),
        kind = ctx.beat.data.counter,
        fromText = digits(events[from].date, kind),
        toText = digits(events[to].date, kind);
      reel.cols.forEach((col, i) => ctx.initial(col, { yPercent: -Number(fromText[i] ?? 0) * 10 }));
      if (ctx.reduce)
        reel.cols.forEach((col, i) => {
          if (fromText[i] !== toText[i]) tl.set(col, { yPercent: -Number(toText[i]) * 10 }, d * 0.7);
        });
      else
        rollReel(tl, reel, fromText, toText, {
          at: d * 0.05,
          duration: d * 0.65,
          ease: ctx.ease('travel'),
          steps: kind === 'month',
        });
    }
  },
};
