/**
 * @stub W2-E5 구현 대상. 구현 시 이 줄 삭제 + prompt.test.js 작성
 * beat 'prompt'(CONTRACTS C4). parts: field, char, caret, label, result. primary: field.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--prompt" data-beat="<id>">는 build가 id를 채운다.
 */

/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'prompt',
  primary: 'field',
  fields: {
    text: {
      type: 'string',
      required: true,
      doc: '프롬프트 원문(글자 단위 타이핑)'
    },
    label: {
      type: 'string',
      doc: '입력창 위 라벨'
    },
    result: {
      type: 'object',
      doc: '결과',
      fields: {
        type: {
          type: 'enum',
          values: [
            'photo',
            'text'
          ],
          required: true,
          doc: '결과 종류'
        },
        src: {
          type: 'asset',
          doc: '이미지'
        },
        text: {
          type: 'string',
          doc: '답 텍스트'
        },
        alt: {
          type: 'string',
          doc: '대체 텍스트'
        }
      }
    }
  },
  render(data, rc) {
    throw new Error('TODO(E5): render prompt');
  },
};
