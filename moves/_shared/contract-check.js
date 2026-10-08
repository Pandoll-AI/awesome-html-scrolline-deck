/** Move contract checker used from tests without importing Vitest. */
import { createRegistry } from '../../engine/index.js';
import { carriedRect } from './link.js';
const snapshot = (h, nodes) =>
  nodes.map((node) => ({
    props: ['x', 'y', 'scaleX', 'scaleY', 'opacity'].map((p) => h.run?.ctx?.gsap?.getProperty(node, p)),
    style: node.getAttribute('style') ?? '',
    text: node.textContent,
  }));
export function checkMove(move, scenario, createHarness) {
  const failures = [];
  let h;
  try {
    createRegistry([move]);
  } catch (error) {
    failures.push(`registry: ${error.message}`);
    return failures;
  }
  const make = (reduce = false) => {
    const value = createHarness({
      beats: scenario.beats,
      rects: scenario.rects,
      viewport: scenario.viewport,
      concept: scenario.concept,
      reduce,
    });
    scenario.prepare?.(value);
    return value;
  };
  try {
    h = make();
    const params = scenario.run.params ?? {};
    const data =
      scenario.run.role === 'link'
        ? { from: h.beats.get(scenario.run.from).data, to: h.beats.get(scenario.run.beat).data }
        : h.beats.get(scenario.run.beat).data;
    const one = move.timing(params, data),
      two = move.timing(params, data);
    if (JSON.stringify(one) !== JSON.stringify(two)) failures.push('timing is not pure');
    if (move.role !== 'ambient' && !(one.duration > 0)) failures.push('timing duration must be positive');
    if (move.role !== 'ambient' && one.duration === 'fill') failures.push('fill is ambient only');
    const result = h.runMove(move, scenario.run);
    if (result.tl.duration() > result.timing.duration + 0.001)
      failures.push('timeline exceeds timing duration');
    const nodes =
      scenario.nodes?.(h, result.ctx) ??
      [...h.beats.values()]
        .flatMap((beat) => Object.values(beat.parts).flat())
        .concat([...result.ctx.overlay.querySelectorAll('*')]);
    const snap = () =>
      nodes.map((node) => ({
        props: ['x', 'y', 'scaleX', 'scaleY', 'opacity'].map((p) => result.ctx.gsap.getProperty(node, p)),
        style: node.getAttribute('style') ?? '',
        text: node.textContent,
      }));
    const d = result.timing.duration;
    h.seek(0.37 * d);
    const a = snap();
    h.seek(0.81 * d);
    h.seek(0.37 * d);
    if (JSON.stringify(a) !== JSON.stringify(snap())) failures.push('seek is not deterministic');
    h.seek(0);
    const zero = snap();
    h.seek(d);
    h.seek(0);
    if (JSON.stringify(zero) !== JSON.stringify(snap()))
      failures.push('rewind does not restore initial state');
    if (scenario.run.role === 'link') {
      h.seek(d);
      const { from, to } = result.ctx.handoff;
      if (
        Number(result.ctx.gsap.getProperty(to.node, 'opacity')) !== 1 ||
        to.node.style.visibility === 'hidden' ||
        Number(result.ctx.gsap.getProperty(from.node, 'opacity')) !== 0
      )
        failures.push('link end visibility');
      if (scenario.carry !== null) {
        const carry = scenario.carry?.(h, result.ctx) ?? from.node;
        const rect = carry.dataset?.slRect
          ? carriedRect(carry, result.ctx.gsap)
          : carry.getBoundingClientRect();
        const target = to.rect;
        if (
          ['x', 'y', 'w', 'h'].some(
            (key) =>
              Math.abs(
                (rect[key] ?? rect[{ x: 'left', y: 'top', w: 'width', h: 'height' }[key]]) - target[key],
              ) > 1,
          )
        )
          failures.push('link carry rect');
      }
    }
    h.destroy();
    h = make(true);
    const reduced = h.runMove(move, scenario.run);
    for (const t of [0, reduced.timing.duration / 2, reduced.timing.duration]) {
      h.seek(t);
      const all = [...h.stage.root.querySelectorAll('*')];
      if (all.some((node) => /blur\((?!0(?:px)?\))/.test(node.getAttribute('style') ?? '')))
        failures.push('reduce leaves blur');
      const threeD = ['rotate' + 'X', 'rotate' + 'Y', 'translate' + 'Z', 'per' + 'spective', 'matrix3d'];
      if (
        move.family !== 'camera' &&
        all.some((node) => threeD.some((key) => (node.getAttribute('style') ?? '').includes(key)))
      )
        failures.push('non-camera uses 3d');
    }
  } catch (error) {
    failures.push(`run: ${error.message}`);
  } finally {
    h?.destroy();
  }
  return [...new Set(failures)];
}
