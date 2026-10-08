/**
 * @stub W2-E5 구현 대상. 구현 시 이 줄 삭제 + quote.test.js 작성
 * beat 'quote'(CONTRACTS C4). parts: block, mark, word, by. primary: block.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--quote" data-beat="<id>">는 build가 id를 채운다.
 */

/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'quote',
  primary: 'block',
  fields: {
    text: {
      type: 'string',
      required: true,
      doc: '인용문'
    },
    by: {
      type: 'string',
      required: true,
      doc: '말한 사람'
    },
    role: {
      type: 'string',
      doc: '직함'
    },
    source: {
      type: 'string',
      doc: '출처 id(deck.sources[].id). sample 덱이 아니면 수치·인용·실사에 필수'
    }
  },
  render(data, rc) {
    throw new Error('TODO(E5): render quote');
  },
};
