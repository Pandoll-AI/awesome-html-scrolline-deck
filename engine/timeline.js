/** Continuous, seekable timeline planning and construction (CONTRACTS C6). */
import { ENGINE_TIMING_DEFAULTS, REDUCE_FALLBACK, STOP_PREFIX } from './constants.js';
import { resolveParams } from './util/schema.js';
import { measure, anchorOf } from './handoff.js';
import { createRng, hashSeed } from './util/rng.js';

const field = (value, doc) => ({ type: 'number', default: value, min: 0, doc });
const allParts = (beat) => Object.values(beat.parts).flat();
const fadeIn = (tl, ctx, p) => {
  const nodes = allParts(ctx.beat).filter((n) => !ctx.skipParts.includes(n.dataset?.part));
  ctx.initial(nodes, { autoAlpha: 0 });
  tl.to(nodes, { autoAlpha: 1, duration: p.duration }, 0);
};
const fadeOut = (tl, ctx, p) => tl.to(allParts(ctx.beat), { autoAlpha: 0, duration: p.duration }, 0);
const crossfade = (tl, ctx, p) => {
  const to = allParts(ctx.beat);
  ctx.initial(to, { autoAlpha: 0 });
  const n = Math.min(p.duration * 0.4, 0.15);
  tl.to(allParts(ctx.from), { autoAlpha: 0, duration: p.duration - n }, 0);
  tl.to(to, { autoAlpha: 1, duration: n }, p.duration - n);
};
export const ENGINE_MOVE_DEFS = Object.freeze([
  {
    id: 'engine:fade-in',
    family: 'engine',
    role: 'enter',
    accepts: ['*'],
    sources: ['engine-fade'],
    reduce: 'self',
    params: { duration: field(0.4, 'Fade duration') },
    timing: (p) => ({ duration: p.duration, stops: [] }),
    build: fadeIn,
  },
  {
    id: 'engine:fade-out',
    family: 'engine',
    role: 'exit',
    accepts: ['*'],
    sources: ['engine-fade'],
    reduce: 'self',
    params: { duration: field(0.4, 'Fade duration') },
    timing: (p) => ({ duration: p.duration, stops: [] }),
    build: fadeOut,
  },
  {
    id: 'engine:crossfade',
    family: 'engine',
    role: 'link',
    accepts: ['*'],
    sources: ['engine-crossfade'],
    reduce: 'self',
    params: { duration: field(0.4, 'Crossfade duration') },
    timing: (p) => ({ duration: p.duration, stops: [] }),
    build: crossfade,
  },
  {
    id: 'engine:none',
    family: 'engine',
    role: 'ambient',
    accepts: ['*'],
    sources: ['engine-none'],
    reduce: 'self',
    params: { duration: field(0, 'No operation duration') },
    timing: () => ({ duration: 0, stops: [] }),
    build: () => {},
  },
]);
export function resolveTiming(conceptTiming = {}, deckTiming = {}) {
  return { ...ENGINE_TIMING_DEFAULTS, ...conceptTiming, ...deckTiming };
}
function defaultRef(b, role, concept) {
  if (b[role]) return b[role];
  const id = concept.defaults?.byType?.[b.type]?.[role] ?? concept.defaults?.[role];
  return id
    ? { move: id }
    : role === 'enter'
      ? { move: 'engine:fade-in' }
      : role === 'exit'
        ? { move: 'engine:fade-out' }
        : null;
}
function resolve(registry, ref) {
  if (!ref) return null;
  const move = registry.get(ref.move);
  return { move, params: resolveParams(move.params, ref.params ?? {}), at: ref.at ?? 0 };
}
function timing(move, params, data) {
  const x = move.timing(params, data) ?? {};
  if (typeof x.duration !== 'number' || x.duration < 0) throw new Error(`Invalid timing from ${move.id}`);
  return { duration: x.duration, stops: x.stops ?? [] };
}
function add(entry, role, r, start, end) {
  entry.spans.push({ role, move: r.move.id, start, end, params: r.params });
}

