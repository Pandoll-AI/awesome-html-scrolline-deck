import { describe, expect, it } from 'vitest';
import beat from './quote.js';
describe('quote beat', () => {
  it('renders actual quote words and attribution', () => {
    const view = beat.render({ text: '변화는 작은 선택에서 시작됩니다', by: '홍길동', role: '대표' }, {});
    expect(beat.fields.text.required).toBe(true);
    expect(view.parts.block).toHaveLength(1);
    expect(view.parts.mark[0].textContent).toBe('“');
    expect(view.parts.word.map((n) => n.textContent).join(' ')).toContain('선택에서');
    expect(view.parts.by[0].textContent).toContain('대표');
  });
  it('declares by required', () => expect(beat.fields.by.required).toBe(true));
});
