/**
 * @stub W2-E5 구현 대상. 구현 시 이 줄 삭제 + compare.test.js 작성
 * beat 'compare'(CONTRACTS C4). parts: item, label, value, text, divider, verdict. primary: item.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--compare" data-beat="<id>">는 build가 id를 채운다.
 */

/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'compare',
  primary: 'item',
  fields: {
    items: {
      type: 'array',
      required: true,
      doc: '비교 항목 2~4개',
      of: {
        type: 'object',
        doc: '항목',
        fields: {
          label: {
            type: 'string',
            required: true,
            doc: '이름'
          },
          value: {
            type: 'number',
            doc: '수치'
          },
          text: {
            type: 'string',
            doc: '한 줄'
          },
          media: {
            type: 'asset',
            doc: '이미지'
          }
        }
      }
    },
    verdict: {
      type: 'string',
      doc: '결론 한 줄'
    }
  },
  render(data, rc) {
    throw new Error('TODO(E5): render compare');
  },
};
