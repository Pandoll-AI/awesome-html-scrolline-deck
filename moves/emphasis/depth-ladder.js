/** Persistent depth ladder for zoom navigation. Used by zoom decks. */
import { colorOf } from '../_shared/color.js';
import { gridLayout } from '../_shared/grid.js';
import { px } from '../_shared/timeline.js';

export default {
  id: 'depth-ladder',
  family: 'emphasis',
  role: 'ambient',
  accepts: ['*'],
  sources: ['active-indicator-glide', 'progressive-disclosure', 'route-highlight'],
  reduce: 'fade',
  params: {
    rungs: { type: 'array', default: ['전체'], doc: '위에서 아래로 이어지는 경로 라벨' },
    level: { type: 'integer', default: 0, min: 0, max: 7, doc: '현재 깊이' },
    maxLevel: { type: 'integer', default: 0, min: 0, max: 7, doc: '지금까지 간 가장 깊은 칸' },
    appearAfter: { type: 'number', default: 0, min: 0, max: 4, doc: '나타나기 전 대기(u)' },
    side: { type: 'enum', default: 'left', values: ['left', 'right'], doc: '사다리 위치' },
  },
  timing: () => ({ duration: 'fill', stops: [] }),
  build(tl, ctx, params) {
    const x =
      params.side === 'right'
        ? ctx.viewport.w - px(ctx, ctx.tokens.ladderX ?? 72)
        : px(ctx, ctx.tokens.ladderX ?? 72);
    const top = px(ctx, ctx.tokens.ladderTop ?? 180),
      step = px(ctx, ctx.tokens.ladderStep ?? 32),
      accent = colorOf(ctx, 'accent');
    const rule = colorOf(ctx, 'rule'),
      fg = colorOf(ctx, 'fg');
    const ladder = document.createElement('div');
    ladder.className = 'sl-depth-ladder';
    Object.assign(ladder.style, { position: 'absolute', left: `${x}px`, top: `${top}px`, opacity: '0' });
    const rail = document.createElement('i');
    Object.assign(rail.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      height: `${Math.max(1, params.rungs.length - 1) * step + 8}px`,
      borderLeft: `1px solid ${rule}`,
    });
    ladder.append(rail);
    const cells = gridLayout({ n: params.rungs.length, cols: 1, cell: step, origin: { x: 0, y: 0 } });
    const entries = cells.map(({ i, y }) => {
      const entry = document.createElement('div'),
        tick = document.createElement('i'),
        text = document.createElement('span');
      entry.className = 'sl-depth-ladder__rung';
      text.textContent = params.rungs[i] ?? '';
      const isCurrent = i === params.level,
        faded = i > params.maxLevel;
      Object.assign(entry.style, {
        position: 'absolute',
        top: `${y}px`,
        left: '0',
        whiteSpace: 'nowrap',
        opacity: String(faded ? 0.35 : 1),
        color: isCurrent ? accent : fg,
      });
      Object.assign(tick.style, {
        display: 'inline-block',
        width: `${px(ctx, 6)}px`,
        marginRight: `${px(ctx, 8)}px`,
        borderTop: `1px solid ${isCurrent ? accent : rule}`,
        transformOrigin: 'left',
      });
      Object.assign(text.style, {
        fontFamily: 'monospace',
        fontSize: `${px(ctx, 18)}px`,
        display: 'inline-block',
      });
      entry.append(tick, text);
      if (isCurrent) {
        const dot = document.createElement('b');
        Object.assign(dot.style, {
          display: 'inline-block',
          width: `${px(ctx, 4)}px`,
          height: `${px(ctx, 4)}px`,
          marginRight: `${px(ctx, 5)}px`,
          borderRadius: '50%',
          background: accent,
        });
        entry.prepend(dot);
      }
      ladder.append(entry);
      return { entry, tick, text, isCurrent };
    });
    ctx.overlay.append(ladder);
    ctx.initial(ladder, { autoAlpha: 0 });
    entries.forEach(({ tick, text, isCurrent }) => {
      if (isCurrent) {
        ctx.initial(tick, { scaleX: 0 });
        ctx.initial(text, { clipPath: 'inset(0 100% 0 0)' });
      }
    });
    const at = params.appearAfter;
    tl.to(ladder, { autoAlpha: 1, duration: 0.18, ease: ctx.ease('out') }, at);
    const current = entries.find((entry) => entry.isCurrent);
    if (current) {
      tl.to(current.tick, { scaleX: 1, duration: 0.2, ease: ctx.ease('out') }, at);
      tl.to(current.text, { clipPath: 'inset(0 0% 0 0)', duration: 0.3, ease: ctx.ease('out') }, at);
    }
  },
};
