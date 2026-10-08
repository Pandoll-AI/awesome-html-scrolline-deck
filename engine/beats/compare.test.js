import { describe, expect, it } from 'vitest';
import beat from './compare.js';
describe('compare beat', () => {
  it('renders compared items and verdict', () => {
    const view = beat.render(
      {
        items: [
          { label: 'A', value: 1200, text: '빠름' },
          { label: 'B', value: 800 },
        ],
        verdict: 'A를 선택',
      },
      { lang: 'ko' },
    );
    expect(beat.fields.items.required).toBe(true);
    expect(view.parts.item).toHaveLength(2);
    expect(view.parts.divider).toHaveLength(1);
    expect(view.parts.value[0].textContent).toBe('1,200');
    expect(view.parts.verdict[0].textContent).toBe('A를 선택');
  });
  it('requires items', () => expect(beat.fields.items.required).toBe(true));
});
