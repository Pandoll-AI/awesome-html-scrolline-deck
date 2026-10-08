/**
 * beat 'chart'(CONTRACTS C4). parts: plot, axis, mark, label, legend, source. primary: plot.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--chart" data-beat="<id>">는 build가 id를 채운다.
 */

import { add, node, root } from './helpers.js';
/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'chart',
  primary: 'plot',
  fields: {
    kind: {
      type: 'enum',
      values: ['bar', 'line', 'area', 'dot'],
      required: true,
      doc: '차트 종류',
    },
    categories: {
      type: 'array',
      of: {
        type: 'string',
        doc: '범주',
      },
      required: true,
      doc: 'x축 범주',
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
            doc: '계열 이름',
          },
          values: {
            type: 'array',
            required: true,
            of: {
              type: 'number',
              doc: '값',
            },
            doc: 'categories와 같은 길이',
          },
        },
      },
    },
    unit: {
      type: 'string',
      doc: '값 단위',
    },
    highlight: {
      type: 'object',
      fields: {
        series: {
          type: 'string',
          doc: '강조 계열',
        },
        index: {
          type: 'integer',
          doc: '강조 범주 index',
        },
      },
      doc: '강조',
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
            doc: '상태 이름(step name과 대응)',
          },
          kind: {
            type: 'enum',
            values: ['bar', 'line', 'area', 'dot'],
            doc: '바뀐 종류',
          },
          series: {
            type: 'any',
            doc: '바뀐 계열',
          },
        },
      },
    },
    source: {
      type: 'string',
      doc: '출처 id(deck.sources[].id). sample 덱이 아니면 수치·인용·실사에 필수',
    },
  },
  render(data, rc) {
    const parts = {};
    const view = root('chart', rc);
    const svg = add(parts, 'plot', node(rc, 'svg', 'sl-chart', view));
    svg.setAttribute('viewBox', '0 0 1600 900');
    svg.setAttribute('role', 'img');
    const values = data.series.flatMap((series) => series.values);
    const max = Math.max(1, ...values);
    const n = data.categories.length;
    const axis = add(parts, 'axis', node(rc, 'g', 'sl-chart__axis', svg));
    axis.append(node(rc, 'line', null, null));
    axis.lastElementChild.setAttribute('x1', '120');
    axis.lastElementChild.setAttribute('x2', '1500');
    axis.lastElementChild.setAttribute('y1', '760');
    axis.lastElementChild.setAttribute('y2', '760');
    data.categories.forEach((category, index) => {
      const label = add(parts, 'label', node(rc, 'text', 'sl-chart__label', svg, category));
      label.setAttribute('x', String(160 + index * (1300 / Math.max(1, n - 1))));
      label.setAttribute('y', '820');
    });
    data.series.forEach((series, si) => {
      add(parts, 'legend', node(rc, 'span', 'sl-chart__legend', view, series.name));
      const points = series.values.map((value, index) => [
        160 + index * (1300 / Math.max(1, n - 1)),
        760 - (value / max) * 600,
      ]);
      if (data.kind === 'line' || data.kind === 'area') {
        const path = add(parts, 'mark', node(rc, 'path', `sl-chart__mark sl-chart__mark--${data.kind}`, svg));
        path.setAttribute(
          'd',
          `M ${points.map((p) => p.join(' ')).join(' L ')}` +
            (data.kind === 'area' ? ' L 1460 760 L 160 760 Z' : ''),
        );
        path.dataset.series = String(si);
        path.dataset.index = 'all';
      }
      points.forEach(([x, y], index) => {
        const mark = add(
          parts,
          'mark',
          node(
            rc,
            data.kind === 'bar' ? 'rect' : 'circle',
            `sl-chart__mark sl-chart__mark--${data.kind}`,
            svg,
          ),
        );
        mark.dataset.series = String(si);
        mark.dataset.index = String(index);
        if (data.kind === 'bar') {
          mark.setAttribute('x', String(x - 24 + si * 50));
          mark.setAttribute('y', String(y));
          mark.setAttribute('width', '44');
          mark.setAttribute('height', String(760 - y));
        } else {
          mark.setAttribute('cx', String(x));
          mark.setAttribute('cy', String(y));
          mark.setAttribute('r', '11');
        }
      });
    });
    if (data.source) add(parts, 'source', node(rc, 'small', 'sl-chart__source', view, data.source));
    return { root: view, parts };
  },
};
