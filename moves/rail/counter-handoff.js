/** Counter reels become the next metric. Rail signature link. */
import { transferVars } from '../../engine/index.js';
import { finishLink, ghost } from '../_shared/link.js';
import { buildReel, reelFrom, rollReel } from '../_shared/reel.js';

const numberText = (data) => String(data.value ?? '0');
const dateText = (data) =>
  String(data.events?.[0]?.date ?? '000000')
    .replace(/\D/g, '')
    .slice(0, 6);

export default {
  id: 'counter-handoff',
  family: 'rail',
  role: 'link',
  accepts: ['number', 'chronology'],
  sources: ['rolling-digits', 'count-up', 'match-cut', 'scale-swap', 'glyph-roll'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.8, min: 0.8, max: 3, doc: '전체 길이(u)' },
    stagger: { type: 'number', default: 0.04, min: 0, max: 0.12, doc: '항목 간 시차(u)' },
    dim: { type: 'number', default: 0.12, min: 0, max: 0.4, doc: '물린 대상 opacity' },
  },
  timing: (p) => ({ duration: p.duration, stops: [] }),
  handoff(p, { from, to }) {
    return {
      from: { part: from.type === 'chronology' ? 'counter' : 'value' },
      to: { part: to.type === 'chronology' ? 'counter' : 'value' },
    };
  },
  build(tl, ctx, p) {
    const d = p.duration,
      from = ctx.handoff.from,
      to = ctx.handoff.to;
    if (ctx.reduce) return finishLink(tl, ctx, { at: d, cross: 0.12 });
    const carry = ghost(ctx, from.node, from.rect);
    const outgoing = ctx.from.type === 'chronology';
    const sourceText = outgoing ? dateText(ctx.from.data) : numberText(ctx.from.data);
    const targetText = outgoing ? numberText(ctx.beat.data) : dateText(ctx.beat.data);
    buildReel(carry, sourceText);
    ctx.initial(carry, { autoAlpha: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, transformOrigin: '0 0' });
    ctx.initial(to.node, { autoAlpha: 0 });
    ctx.initial(from.node, { autoAlpha: 1 });
    const railParts = ['track', 'event'];
    const railNodes = railParts.flatMap((name) => ctx.from.part(name));
    tl.to(railNodes, { y: 24, autoAlpha: p.dim, duration: d * 0.15, ease: ctx.ease('in') }, 0);
    tl.to(carry, { ...transferVars(from.rect, to.rect), duration: d * 0.6, ease: ctx.ease('out') }, d * 0.1);
    rollReel(tl, reelFrom(carry), sourceText, targetText, {
      at: d * 0.2,
      duration: d * 0.65,
      ease: ctx.ease('arrive'),
      stagger: p.stagger,
    });
    if (!outgoing) {
      const incoming = ['track', 'event'].flatMap((name) => ctx.beat.part(name));
      ctx.initial(incoming, { y: 24, autoAlpha: p.dim });
      tl.to(incoming, { y: 0, autoAlpha: 1, duration: d * 0.45, ease: ctx.ease('out') }, d * 0.55);
    }
    finishLink(tl, ctx, { at: d, cross: 0.12, from: [from.node, carry] });
  },
};