/** DOM-free deterministic C6 algorithm. */
export function plan(deck, env) {
  const T = resolveTiming(env.concept.timing, deck.timing);
  const beats = [];
  const stops = [];
  let prev;
  for (let i = 0; i < deck.beats.length; i += 1) {
    const b = deck.beats[i];
    const linkIn = prev?.link;
    let s = i === 0 ? 0 : linkIn ? prev.holdEnd + (b.at ?? 0) : prev.exitStart + (b.at ?? T.overlap);
    s = Math.max(s, prev?.start ?? 0);
    let t = s;
    const entry = { id: b.id, type: b.type, start: s, stop: s, end: s, spans: [] };
    if (linkIn) {
      const r = resolve(env.registry, linkIn);
      const l = timing(r.move, r.params, { from: prev.data, to: b });
      add(entry, 'link', r, s, s + l.duration);
      prev.entry.end = s + l.duration;
      prev.entry.spans
        .filter((x) => x.role === 'ambient' && x.end === null)
        .forEach((x) => {
          x.end = s + l.duration;
        });
      t = s + l.duration;
    }
    const enter = resolve(env.registry, defaultRef(b, 'enter', env.concept));
    if (enter) {
      const e = timing(enter.move, enter.params, b);
      const es = Math.max(s, t + enter.at);
      add(entry, 'enter', enter, es, es + e.duration);
      e.stops.forEach((x) =>
        stops.push({
          name: `${b.id}/${x.name}`,
          label: `${STOP_PREFIX}${b.id}/${x.name}`,
          t: es + x.at,
          beat: b.id,
        }),
      );
      entry.stop = es + e.duration;
    } else entry.stop = t;
    const camera = resolve(env.registry, b.camera);
    if (camera) {
      const c = timing(camera.move, camera.params, b);
      add(entry, 'camera', camera, s, s + c.duration);
      entry.stop = Math.max(entry.stop, s + c.duration);
    }
    if (b.stop !== false)
      stops.push({ name: b.id, label: `${STOP_PREFIX}${b.id}`, t: entry.stop, beat: b.id });
    let holdEnd = entry.stop + (b.hold ?? T.hold);
    for (let k = 0; k < (b.steps ?? []).length; k += 1) {
      const step = b.steps[k];
      const r = resolve(env.registry, step);
      const d = timing(r.move, r.params, b);
      add(entry, 'step', r, holdEnd, holdEnd + d.duration);
      stops.push({
        name: `${b.id}/${step.name ?? k + 1}`,
        label: `${STOP_PREFIX}${b.id}/${step.name ?? k + 1}`,
        t: holdEnd + d.duration,
        beat: b.id,
      });
      holdEnd += d.duration + (step.hold ?? T.hold);
    }
    entry.end = holdEnd;
    if (!b.link) {
      const exit = resolve(env.registry, defaultRef(b, 'exit', env.concept));
      if (exit) {
        const x = timing(exit.move, exit.params, b);
        add(entry, 'exit', exit, holdEnd, holdEnd + x.duration);
        entry.end = holdEnd + x.duration;
      }
    }
    for (const ref of b.ambient ?? []) {
      const r = resolve(env.registry, ref);
      const a = r.move.timing(r.params, b);
      add(entry, 'ambient', r, s, a.duration === 'fill' ? (b.link ? null : entry.end) : s + a.duration);
    }
    beats.push(entry);
    prev = { data: b, entry, start: s, holdEnd, exitStart: holdEnd, link: b.link };
  }
  for (const b of beats)
    b.spans
      .filter((x) => x.end === null)
      .forEach((x) => {
        x.end = b.end;
      });
  stops.sort((a, b) => a.t - b.t);
  const max = Math.max(0, ...beats.flatMap((b) => b.spans.map((x) => x.end)), ...stops.map((x) => x.t));
  return {
    version: 1,
    deck: deck.id,
    concept: env.concept.id,
    duration: max + T.tail,
    unit: T.unit,
    stops,
    beats,
  };
}

