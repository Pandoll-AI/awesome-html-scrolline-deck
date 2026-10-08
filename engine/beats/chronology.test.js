import { describe, expect, it } from 'vitest';
import beat from './chronology.js';
describe('chronology beat', () => {
  it('puts time-scaled events in proportional positions', () => {
    const view = beat.render(
      {
        scale: 'time',
        axis: 'x',
        events: [
          { date: '2020-01-01', title: '시작' },
          { date: '2022-01-01', title: '중간', note: '성장' },
          { date: '2024-01-01', title: '현재' },
        ],
      },
      {},
    );
    expect(beat.fields.events.required).toBe(true);
    expect(view.parts.track).toHaveLength(1);
    expect(view.parts.event.map((n) => n.dataset.position)).toEqual(['0', expect.any(String), '1']);
    expect(Number(view.parts.event[1].dataset.position)).toBeGreaterThan(0.49);
    expect(Number(view.parts.event[1].dataset.position)).toBeLessThan(0.51);
    expect(view.parts.date).toHaveLength(3);
    expect(view.parts.title).toHaveLength(3);
    expect(view.parts.note[0].textContent).toBe('성장');
  });
  it('requires at least events schema field', () => expect(beat.fields.events.required).toBe(true));
});
