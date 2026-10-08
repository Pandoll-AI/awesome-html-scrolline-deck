import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './dot-seed.js';

const scenario = {
  beats: [{ id: 'c', type: 'chart', data: { parts: { mark: 1, note: 1, title: 1, dek: 1 } } }],
  rects: { 'c.mark': { x: 100, y: 100, w: 12, h: 12 }, 'c.note': { x: 180, y: 80, w: 100, h: 20 } },
  run: { role: 'enter', beat: 'c', params: { duration: 1, noteSide: 'right' } },
};
it('meets the move contract', () => expect(checkMove(move, scenario, createHarness)).toEqual([]));
it('has a bounded default duration', () => expect(move.timing(scenario.run.params).duration).toBe(1));
