/** Opening crane which rises from a tilted, close map view. */

const targetFor = (ctx) => ctx.camera ?? { x: 0.5, y: 0.5, s: 1, rx: 0, ry: 0 };
const flat = (vars) =>
  Object.fromEntries(
    Object.entries(vars).filter(([key]) => !['rotationX', 'rotationY', 'rx', 'ry'].includes(key)),
  );
const cameraVars = (ctx, target) => {
  const vars = ctx.stage.cameraVars(target);
  if (!Object.hasOwn(vars, 's')) return vars;
  const { s, ...rest } = vars;
  return { ...rest, scale: s };
};

export default {
  id: 'establish-crane',
  family: 'camera',
  role: 'camera',
  accepts: ['*'],
  sources: ['crane-tilt', 'perspective-tilt', 'atmospheric-depth'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 2.4, min: 1, max: 4, doc: '전체 길이(u)' },
    tilt: { type: 'number', default: 10, min: 0, max: 12, doc: 'tilt 각도(°, ≤12)' },
    startScale: { type: 'number', default: 1.6, min: 1, max: 2.5, doc: '시작 scale' },
    lift: { type: 'number', default: 0.35, min: 0, max: 1, doc: 'lift(안무 설명의 같은 이름)' },
    haze: { type: 'number', default: 0.5, min: 0, max: 1, doc: 'haze(안무 설명의 같은 이름)' },
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const target = targetFor(ctx),
      end = cameraVars(ctx, target);
    const scaleKey = Object.hasOwn(end, 'scale') ? 'scale' : 's';
    const rxKey = Object.hasOwn(end, 'rotationX') ? 'rotationX' : 'rx';
    const startTarget = {
      ...target,
      y: target.y + params.lift,
      s: target.s * params.startScale,
      rx: params.tilt,
      ry: 0,
    };
    const start = cameraVars(ctx, startTarget),
      d = params.duration;
    if (ctx.reduce) {
      ctx.initial(ctx.stage.camera, flat(start));
      tl.to(ctx.stage.camera, { ...flat(end), duration: d, ease: 'none' }, 0);
      return;
    }
    ctx.initial(ctx.stage.camera, start);
    tl.to(
      ctx.stage.camera,
      { ...start, [scaleKey]: end[scaleKey], duration: d * 0.4, ease: ctx.ease('out') },
      0,
    );
    tl.to(ctx.stage.camera, { ...end, [rxKey]: 0, duration: d * 0.4, ease: ctx.ease('inout') }, d * 0.4);
    tl.to(ctx.stage.camera, { ...end, duration: d * 0.2, ease: 'power3.out' }, d * 0.8);
    for (const layer of ctx.stage.root.querySelectorAll('[data-depth]')) {
      ctx.initial(layer, { y: params.haze * ctx.viewport.h });
      tl.to(layer, { y: 0, duration: d * 0.4, ease: ctx.ease('out') }, 0);
    }
  },
};
