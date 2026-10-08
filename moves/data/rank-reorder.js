/** Carries matching chart bars to their new ranked positions. */
import { transferVars } from '../../engine/index.js';
import { countTo } from '../_shared/count.js';
import { finishLink } from '../_shared/link.js';
import { drawOn } from '../_shared/stroke.js';
import { px } from '../_shared/timeline.js';

const usable = (ctx, beat, name) =>
  (ctx.skipParts.includes(name) && beat === ctx.beat ? [] : beat.part(name)).filter(
    (node) => !(ctx.skipNodes ?? []).includes(node),
  );
const labels = (beat) => beat.data.categories ?? [];

export default {
  id: 'rank-reorder',
  family: 'data',
  role: 'link',
  accepts: ['chart'],
  sources: ['rank-transition', 'object-constant-update', 'bump-rank-reveal'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.6, min: 0.8, max: 2.8, doc: '전체 길이(u)' },
    matchBy: {
      type: 'enum',
      default: 'label',
      values: ['label', 'index'],
      doc: 'matchBy(안무 설명의 같은 이름)',
    },
  },
  handoff: (params, { from, to }) => ({
    from: { part: 'mark', index: 0 },
    to: {
      part: 'mark',
      index:
        params.matchBy === 'label'
          ? Math.max(0, (to.categories ?? []).indexOf((from.categories ?? [])[0]))
          : 0,
    },
  }),
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration;
    const fromMarks = usable(ctx, ctx.from, 'mark');
    const toMarks = ctx.beat.part('mark');
    const fromLabels = usable(ctx, ctx.from, 'label');
    const toLabels = usable(ctx, ctx.beat, 'label');
    const fromNames = labels(ctx.from),
      toNames = labels(ctx.beat);
    const pairs = toMarks.map((to, targetIndex) => {
      const sourceIndex = params.matchBy === 'label' ? fromNames.indexOf(toNames[targetIndex]) : targetIndex;
      return { to, targetIndex, sourceIndex, from: sourceIndex >= 0 ? fromMarks[sourceIndex] : null };
    });
    const visibleToMarks = toMarks.filter((node) => !(ctx.skipNodes ?? []).includes(node));
    ctx.initial(visibleToMarks.concat(toLabels), { autoAlpha: 0 });
    ctx.initial(fromMarks.concat(fromLabels), { autoAlpha: 1, x: 0, y: 0, scaleX: 1, scaleY: 1 });
    ctx.initial(usable(ctx, ctx.from, 'axis'), { autoAlpha: 1 });
    if (ctx.reduce) {
      tl.to(usable(ctx, ctx.from, 'axis'), { autoAlpha: 0, duration: d * 0.3, ease: ctx.ease('out') }, 0);
      tl.to(
        visibleToMarks.concat(toLabels),
        { autoAlpha: 1, duration: d * 0.3, ease: ctx.ease('out') },
        d * 0.55,
      );
      tl.to(
        fromMarks.concat(fromLabels),
        { autoAlpha: 0, duration: d * 0.3, ease: ctx.ease('in') },
        d * 0.55,
      );
      finishLink(tl, ctx, { at: d, cross: 0.12 });
      return;
    }
    tl.to(usable(ctx, ctx.from, 'axis'), { autoAlpha: 0, duration: d * 0.25, ease: ctx.ease('out') }, 0);
    usable(ctx, ctx.beat, 'axis').forEach((axis) => {
      axis.setAttribute?.('pathLength', '1');
      axis.style.strokeDasharray = '1 1';
      ctx.initial(axis, { strokeDashoffset: 1 });
      drawOn(tl, axis, { at: 0, duration: d * 0.25, ease: ctx.ease('out') });
    });
    pairs.forEach((pair) => {
      const at = d * (0.15 + pair.targetIndex * 0.03);
      if (pair.from) {
        const sourceRect = ctx.from.anchor('mark', pair.sourceIndex).rect;
        const targetRect = ctx.beat.anchor('mark', pair.targetIndex).rect;
        tl.to(
          pair.from,
          { ...transferVars(sourceRect, targetRect), duration: d * 0.55, ease: ctx.ease('inout') },
          at,
        );
        if (fromLabels[pair.sourceIndex] && toLabels[pair.targetIndex]) {
          const a = ctx.from.anchor('label', pair.sourceIndex).rect,
            b = ctx.beat.anchor('label', pair.targetIndex).rect;
          tl.to(
            fromLabels[pair.sourceIndex],
            { ...transferVars(a, b), duration: d * 0.55, ease: ctx.ease('inout') },
            at,
          );
        }
      } else {
        ctx.initial(pair.to, { scaleY: 0, transformOrigin: 'center bottom' });
        tl.to(pair.to, { autoAlpha: 1, scaleY: 1, duration: d * 0.3, ease: ctx.ease('out') }, d * 0.55);
      }
    });
    const toTitle = usable(ctx, ctx.beat, 'title').concat(usable(ctx, ctx.beat, 'dek'));
    ctx.initial(toTitle, { autoAlpha: 0, y: px(ctx, 12) });
    tl.to(toTitle, { autoAlpha: 1, y: 0, duration: d * 0.2, ease: ctx.ease('out') }, d * 0.8);
    tl.to(
      visibleToMarks.concat(toLabels),
      { autoAlpha: 1, duration: d * 0.12, ease: ctx.ease('out') },
      d * 0.88,
    );
    tl.to(fromMarks.concat(fromLabels), { autoAlpha: 0, duration: d * 0.12, ease: ctx.ease('in') }, d * 0.88);
    // A deterministic numeric proxy keeps numeric mark annotations compatible with rank labels.
    const note = usable(ctx, ctx.beat, 'note')[0];
    if (note) countTo(tl, note, { from: 0, to: 0, at: d * 0.8, duration: d * 0.01, ease: 'none' });
    finishLink(tl, ctx, { at: d, cross: 0.12 });
  },
};