function typeFor(data, env) {
  return data.type === 'sequence' ? env.sequences?.[data.use] : env.beatTypes[data.type];
}
/** C6 builder; boot owns the asynchronous font-ready rebuild boundary. */
export function build(map, env) {
  const { stage, deck, gsap } = env;
  const initial = [];
  const beats = [];
  const byId = new Map();
  for (const data of deck.beats) {
    const type = typeFor(data, env);
    if (!type) throw new Error(`Unknown beat type: ${data.type}`);
    const view = type.render(data, {
      viewport: stage.viewport,
      lang: deck.lang,
      asset: env.asset ?? ((p) => p),
      media: env.media ?? {},
      el: env.el,
      words: env.words,
      chars: env.chars,
    });
    view.root.dataset.beat = data.id;
    stage.placeBeat(view.root, data.place ?? { slot: 'center' });
    const m = map.beats.find((x) => x.id === data.id);
    const beat = {
      id: data.id,
      type: data.type,
      data,
      place: data.place,
      root: view.root,
      parts: view.parts,
      part: (name) => view.parts[name] ?? [],
      span: { start: m.start, stop: m.stop, end: m.end },
    };
    beats.push(beat);
    byId.set(beat.id, beat);
  }
  const snapshot = measure(stage.root, beats, env.measureFn);
  for (const b of beats) b.anchor = (part) => anchorOf(b, part, snapshot, typeFor(b.data, env).primary);
  const master = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  for (const m of map.beats)
    for (const s of m.spans) {
      const beat = byId.get(m.id);
      const original = env.registry.get(s.move);
      const fallback = env.reduce && original.reduce === 'fade';
      const move = fallback ? env.registry.get(REDUCE_FALLBACK[s.role]) : original;
      if (s.role === 'camera' && env.reduce && original.reduce !== 'self')
        throw new Error('camera move must reduce itself');
      const local = gsap.timeline();
      const index = deck.beats.findIndex((x) => x.id === m.id);
      const from =
        s.role === 'link' ? byId.get(deck.beats[index - 1]?.id) : s.role === 'exit' ? beat : undefined;
      const ctx = {
        gsap,
        plugins: env.plugins ?? {},
        role: s.role,
        beat,
        from,
        stage,
        viewport: stage.viewport,
        reduce: !!env.reduce,
        start: s.start,
        duration: s.end - s.start,
        skipParts: [],
        overlay: stage.overlayFor(`${m.id}-${s.role}-${s.move}`),
        tokens: env.concept.tokens ?? {},
        ease: (n) => env.concept.eases?.[n] ?? n,
        initial: (nodes, vars) => initial.push([nodes, vars]),
        rng: createRng(hashSeed(`${deck.id}:${beat.id}:${s.role}:${move.id}`)),
      };
      if (from && s.role === 'link') {
        ctx.handoff = { from: from.anchor(), to: beat.anchor() };
        ctx.skipParts = [ctx.handoff.to.part];
      }
      move.build(local, ctx, fallback ? { duration: ctx.duration } : s.params);
      if (local.duration() > ctx.duration + 0.001)
        throw new Error(`${move.id} local timeline exceeds planned duration`);
      master.add(local, s.start);
    }
  initial.forEach(([nodes, vars]) => gsap.set(nodes, vars));
  map.stops.forEach((stop) => master.addLabel(stop.label, stop.t));
  beats.forEach((b, i) => {
    gsap.set(b.root, { autoAlpha: 0 });
    master.set(b.root, { autoAlpha: 1 }, b.span.start);
    if (i < beats.length - 1) master.set(b.root, { autoAlpha: 0 }, b.span.end);
  });
  if (master.duration() < map.duration)
    master.to({}, { duration: map.duration - master.duration() }, master.duration());
  return { tl: master, map, beats, byId, destroy: () => beats.forEach((b) => b.root.remove()) };
}
