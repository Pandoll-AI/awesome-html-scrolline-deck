/** Scrubs an exploded video frame, then draws one anchored annotation. */
import { frameSeqOf, scrubTo } from '../_shared/media.js';
import { drawOn, line, svgLayer } from '../_shared/stroke.js';

export default {
  id: 'scrub-callouts',
  family: 'media',
  role: 'step',
  accepts: ['video'],
  sources: ['frame-scrub', 'annotation-tracking', 'annotation-callout', 'exploded-assembly'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1, min: 0.5, max: 2.5, doc: '전체 길이(u)' },
    from: { type: 'number', default: -1, min: -1, max: 1, doc: '시작 진행률(-1 = 현재값)' },
    to: { type: 'number', default: 1, min: 0, max: 1, doc: '끝 진행률' },
    anchor: { type: 'object', default: { x: 0.62, y: 0.4 }, doc: 'frame 정규화 anchor' },
    label: { type: 'string', default: '부품', doc: '콜아웃 라벨' },
    note: { type: 'string', default: '부품 설명', doc: '콜아웃 설명' },
    side: { type: 'enum', default: 'left', values: ['left', 'right'], doc: '라벨 방향' },
    dimOthers: { type: 'boolean', default: true, doc: 'anchor 밖 영역 dim 여부' },
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const d = params.duration,
      rect = ctx.beat.anchor('frame').rect;
    const x = rect.x + rect.w * params.anchor.x,
      y = rect.y + rect.h * params.anchor.y;
    const labelX = params.side === 'left' ? Math.max(16, x - 150) : Math.min(ctx.viewport.w - 150, x + 24);
    const svg = svgLayer(ctx),
      stroke = line(svg, labelX, y, x, y, { stroke: '#f3a52b', 'stroke-width': 2 });
    const dot = document.createElement('i'),
      label = document.createElement('div'),
      note = document.createElement('div');
    dot.className = 'sl-scrub-callouts__dot';
    label.className = 'sl-scrub-callouts__label';
    note.className = 'sl-scrub-callouts__note';
    label.textContent = params.label;
    note.textContent = params.note;
    Object.assign(dot.style, { position: 'absolute', left: `${x}px`, top: `${y}px` });
    Object.assign(label.style, { position: 'absolute', left: `${labelX}px`, top: `${y}px` });
    Object.assign(note.style, { position: 'absolute', left: `${labelX}px`, top: `${y + 24}px` });
    ctx.overlay.append(dot, label, note);
    ctx.initial([dot, label, note], { autoAlpha: 0 });
    ctx.initial(label, { y: 12 });
    scrubTo(tl, frameSeqOf(ctx.beat), {
      from: params.from < 0 ? 0 : params.from,
      to: params.to,
      at: 0,
      duration: d * 0.7,
    });
    drawOn(tl, stroke, { at: d * 0.55, duration: d * 0.25, ease: 'none' });
    tl.to(dot, { autoAlpha: 1, duration: d * 0.08, ease: ctx.ease('out') }, d * 0.72);
    tl.to(label, { autoAlpha: 1, y: 0, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.65);
    tl.to(note, { autoAlpha: 1, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.65);
    if (params.dimOthers) {
      const scrim = document.createElement('div');
      scrim.className = 'sl-scrub-callouts__scrim';
      Object.assign(scrim.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        background: `radial-gradient(circle at ${params.anchor.x * 100}% ${params.anchor.y * 100}%, transparent 0%, rgba(0,0,0,.45) 55%)`,
      });
      ctx.overlay.append(scrim);
      ctx.initial(scrim, { autoAlpha: 0 });
      tl.to(scrim, { autoAlpha: 1, duration: d * 0.3, ease: ctx.ease('out') }, d * 0.7);
    }
  },
};
