/** Final atlas pullback: reveal depth, then settle a whole-map view. */

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
  id: 'atlas-pullback',
  family: 'camera',
  role: 'camera',
  accepts: ['*'],
  sources: ['zoom-to-detail', 'perspective-tilt', 'atmospheric-depth'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 3.2, min: 1.5, max: 5, doc: '전체 길이(u)' },
    bounds: {
      type: 'object',
      default: { x0: -0.6, y0: -0.6, x1: 6, y1: 4.6 },
      doc: 'bounds(안무 설명의 같은 이름)',
    },
    margin: { type: 'number', default: 0.06, min: 0, max: 0.2, doc: 'margin(안무 설명의 같은 이름)' },
    tilt: { type: 'number', default: 6, min: 0, max: 10, doc: 'tilt 각도(°, ≤12)' },
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const startTarget = ctx.camera ?? { x: 0.5, y: 0.5, s: 1, rx: 0, ry: 0 };
    const b = params.bounds,
      fit = (1 / Math.max(b.x1 - b.x0, b.y1 - b.y0)) * (1 - params.margin);
    const end = cameraVars(ctx, { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, s: fit, rx: 0, ry: 0 });
    const start = cameraVars(ctx, startTarget),
      rxKey = Object.hasOwn(end, 'rotationX') ? 'rotationX' : 'rx',
      d = params.duration;
    if (ctx.reduce) {
      ctx.initial(ctx.stage.camera, flat(start));
      tl.to(ctx.stage.camera, { ...flat(end), duration: d, ease: 'none' }, 0);
      return;
    }
    ctx.initial(ctx.stage.camera, start);
    tl.to(ctx.stage.camera, { ...start, scale: start.scale, duration: d * 0.3, ease: ctx.ease('out') }, 0);
    const raised = { ...end, [rxKey]: params.tilt };
    tl.to(ctx.stage.camera, { ...raised, duration: d * 0.4, ease: ctx.ease('inout') }, d * 0.3);
    tl.to(ctx.stage.camera, { ...end, duration: d * 0.3, ease: 'power3.out' }, d * 0.7);
  },
};
