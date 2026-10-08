/**
 * @stub W2-E5 구현 대상. 구현 시 이 줄 삭제 + chart.test.js 작성
 * beat 'chart'(CONTRACTS C4). parts: plot, axis, mark, label, legend, source. primary: plot.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--chart" data-beat="<id>">는 build가 id를 채운다.
 */

/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'chart',
  primary: 'plot',
  fields: {
    kind: {
      type: 'enum',
      values: [
        'bar',
        'line',
        'area',
        'dot'
      ],
      required: true,
      doc: '차트 종류'
    },
    categories: {
      type: 'array',
      of: {
        type: 'string',
        doc: '범주'
      },
      required: true,
      doc: 'x축 범주'
    },
    series: {
      type: 'array',
      required: true,
      doc: '계열',
      of: {
        type: 'object',
        doc: '계열 1개',
        fields: {
          name: {
            type: 'string',
            required: true,
            doc: '계열 이름'
          },
          values: {
            type: 'array',
            required: true,
            of: {
              type: 'number',
              doc: '값'
            },
            doc: 'categories와 같은 길이'
          }
        }
      }
    },
    unit: {
      type: 'string',
      doc: '값 단위'
    },
    highlight: {
      type: 'object',
      fields: {
        series: {
          type: 'string',
          doc: '강조 계열'
        },
        index: {
          type: 'integer',
          doc: '강조 범주 index'
        }
      },
      doc: '강조'
    },
    states: {
      type: 'array',
      doc: 'steps에서 바뀌는 상태',
      of: {
        type: 'object',
        doc: '상태',
        fields: {
          name: {
            type: 'string',
            required: true,
            doc: '상태 이름(step name과 대응)'
          },
          kind: {
            type: 'enum',
            values: [
              'bar',
              'line',
              'area',
              'dot'
            ],
            doc: '바뀐 종류'
          },
          series: {
            type: 'any',
            doc: '바뀐 계열'
          }
        }
      }
    },
    source: {
      type: 'string',
      doc: '출처 id(deck.sources[].id). sample 덱이 아니면 수치·인용·실사에 필수'
    }
  },
  render(data, rc) {
    throw new Error('TODO(E5): render chart');
  },
};
