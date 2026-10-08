/** Removes caption, then dims a media frame to a black-stage exit. */
export default {
  id: 'lights-out',
  family: 'reveal',
  role: 'exit',
  accepts: ['video', 'photo'],
  sources: ['dip-to-color', 'spotlight'],
  reduce: 'fade',
  params: {
    duration: { type: 'number', default: 1, min: 0.4, max: 2, doc: '전체 길이(u)' },
    darkFloor: { type: 'number', default: 0.04, min: 0, max: 0.3, doc: 'darkFloor(안무 설명의 같은 이름)' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration;
    const frame = ctx.skipParts.includes('frame')
      ? []
      : ctx.beat.part('frame').filter((n) => !ctx.skipNodes?.includes(n));
    const captions = ctx.skipParts.includes('caption')
      ? []
      : ctx.beat.part('caption').filter((n) => !ctx.skipNodes?.includes(n));
    if (ctx.reduce) {
      tl.to(frame, { autoAlpha: 0, duration: d, ease: ctx.ease('in') }, 0);
      return;
    }
    ctx.initial(frame, { autoAlpha: 1, filter: 'brightness(1) saturate(1)' });
    ctx.initial(captions, { autoAlpha: 1, y: 0 });
    tl.to(captions, { autoAlpha: 0, y: -8, duration: d * 0.3, ease: ctx.ease('in') }, 0);
    const tone = { p: 0 };
    tl.to(
      tone,
      {
        p: 1,
        duration: d * 0.6,
        ease: ctx.ease('in'),
        onUpdate: () => {
          const brightness = 1 + (params.darkFloor - 1) * tone.p;
          const saturation = 1 - 0.4 * tone.p;
          frame.forEach((node) => {
            node.style.filter = `brightness(${brightness}) saturate(${saturation})`;
          });
        },
      },
      d * 0.1,
    );
    tl.set(frame, { filter: `brightness(${params.darkFloor}) saturate(0.6)` }, d * 0.7);
    tl.to(frame, { autoAlpha: 0, duration: d * 0.3, ease: ctx.ease('in') }, d * 0.7);
  },
};
