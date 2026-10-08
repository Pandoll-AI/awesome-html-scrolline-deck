/** Replaces a number in place, retaining the struck old value as context. */
import { colorOf } from '../_shared/color.js';
import { line, svgLayer, drawOn } from '../_shared/stroke.js';
import { px } from '../_shared/timeline.js';

const format = (value, decimals, lang) =>
  new Intl.NumberFormat(lang ?? 'ko', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
const part = (ctx, name) => (ctx.skipParts.includes(name) ? [] : ctx.beat.part(name));

export default {
  id: 'strike-swap',
  family: 'data',
  role: 'step',
  accepts: ['number'],
  sources: ['strikethrough-replace', 'rolling-digits', 'count-up'],
  reduce: 'self',
  params: {
    to: { type: 'number', default: 0, doc: '새 값' },
    decimals: { type: 'integer', default: 0, min: 0, max: 4, doc: 'decimals(안무 설명의 같은 이름)' },
    suffix: { type: 'string', default: '', doc: '새 값 뒤 단위. 비우면 data.format.suffix' },
    label: { type: 'string', default: '', doc: '새 label 한 줄. 비우면 기존 유지' },
    duration: { type: 'number', default: 1.6, min: 0.8, max: 3, doc: 'u' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration,
      data = ctx.beat.data,
      oldValue = part(ctx, 'value')[0],
      oldDigits = part(ctx, 'digits')[0];
    if (!oldValue || !oldDigits) return;
    const rect = ctx.beat.anchor('digits').rect,
      svg = svgLayer(ctx);
    const strike = line(svg, rect.x, rect.y + rect.h / 2, rect.x + rect.w, rect.y + rect.h / 2, {
      stroke: colorOf(ctx, 'accent'),
      'stroke-width': 2,
    });
    drawOn(tl, strike, { at: 0, duration: d * 0.3, ease: ctx.ease('out') });
    tl.to(
      oldValue,
      {
        y: ctx.reduce ? 0 : '-0.55em',
        scale: ctx.reduce ? 1 : 0.62,
        autoAlpha: 0.35,
        duration: d * 0.3,
        ease: ctx.ease('inout'),
      },
      d * 0.25,
    );
    const fresh = document.createElement('span');
    fresh.className = 'sl-strike-swap__value';
    fresh.textContent = format(data.value, params.decimals, data.lang);
    Object.assign(fresh.style, {
      position: 'absolute',
      left: rect.x + 'px',
      top: rect.y + 'px',
      color: colorOf(ctx, 'accent-2'),
      fontVariantNumeric: 'tabular-nums',
    });
    ctx.overlay.append(fresh);
    const proxy = { v: data.value };
    ctx.initial(fresh, { autoAlpha: 0, y: ctx.reduce ? 0 : px(ctx, 10) });
    tl.to(fresh, { autoAlpha: 1, y: 0, duration: d * 0.45, ease: ctx.ease('out') }, d * 0.4);
    if (!ctx.reduce)
      tl.fromTo(
        proxy,
        { v: data.value },
        {
          v: params.to,
          duration: d * 0.45,
          ease: ctx.ease('out'),
          immediateRender: false,
          onUpdate: () => {
            fresh.textContent = format(proxy.v, params.decimals, data.lang);
          },
        },
        d * 0.4,
      );
    else tl.set(fresh, { textContent: format(params.to, params.decimals, data.lang) }, d * 0.4);
    tl.set(fresh, { textContent: format(params.to, params.decimals, data.lang) }, d * 0.85);
    const labels = part(ctx, 'label');
    tl.to(labels, { autoAlpha: 0, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.6);
    if (params.label) {
      const label = document.createElement('p');
      label.className = 'sl-strike-swap__label';
      label.textContent = params.label;
      Object.assign(label.style, { position: 'absolute', left: rect.x + 'px', top: rect.y + rect.h + 'px' });
      ctx.overlay.append(label);
      ctx.initial(label, { autoAlpha: 0, y: ctx.reduce ? 0 : px(ctx, 10) });
      tl.to(label, { autoAlpha: 1, y: 0, duration: d * 0.4, ease: ctx.ease('out') }, d * 0.6);
    }
  },
};
