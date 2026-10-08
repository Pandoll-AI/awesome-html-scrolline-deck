import { describe, expect, it, vi } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './sticky-scrub-link.js';

const scenario = {
  beats: [
    { id: 'a', type: 'video', data: { parts: { caption: true } } },
    { id: 'b', type: 'video', data: { parts: { caption: true } } },
  ],
  rects: { 'a.frame': { x: 0, y: 0, w: 400, h: 220 }, 'b.frame': { x: 40, y: 20, w: 400, h: 220 } },
  run: { role: 'link', from: 'a', beat: 'b', params: { duration: 1.2, from: 0.2, to: 0.8, bAt: -1 } },
  prepare(h) {
    h.beats.get('a').media.seq = { setProgress: vi.fn() };
    h.beats.get('b').media.seq = { setProgress: vi.fn() };
  },
  carry: (h) => h.stage.overlay.querySelector('[data-sl-rect]'),
  nodes: () => [],
};
describe('sticky-scrub-link', () => {
  it('meets the link contract', () => expect(checkMove(move, scenario, createHarness)).toEqual([]));
  it('sets B at its handoff frame and finishes B visible', () => {
    const h = createHarness({ beats: scenario.beats, rects: scenario.rects });
    scenario.prepare(h);
    const r = h.runMove(move, scenario.run);
    h.seek(r.timing.duration);
    r.tl.seek(r.timing.duration);
    expect(h.beats.get('b').media.seq.setProgress).toHaveBeenCalledWith(0.8);
    expect(Number(r.ctx.gsap.getProperty(r.ctx.handoff.to.node, 'opacity'))).toBe(1);
    expect(Number(r.ctx.gsap.getProperty(r.ctx.handoff.from.node, 'opacity'))).toBe(0);
    h.destroy();
  });
});
