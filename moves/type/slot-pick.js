/** Show candidate token probabilities and land the selected token in a word slot. */
import { transferVars } from '../../engine/index.js';
import { colorOf } from '../_shared/color.js';
import { gridLayout } from '../_shared/grid.js';
import { ghost } from '../_shared/link.js';

export default {
  id: 'slot-pick',
  family: 'type',
  role: 'enter',
  accepts: ['text'],
  sources: ['next-token', 'word-slot-cycle', 'phrase-push-build', 'word-rise-fade'],
  reduce: 'self',
  params: {
    word: { type: 'integer', default: 0, doc: '채울 어절 index' },
    candidates: { type: 'array', default: [], doc: '[{word, p, other?}] 후보 목록' },
    note: { type: 'string', default: '확률은 설명용 예시', doc: 'L3 확률 안내 문구' },
    duration: { type: 'number', default: 2.8, min: 1.2, max: 4.5, doc: '전체 길이(u)' },
    candsAt: { type: 'number', default: 0.42, min: 0.3, max: 0.6, doc: '후보 정지점 비율' },
    speed: { type: 'number', default: 1, min: 0.4, max: 1.5, doc: 'u당 글자 수' },
  },
  timing(p) {
    const duration = p.duration / p.speed;
    return { duration, stops: [{ name: 'cands', at: p.candsAt * duration }] };
  },
  build(tl, ctx, p) {
    const words = ctx.skipParts.includes('word') ? [] : ctx.beat.part('word');
    if (!words.length) return;
    const index = Math.min(words.length - 1, Math.max(0, p.word)),
      target = ctx.beat.anchor('word', index).rect,
      d = ctx.duration;
    const later = words.slice(index),
      candidates = p.candidates.length ? p.candidates : [{ word: words[index].textContent || '…', p: 100 }];
    const layout = gridLayout({
      n: candidates.length,
      cols: 1,
      cell: 28,
      gap: 4,
      origin: { x: target.x, y: target.y + target.h + 12 },
    });
    const caret = document.createElement('i');
    caret.textContent = '▍';
    caret.className = 'sl-slot-pick__caret';
    Object.assign(caret.style, {
      position: 'absolute',
      left: `${target.x}px`,
      top: `${target.y}px`,
      color: colorOf(ctx, 'accent'),
    });
    ctx.overlay.append(caret);
    const rows = candidates.map((candidate, i) => {
      const row = document.createElement('div');
      row.className = 'sl-slot-pick__candidate';
      row.textContent = `${candidate.word}  ${candidate.p}%`;
      Object.assign(row.style, {
        position: 'absolute',
        left: `${layout[i].x}px`,
        top: `${layout[i].y}px`,
        color: colorOf(ctx, 'fg'),
      });
      const bar = document.createElement('i');
      Object.assign(bar.style, {
        display: 'inline-block',
        height: '3px',
        background: colorOf(ctx, 'accent-2'),
        width: '0%',
      });
      row.append(bar);
      ctx.overlay.append(row);
      return { row, bar, candidate };
    });
    const note = document.createElement('small');
    note.textContent = p.note;
    note.className = 'sl-slot-pick__note';
    Object.assign(note.style, {
      position: 'absolute',
      left: `${target.x}px`,
      top: `${target.y + target.h + 8 + candidates.length * 32}px`,
      color: colorOf(ctx, 'fg-muted'),
    });
    ctx.overlay.append(note);
    const carrier = ghost(ctx, rows[0].row, { x: layout[0].x, y: layout[0].y, w: target.w, h: target.h });
    ctx.initial(later, { autoAlpha: 0, color: colorOf(ctx, 'fg') });
    ctx.initial(caret, { autoAlpha: 1, x: 0 });
    ctx.initial(note, { autoAlpha: 0 });
    ctx.initial(carrier, { autoAlpha: 0, x: 0, y: 0, scaleX: 1, scaleY: 1, transformOrigin: '0 0' });
    rows.forEach(({ row, bar, candidate }, i) => {
      ctx.initial(row, { autoAlpha: 0, y: 18, filter: 'none' });
      ctx.initial(bar, { width: '0%', autoAlpha: 1 });
      tl.to(row, { autoAlpha: 1, y: 0, duration: d * 0.18, ease: ctx.ease('out') }, i * 0.06);
      tl.to(bar, { width: `${candidate.p}%`, duration: d * 0.25, ease: ctx.ease('out') }, i * 0.06);
    });
    tl.to(note, { autoAlpha: 1, duration: d * 0.15, ease: ctx.ease('out') }, 0);
    const pickAt = d * 0.5,
      flyAt = d * 0.62;
    tl.to(rows[0].row, { color: colorOf(ctx, 'accent'), duration: d * 0.12, ease: ctx.ease('out') }, pickAt);
    if (rows.length > 1)
      tl.to(
        rows.slice(1).flatMap(({ row, bar }) => [row, bar]),
        { autoAlpha: 0.35, duration: d * 0.12, ease: ctx.ease('out') },
        pickAt,
      );
    tl.set(carrier, { autoAlpha: 1 }, flyAt);
    tl.to(
      carrier,
      {
        ...transferVars({ x: layout[0].x, y: layout[0].y, w: target.w, h: target.h }, target),
        duration: d * 0.26,
        ease: ctx.ease('land'),
      },
      flyAt,
    );
    tl.to(caret, { x: target.w, duration: d * 0.26, ease: ctx.ease('inout') }, flyAt);
    if (!ctx.reduce && rows.length > 1)
      tl.to(
        rows.slice(1).map(({ row }) => row),
        { y: 24, autoAlpha: 0, filter: 'blur(4px)', duration: d * 0.2, ease: ctx.ease('in') },
        flyAt,
      );
    tl.set(carrier, { autoAlpha: 0 }, d * 0.88);
    tl.set(words[index], { autoAlpha: 1, color: colorOf(ctx, 'accent') }, d * 0.88);
    tl.to(
      words[index],
      { color: colorOf(ctx, 'fg'), duration: Math.min(0.12, d * 0.12), ease: ctx.ease('out') },
      d * 0.88,
    );
    tl.set(
      rows.map(({ row }) => row),
      { filter: 'none' },
      d,
    );
  },
};
