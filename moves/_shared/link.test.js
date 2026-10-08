import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { carriedRect, finishLink, ghost } from './link.js';
it('finishes links and creates measurable ghosts', () => {
  const h = createHarness({
    beats: [
      { id: 'a', type: 'text', data: {} },
      { id: 'b', type: 'text', data: {} },
    ],
  });
  const move = {
    id: 'link-test',
    family: 'morph',
    role: 'link',
    accepts: ['*'],
    sources: ['x'],
    reduce: 'self',
    params: {},
    timing: () => ({ duration: 0.5 }),
    build(tl, ctx) {
      finishLink(tl, ctx, { at: 0.5, cross: 0.3 });
    },
  };
  const r = h.runMove(move, { role: 'link', beat: 'b', from: 'a' });
  h.seek(0.5);
  expect(Number(r.ctx.gsap.getProperty(r.ctx.handoff.to.node, 'opacity'))).toBe(1);
  const copy = ghost(r.ctx, r.ctx.handoff.from.node, { x: 1, y: 2, w: 3, h: 4 });
  expect(copy.parentElement).toBe(r.ctx.overlay);
  expect(copy.dataset.part).toBeUndefined();
  r.ctx.gsap.set(copy, { x: 2, scaleX: 2 });
  expect(carriedRect(copy, r.ctx.gsap)).toEqual({ x: 3, y: 2, w: 6, h: 4 });
  h.destroy();
});
