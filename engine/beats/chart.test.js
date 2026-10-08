import { describe, expect, it } from 'vitest';
import beat from './chart.js';
const data = {
  kind: 'bar',
  categories: ['Q1', 'Q2'],
  series: [{ name: '매출', values: [10, 20] }],
  source: 's1',
};
describe('chart beat', () => {
  it('creates a contract SVG and indexed series marks', () => {
    const view = beat.render(data, {});
    expect(beat.fields.kind.required).toBe(true);
    expect(view.parts.plot[0].getAttribute('viewBox')).toBe('0 0 1600 900');
    expect(view.parts.mark).toHaveLength(2);
    expect(view.parts.mark.map((m) => `${m.dataset.series}/${m.dataset.index}`)).toEqual(['0/0', '0/1']);
    expect(view.parts.axis).toHaveLength(1);
    expect(view.parts.label).toHaveLength(2);
    expect(view.parts.legend[0].textContent).toBe('매출');
    expect(view.parts.source[0].textContent).toBe('s1');
  });
  it('requires categories and series', () => {
    expect(beat.fields.categories.required).toBe(true);
    expect(beat.fields.series.required).toBe(true);
  });
});
