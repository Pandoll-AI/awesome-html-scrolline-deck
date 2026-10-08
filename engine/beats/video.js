/**
 * @stub W2-E5 구현 대상. 구현 시 이 줄 삭제 + video.test.js 작성
 * beat 'video'(CONTRACTS C4). parts: frame, media, caption. primary: frame.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--video" data-beat="<id>">는 build가 id를 채운다.
 */

/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'video',
  primary: 'frame',
  fields: {
    src: {
      type: 'asset',
      required: true,
      doc: 'mp4 경로'
    },
    poster: {
      type: 'asset',
      required: true,
      doc: '포스터 이미지'
    },
    alt: {
      type: 'string',
      required: true,
      doc: '대체 텍스트'
    },
    mode: {
      type: 'enum',
      values: [
        'scrub',
        'play',
        'loop'
      ],
      required: true,
      doc: 'scrub = 스크롤로 프레임, play/loop = 장면 안 재생'
    },
    frames: {
      type: 'asset',
      doc: 'frames.json 경로(scrub 필수)'
    },
    caption: {
      type: 'string',
      doc: '캡션'
    },
    mask: {
      type: 'object',
      fields: {
        type: {
          type: 'enum',
          values: [
            'text',
            'shape'
          ],
          required: true,
          doc: '마스크 종류'
        },
        text: {
          type: 'string',
          doc: 'text 마스크 글자'
        },
        shape: {
          type: 'string',
          doc: 'clip-path 값'
        }
      },
      doc: '영상 마스크'
    },
    source: {
      type: 'string',
      doc: '출처 id(deck.sources[].id). sample 덱이 아니면 수치·인용·실사에 필수'
    }
  },
  render(data, rc) {
    throw new Error('TODO(E5): render video');
  },
};
