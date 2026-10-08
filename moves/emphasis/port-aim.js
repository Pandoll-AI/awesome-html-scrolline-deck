/** Aim at one port before a zoom dive. Used by zoom decks. */
import { colorOf } from '../_shared/color.js';
import { drawOn, line, svgLayer } from '../_shared/stroke.js';
import { px } from '../_shared/timeline.js';

const nodesExcept = (ctx, name, index) =>
  Object.entries(ctx.beat.parts)
    .flatMap(([part, nodes]) => (part === name ? nodes.filter((_, i) => i !== index) : nodes))
    .filter((node) => !ctx.skipParts.includes(node.dataset.part) && !(ctx.skipNodes ?? []).includes(node));

export default {
  id: 'port-aim',
  family: 'emphasis',
  role: 'step',
  accepts: ['chart', 'number', 'compare', 'photo', 'video', 'text'],
  sources: ['focus-contraction', 'spotlight', 'annotation-callout', 'zoom-to-detail'],
  reduce: 'fade',
  params: {
    part: { type: 'part', default: '', doc: '조준할 포트 part(비우면 primary)' },
    index: { type: 'integer', default: 0, min: 0, max: 31, doc: '대상 요소 index' },
    box: { type: 'object', default: { x: 0, y: 0, w: 1, h: 1 }, doc: '포트 내부 정규화 상자' },
    label: { type: 'string', default: '', doc: '짧은 숫자 주석' },
    labelSide: { type: 'enum', default: 'right', values: ['right', 'left', 'top'], doc: '주석 방향' },
    duration: { type: 'number', default: 1.2, min: 0.6, max: 2, doc: 'u' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      anchor = ctx.beat.anchor(params.part, params.index),
      rect = anchor.rect;
    const box = params.box,
      port = { x: rect.x + rect.w * box.x, y: rect.y + rect.h * box.y, w: rect.w * box.w, h: rect.h * box.h };
    const radius = Math.hypot(port.w, port.h) / 2 + px(ctx, ctx.tokens.ringPad ?? 12);
    const startRadius = px(ctx, ctx.tokens.ringStart ?? radius / ctx.viewport.px + 44);
    const accent = colorOf(ctx, 'accent'),
      svg = svgLayer(ctx);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(port.x + port.w / 2));
    circle.setAttribute('cy', String(port.y + port.h / 2));
    circle.setAttribute('fill', accent);
    circle.setAttribute('stroke', accent);
    circle.setAttribute('stroke-width', String(px(ctx, ctx.tokens.ringStroke ?? 2)));
    svg.append(circle);
    const theta = -Math.PI / 4,
      cx = port.x + port.w / 2,
      cy = port.y + port.h / 2;
    const leadStart = { x: cx + Math.cos(theta) * radius, y: cy + Math.sin(theta) * radius };
    const dir = params.labelSide === 'left' ? -1 : params.labelSide === 'top' ? 0 : 1;
    const leadEnd =
      params.labelSide === 'top'
        ? { x: leadStart.x, y: leadStart.y - px(ctx, 64) }
        : { x: leadStart.x + dir * px(ctx, 64), y: leadStart.y };
    const leader = params.label
      ? line(svg, leadStart.x, leadStart.y, leadEnd.x, leadEnd.y, {
          stroke: accent,
          'stroke-width': px(ctx, ctx.tokens.leaderWidth ?? 1.5),
        })
      : null;
    const label = params.label ? document.createElement('div') : null;
    if (label) {
      label.className = 'sl-port-aim__label';
      label.textContent = params.label;
      Object.assign(label.style, {
        position: 'absolute',
        left: `${leadEnd.x}px`,
        top: `${leadEnd.y}px`,
        color: accent,
        fontFamily: 'monospace',
        fontWeight: '700',
      });
      ctx.overlay.append(label);
    }
    ctx.initial(circle, { attr: { r: startRadius }, fillOpacity: 0.18, strokeOpacity: 0 });
    if (leader) ctx.initial(leader, { strokeDashoffset: 1 });
    if (label) ctx.initial(label, { autoAlpha: 0, y: px(ctx, 8) });
    tl.to(
      nodesExcept(ctx, anchor.part, anchor.index),
      { opacity: ctx.tokens.dimOthers ?? 0.22, duration: d * 0.35, ease: ctx.ease('out') },
      0,
    );
    const hud = ctx.beat.part('hud').filter((node) => !(ctx.skipNodes ?? []).includes(node));
    if (hud.length) tl.to(hud, { opacity: 0.6, duration: d * 0.35, ease: ctx.ease('out') }, 0);
    tl.to(
      circle,
      { attr: { r: radius }, fillOpacity: 0, strokeOpacity: 1, duration: d * 0.45, ease: ctx.ease('inout') },
      d * 0.15,
    );
    if (params.label) {
      drawOn(tl, leader, { at: d * 0.45, duration: d * 0.35, ease: 'none' });
      tl.to(label, { autoAlpha: 1, y: 0, duration: d * 0.2, ease: ctx.ease('out') }, d * 0.6);
    }
  },
};
