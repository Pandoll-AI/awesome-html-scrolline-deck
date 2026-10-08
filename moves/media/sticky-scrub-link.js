/** Keeps a product canvas fixed while its frame and captions hand over. Signature launch link. */
import { frameSeqOf, scrubTo } from '../_shared/media.js';
import { finishLink, ghost } from '../_shared/link.js';

const usable = (ctx, beat, name) =>
  beat.part(name).filter((node) => !ctx.skipParts.includes(name) && !ctx.skipNodes?.includes(node));
export default {
  id: 'sticky-scrub-link',
  family: 'media',
  role: 'link',
  accepts: ['video'],
  sources: ['scroll-frame-scrub', 'frame-scrub', 'anchored-substitution'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.2, min: 0.6, max: 3, doc: '전체 길이(u)' },
    from: { type: 'number', default: -1, min: -1, max: 1, doc: '시작 진행률(-1 = 현재값)' },
    to: { type: 'number', default: 1, min: 0, max: 1, doc: '끝 진행률' },
    captionOut: { type: 'number', default: 0.25, min: 0.1, max: 0.5, doc: 'A caption 퇴장 비율' },
    captionIn: { type: 'number', default: 0.6, min: 0.3, max: 0.9, doc: 'B caption 입장 비율' },
    swapAt: { type: 'number', default: 0.9, min: 0.5, max: 1, doc: 'frame 교체 비율' },
    bAt: { type: 'number', default: -1, min: -1, max: 1, doc: 'B frame 진행률(-1 = to)' },
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const d = params.duration,
      start = params.from < 0 ? 0 : params.from;
    const aCaption = usable(ctx, ctx.from, 'caption');
    const bCaption = usable(ctx, ctx.beat, 'caption');
    const aSeq = frameSeqOf(ctx.from),
      bSeq = frameSeqOf(ctx.beat);
    const { from, to } = ctx.handoff;
    const carry = ghost(ctx, from.node, from.rect);
    const bProgress = params.bAt < 0 ? params.to : params.bAt;
    ctx.initial(aCaption, { autoAlpha: 1, y: 0 });
    ctx.initial(bCaption, { autoAlpha: 0, y: 12 });
    ctx.initial(carry, { autoAlpha: 1, transformOrigin: '0 0' });
    tl.to(aCaption, { autoAlpha: 0, y: 12, duration: d * params.captionOut, ease: ctx.ease('in') }, 0);
    scrubTo(tl, aSeq, { from: start, to: params.to, at: d * 0.05, duration: d * (params.swapAt - 0.05) });
    scrubTo(tl, bSeq, { from: bProgress, to: bProgress, at: d * params.swapAt, duration: d * 0.1 });
    tl.to(
      carry,
      {
        x: to.rect.x - from.rect.x,
        y: to.rect.y - from.rect.y,
        scaleX: from.rect.w ? to.rect.w / from.rect.w : 1,
        scaleY: from.rect.h ? to.rect.h / from.rect.h : 1,
        duration: d * 0.1,
        ease: ctx.ease('inout'),
      },
      d * 0.9,
    );
    tl.to(
      bCaption,
      { autoAlpha: 1, y: 0, duration: d * (1 - params.captionIn), ease: ctx.ease('out') },
      d * params.captionIn,
    );
    tl.set(carry, { autoAlpha: 0 }, d);
    finishLink(tl, ctx, { at: d, cross: 0.1, from: [from.node], to: [to.node] });
  },
};
