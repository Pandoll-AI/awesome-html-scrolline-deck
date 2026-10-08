/** Map-to-map camera flight with a brief bank and depth parallax. */
import { clamp } from '../_shared/timeline.js';

const targetFor = (ctx, place) => {
  const world = place?.world;
  if (!world) return ctx.camera ?? { x: 0.5, y: 0.5, s: 1, rx: 0, ry: 0 };
  const s = world.s ?? 1;
  return { x: world.x + s * 0.5, y: world.y + s * 0.5, s: 1 / s, rx: 0, ry: 0 };
};
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
const mix = (from, to, amount) =>
  Object.fromEntries(
    Object.keys(to).map((key) => [
      key,
      typeof to[key] === 'number' ? from[key] + (to[key] - from[key]) * amount : to[key],
    ]),
  );

export default {
  id: 'arc-flight',
  family: 'camera',
  role: 'camera',
  accepts: ['*'],
  sources: ['camera-flight', 'parallax', 'deep-parallax', 'atmospheric-depth'],
  reduce: 'self',
  params: {
    duration: { type: 'number', default: 1.8, min: 0.6, max: 4, doc: '전체 길이(u)' },
    altitude: { type: 'number', default: 0.32, min: 0, max: 0.6, doc: 'altitude(안무 설명의 같은 이름)' },
    bank: { type: 'number', default: 5, min: 0, max: 8, doc: 'bank(안무 설명의 같은 이름)' },
    parallax: { type: 'number', default: 0.35, min: 0, max: 1, doc: 'parallax(안무 설명의 같은 이름)' },
    settle: { type: 'number', default: 0.12, min: 0, max: 0.3, doc: 'settle(안무 설명의 같은 이름)' },
    ease: { type: 'ease', default: 'flight', doc: '컨셉 ease alias' },
  },
  timing(params) {
    return { duration: params.duration, stops: [] };
  },
  build(tl, ctx, params) {
    const target = ctx.camera ?? targetFor(ctx, ctx.beat.place);
    const origin = ctx.prev?.place?.world ? targetFor(ctx, ctx.prev.place) : target;
    const distance = Math.hypot(target.x - origin.x, target.y - origin.y);
    const glide = distance < 0.6;
    const start = cameraVars(ctx, origin);
    const end = cameraVars(ctx, target);
    const scaleKey = Object.hasOwn(end, 'scale') ? 'scale' : 's';
    const rxKey = Object.hasOwn(end, 'rotationX') ? 'rotationX' : 'rx';
    const ryKey = Object.hasOwn(end, 'rotationY') ? 'rotationY' : 'ry';
    const d = params.duration,
      settle = Math.min(params.settle, d * 0.12);
    const cruise = { ...start, [scaleKey]: start[scaleKey] * (1 - (glide ? 0 : params.altitude) * distance) };
    cruise[scaleKey] = Math.max(0.08, cruise[scaleKey]);
    const bank = glide ? 0 : clamp(params.bank, 0, 8);
    cruise[rxKey] = target.y - origin.y === 0 ? 0 : Math.sign(origin.y - target.y) * bank * 0.55;
    cruise[ryKey] = target.x - origin.x === 0 ? 0 : Math.sign(target.x - origin.x) * bank;
    if (ctx.reduce) {
      ctx.initial(ctx.stage.camera, flat(start));
      tl.to(ctx.stage.camera, { ...flat(end), duration: d, ease: 'none' }, 0);
      return;
    }
    ctx.initial(ctx.stage.camera, start);
    tl.to(ctx.stage.camera, { ...cruise, duration: d * 0.18, ease: ctx.ease('inout') }, 0);
    tl.to(
      ctx.stage.camera,
      {
        ...cruise,
        x: mix(start, end, 0.92).x,
        y: mix(start, end, 0.92).y,
        duration: d * 0.54,
        ease: ctx.ease(params.ease),
      },
      d * 0.18,
    );
    const near = mix(cruise, end, 0.995);
    near[rxKey] = 0;
    near[ryKey] = 0;
    tl.to(ctx.stage.camera, { ...near, duration: d * 0.16, ease: ctx.ease('out') }, d * 0.72);
    tl.to(
      ctx.stage.camera,
      { ...end, duration: settle || d * 0.12, ease: 'power3.out' },
      d - (settle || d * 0.12),
    );
    const layers = [...ctx.stage.root.querySelectorAll('[data-depth]')];
    for (const layer of layers) {
      const depth = Number(layer.dataset.depth) || 0;
      const amount =
        (ctx.tokens.depthFar ?? 0.35) + depth * ((ctx.tokens.depthNear ?? 1) - (ctx.tokens.depthFar ?? 0.35));
      ctx.initial(layer, { x: 0, y: 0 });
      tl.to(
        layer,
        {
          x: (end.x - start.x) * params.parallax * amount,
          y: (end.y - start.y) * params.parallax * amount,
          duration: d * 0.54,
          ease: ctx.ease(params.ease),
        },
        d * 0.18,
      );
    }
  },
};
