/** Fold unneeded words away, then carry the retained phrase into the next text beat. */
import { transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { finishLink } from '../_shared/link.js';
import { clamp } from '../_shared/timeline.js';
import { ghostWords, wordsIn } from '../_shared/words.js';

const available = (ctx, part) => (ctx.skipParts.includes(part) ? [] : ctx.from.part(part));

export default {
  id: 'phrase-fold',
  family: 'type',
  role: 'link',
  accepts: ['text'],
  sources: ['letter-anagram-shift', 'origami-fold', 'phrase-push-build', 'text-half-split'],
  reduce: 'fade',
  params: {
    fromPart: { type: 'part', default: 'word', doc: 'A의 어절 part' },
    toPart: { type: 'part', default: 'block', doc: 'B의 도착 part' },
    keepFrom: { type: 'integer', default: 0, doc: '남길 첫 어절 index' },
    keepTo: { type: 'integer', default: -1, doc: '남길 끝 어절 index(−1 = 끝)' },
    fold: {
      type: 'enum',
      default: 'right',
      values: ['right', 'both'],
      doc: 'right(뒤부터 접힘, 되감기) | both(양옆에서 가운데로)',
    },
    caret: { type: 'boolean', default: false, doc: '접힌 자리에 커서 남김' },
    appendIn: { type: 'boolean', default: false, doc: 'B의 나머지 어절이 따라 붙음' },
    duration: { type: 'number', default: 1.6, min: 0.8, max: 3, doc: '전체 길이(u)' },
  },
  handoff(p) {
    return { from: { part: p.fromPart, index: p.keepFrom }, to: { part: p.toPart } };
  },
  timing: (p) => ({ duration: p.duration, stops: [] }),
  build(tl, ctx, p) {
    const d = p.duration,
      source = available(ctx, p.fromPart);
    const sourceRect = ctx.handoff.from.rect;
    const words =
      p.fromPart === 'word' && source.length ? source : ghostWords(ctx, ctx.handoff.from.node, sourceRect);
    const end = p.keepTo < 0 ? words.length - 1 : clamp(p.keepTo, 0, words.length - 1);
    const begin = clamp(p.keepFrom, 0, Math.max(0, end));
    const kept = words.slice(begin, end + 1);
    const discarded = words.filter((_, index) => index < begin || index > end);
    const order =
      p.fold === 'both'
        ? discarded.sort(
            (a, b) =>
              Math.abs(words.indexOf(b) - (begin + end) / 2) - Math.abs(words.indexOf(a) - (begin + end) / 2),
          )
        : discarded.sort((a, b) => words.indexOf(b) - words.indexOf(a));
    words.forEach((node) => ctx.initial(node, { autoAlpha: 1, scaleX: 1 }));
    order.forEach((node, index) => {
      const left = words.indexOf(node) < begin;
      tl.to(
        node,
        {
          scaleX: 0,
          autoAlpha: 0,
          transformOrigin: left ? 'right center' : 'left center',
          duration: d * 0.2,
          ease: ctx.ease('inout'),
        },
        Math.min(d * 0.25, index * 0.05),
      );
    });
    kept.forEach((node) => {
      const from = node === ctx.handoff.from.node ? ctx.handoff.from.rect : sourceRect;
      tl.to(
        node,
        { ...transferVars(from, ctx.handoff.to.rect), duration: d * 0.5, ease: ctx.ease('inout') },
        d * 0.3,
      );
    });
    if (p.caret) {
      const caret = document.createElement('i');
      caret.className = 'sl-phrase-fold__caret';
      caret.textContent = '▍';
      Object.assign(caret.style, {
        position: 'absolute',
        left: `${sourceRect.x + sourceRect.w}px`,
        top: `${sourceRect.y}px`,
        color: colorOf(ctx, 'accent'),
      });
      ctx.overlay.append(caret);
      ctx.initial(caret, { autoAlpha: 0 });
      tl.to(caret, { autoAlpha: 1, duration: d * 0.08, ease: ctx.ease('out') }, d * 0.4);
      tl.to(caret, { autoAlpha: 0, duration: d * 0.08, ease: ctx.ease('in') }, d * 0.84);
    }
    if (p.appendIn) {
      const incoming = ctx.skipParts.includes('word') ? [] : wordsIn(ctx.beat, p.toPart);
      incoming.forEach((node) => {
        if (node !== ctx.handoff.to.node) {
          ctx.initial(node, { x: '0.3em', autoAlpha: 0 });
          tl.to(node, { x: 0, autoAlpha: 1, duration: d * 0.12, ease: ctx.ease('out') }, d * 0.8);
        }
      });
    }
    finishLink(tl, ctx, {
      at: d,
      cross: Math.min(0.1, d * 0.08),
      from: [...new Set([...words, ctx.handoff.from.node])],
    });
  },
};
