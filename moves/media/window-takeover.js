/** Expands an already-open media window through its local tile. */
import { seg } from '../_shared/timeline.js';
export default {
  id: 'window-takeover',
  family: 'media',
  role: 'step',
  accepts: ['video', 'photo'],
  sources: ['inline-image-expand', 'scroll-grid-expand'],
  reduce: 'fade',
  params: {
    duration: { type: 'number', default: 1.2, min: 0.5, max: 2.4, doc: '전체 길이(u)' },
    scrim: { type: 'number', default: 0.55, min: 0, max: 0.8, doc: 'scrim(안무 설명의 같은 이름)' },
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const frame = ctx.beat.part('frame');
    const media = ctx.beat.part('media');
    const caption = ctx.beat.part('caption');
    tl.to(
      frame,
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        borderRadius: 0,
        ...seg(params.duration, 0, 0.7),
        ease: ctx.ease('inout'),
      },
      0,
    );
    tl.to(media, { scale: 1.02, ...seg(params.duration, 0, 0.7), ease: ctx.ease('inout') }, 0);
    tl.to(caption, { y: 120, ...seg(params.duration, 0.3, 0.8), ease: ctx.ease('out') }, 0);
    if (caption.length) {
      const s = document.createElement('div');
      s.className = 'sl-media-scrim';
      ctx.overlay.append(s);
      ctx.initial(s, { autoAlpha: 0, backgroundColor: `rgba(0,0,0,${params.scrim})` });
      tl.to(s, { autoAlpha: 1, ...seg(params.duration, 0.3, 0.8) }, 0);
    }
  },
};
