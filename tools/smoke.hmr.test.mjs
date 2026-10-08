// @vitest-environment node
import { expect, it } from 'vitest';
import { HMR_FREEZE, parseArgs } from './smoke.mjs';

// 회귀: 다른 에이전트가 파일을 저장하면 Vite가 탭을 새로 고쳐 window.__smoke가 사라졌다("reading 'at'").
it('drops Vite reload/update messages on the HMR socket only', () => {
  class FakeSocket {
    constructor(url, protocols) {
      this.url = url;
      this.protocols = protocols;
      this.listeners = [];
    }
    addEventListener(type, fn) {
      this.listeners.push({ type, fn });
    }
    emit(type, data) {
      for (const l of this.listeners) if (l.type === type) l.fn({ data });
    }
  }
  const window = { WebSocket: FakeSocket };
  new Function('window', HMR_FREEZE)(window);
  new Function('window', HMR_FREEZE)(window); // 두 번 주입해도 한 겹

  const got = [];
  const hmr = new window.WebSocket('ws://localhost:5190/', 'vite-hmr');
  hmr.addEventListener('message', ({ data }) => got.push(data.startsWith('{') ? JSON.parse(data).type : data));
  for (const type of ['connected', 'full-reload', 'update', 'prune', 'custom']) hmr.emit('message', JSON.stringify({ type }));
  hmr.emit('message', 'not json');
  expect(got).toEqual(['connected', 'custom', 'not json']);

  const other = [];
  const app = new window.WebSocket('ws://example/', ['chat']);
  app.addEventListener('message', ({ data }) => other.push(data));
  app.emit('message', JSON.stringify({ type: 'full-reload' }));
  expect(other).toHaveLength(1);
});

it('accepts --out for a run that must not overwrite the deck owner shots', () => {
  expect(parseArgs(['rail-ai-decade', '--shots', '--out', '/tmp/x'])).toMatchObject({ out: '/tmp/x', driver: 'chrome' });
  expect(parseArgs(['rail-ai-decade']).out).toBeNull();
});
