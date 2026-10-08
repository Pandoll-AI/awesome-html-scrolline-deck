/**
 * move·beat 테스트 harness(CONTRACTS C17). *.test.js에서만 import(C1 R2).
 * happy-dom은 layout이 없으므로 측정은 rects 옵션 값으로 대체(기본 {x:0,y:0,w:100,h:100}).
 */
import { gsap } from 'gsap';
import { anchorOf, measure } from './handoff.js';

const DEFAULT_RECT = { x: 0, y: 0, w: 100, h: 100 };
const PRIMARY_BY_TYPE = {
  text: 'block',
  photo: 'frame',
  video: 'frame',
  number: 'value',
  chart: 'plot',
  chronology: 'track',
  compare: 'item',
  quote: 'block',
  prompt: 'field',
  code: 'block',
};
const box = (r) => ({
  x: r.x,
  y: r.y,
  left: r.x,
  top: r.y,
  width: r.w,
  height: r.h,
  right: r.x + r.w,
  bottom: r.y + r.h,
  toJSON: () => ({}),
});

function defaults(schema = {}, supplied = {}) {
  const result = { ...supplied };
  for (const [key, field] of Object.entries(schema))
    if (result[key] === undefined && Object.hasOwn(field, 'default')) result[key] = field.default;
  return result;
}
function seeded(seed) {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => {
    value += 0x6d2b79f5;
    let n = value;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
function installRect(node, rect) {
  node.getBoundingClientRect = () => {
    if (node.style.transform === 'none') return box(rect);
    const transform = node.style.transform;
    const matrix = transform
      .match(/matrix\(([^)]+)\)/)?.[1]
      .split(',')
      .map(Number);
    const translate = transform.match(/translate(?:3d)?\(([-.\d]+)px(?:,\s*([-.\d]+)px)?/);
    const scale = transform.match(/scale\(([-.\d]+)(?:,\s*([-.\d]+))?/);
    const x = matrix?.[4] ?? (Number(translate?.[1]) || 0),
      y = matrix?.[5] ?? (Number(translate?.[2]) || 0);
    const sx = matrix?.[0] ?? (Number(scale?.[1]) || 1),
      sy = matrix?.[3] ?? (Number(scale?.[2] ?? scale?.[1]) || 1);
    return box({ x: rect.x + x, y: rect.y + y, w: rect.w * sx, h: rect.h * sy });
  };
}

/**
 * @param {{ beats: Array<{ id: string, type: string, data: object, place?: import('./types.js').Place }>,
 *           viewport?: Partial<import('./types.js').Viewport>, reduce?: boolean,
 *           rects?: Record<string, import('./types.js').Rect>,
 *           concept?: Partial<import('./types.js').ConceptPack> }} opts
 * @returns {{
 *   stage: import('./types.js').Stage,
 *   beats: Map<string, import('./types.js').BeatInstance>,
 *   runMove: (move: import('./types.js').MoveDef, o: { role: import('./types.js').Role, beat: string, from?: string, params?: object }) =>
 *            { tl: object, ctx: import('./types.js').MoveContext, timing: import('./types.js').MoveTiming },
 *   seek: (t: number) => void,
 *   snapshot: (nodes: Element[], props?: string[]) => object,
 *   destroy: () => void
 * }}
 */
export function createHarness(opts) {
  const viewport = { w: 1920, h: 1080, portrait: false, px: 1, dpr: 1, ...(opts.viewport ?? {}) };
  const rects = opts.rects ?? {},
    host = document.createElement('div'),
    root = document.createElement('div'),
    overlay = document.createElement('div');
  root.className = 'sl-stage';
  root.append(overlay);
  host.append(root);
  document.body.append(host);
  root.getBoundingClientRect = () => box({ x: 0, y: 0, w: viewport.w, h: viewport.h });
  const stage = {
    root,
    viewportEl: root,
    camera: root,
    world: root,
    screen: root,
    overlay,
    viewport,
    placeBeat() {},
    cameraVars: (target) => ({ ...target }),
    overlayFor(key) {
      const el = document.createElement('div');
      el.dataset.overlay = key;
      overlay.append(el);
      return el;
    },
    clear() {
      root.replaceChildren(overlay);
    },
  };
  const beats = new Map();
  for (const spec of opts.beats) {
    const beatRoot = document.createElement('section');
    beatRoot.className = `sl-beat sl-beat--${spec.type}`;
    beatRoot.dataset.beat = spec.id;
    const primary = spec.data?.primary ?? PRIMARY_BY_TYPE[spec.type] ?? 'primary';
    const names = new Set([...Object.keys(spec.data?.parts ?? {}), primary]);
    for (const key of Object.keys(rects))
      if (key.startsWith(`${spec.id}.`)) names.add(key.slice(spec.id.length + 1));
    const parts = {};
    for (const name of names) {
      const el = document.createElement('div');
      el.dataset.part = name;
      installRect(el, { ...(rects[`${spec.id}.${name}`] ?? DEFAULT_RECT) });
      beatRoot.append(el);
      parts[name] = [el];
    }
    root.append(beatRoot);
    const beat = {
      id: spec.id,
      type: spec.type,
      data: spec.data,
      place: spec.place ?? { slot: 'center' },
      root: beatRoot,
      parts,
      primary,
      part: (name) => parts[name] ?? [],
      span: { start: 0, stop: 0, end: 0 },
    };
    beats.set(spec.id, beat);
  }
  const measured = measure(root, [...beats.values()]);
  for (const beat of beats.values()) beat.anchor = (part) => anchorOf(beat, part, measured, beat.primary);
  const master = gsap.timeline({ paused: true, defaults: { ease: 'none' } }),
    concept = opts.concept ?? {};
  function runMove(move, run) {
    const beat = beats.get(run.beat),
      from = run.from ? beats.get(run.from) : undefined;
    if (!beat) throw new Error(`Unknown harness beat "${run.beat}"`);
    if (run.from && !from) throw new Error(`Unknown harness source beat "${run.from}"`);
    const params = defaults(move.params, run.params),
      data = move.role === 'link' ? { from: from.data, to: beat.data } : beat.data;
    const rawTiming = move.timing(params, data),
      duration = rawTiming.duration === 'fill' ? 1 : rawTiming.duration,
      initials = [];
    const ctx = {
      gsap,
      plugins: {},
      role: run.role,
      beat,
      from,
      prev: undefined,
      next: undefined,
      handoff: run.role === 'link' ? { from: from.anchor(), to: beat.anchor() } : undefined,
      stage,
      viewport,
      reduce: Boolean(opts.reduce),
      start: 0,
      duration,
      skipParts: [],
      overlay: stage.overlayFor(`${move.id}-${beat.id}`),
      tokens: concept.tokens ?? {},
      ease: (name) => concept.eases?.[name] ?? name,
      initial(targets, vars) {
        initials.push([targets, { ...vars }]);
      },
      rng: seeded(`${concept.id ?? 'test'}:${beat.id}:${run.role}:${move.id}`),
    };
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    move.build(tl, ctx, params);
    for (const [targets, vars] of initials) gsap.set(targets, vars);
    master.add(tl, 0);
    master.pause(0);
    return { tl, ctx, timing: { ...rawTiming, duration } };
  }
  return {
    stage,
    beats,
    runMove,
    seek(time) {
      master.pause(time);
    },
    snapshot(nodes, props = []) {
      return Object.fromEntries(
        nodes.map((node, index) => [
          index,
          {
            props: Object.fromEntries(props.map((prop) => [prop, gsap.getProperty(node, prop)])),
            style: node.getAttribute('style') ?? '',
          },
        ]),
      );
    },
    destroy() {
      master.kill();
      host.remove();
    },
  };
}
