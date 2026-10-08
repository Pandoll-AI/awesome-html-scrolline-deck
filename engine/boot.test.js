import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  validateDeck: vi.fn(),
  plan: vi.fn(),
  build: vi.fn(),
  createStage: vi.fn(),
  computeViewport: vi.fn(),
  createDriver: vi.fn(),
  createPresenter: vi.fn(),
  createA11y: vi.fn(),
  exportPath: vi.fn(),
  buildExport: vi.fn(),
}));
vi.mock('./deck-schema.js', () => ({ validateDeck: mocks.validateDeck }));
vi.mock('./timeline.js', () => ({ plan: mocks.plan, build: mocks.build }));
vi.mock('./stage.js', () => ({ createStage: mocks.createStage, computeViewport: mocks.computeViewport }));
vi.mock('./scroll.js', () => ({ createScrollDriver: mocks.createDriver }));
vi.mock('./presenter.js', () => ({ createPresenter: mocks.createPresenter }));
vi.mock('./a11y.js', () => ({ createA11y: mocks.createA11y, prefersReducedMotion: () => false }));
vi.mock('./export.js', () => ({ exportPath: mocks.exportPath, buildExportTimeline: mocks.buildExport }));
vi.mock('./beats/index.js', () => ({ beatTypes: {} }));

import { boot } from './boot.js';

const deck = { id: 'demo', concept: 'smoke', beats: [] };
const concept = { id: 'smoke' };
const moves = {};

function built() {
  return { tl: { time: vi.fn(() => 1.25), seek: vi.fn() }, beats: [], destroy: vi.fn() };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"></div>';
  delete window.__deck;
  delete window.__timelines;
  mocks.validateDeck.mockReturnValue({ ok: true, errors: [] });
  mocks.plan.mockReturnValue({ duration: 4, stops: [] });
  mocks.computeViewport.mockReturnValue({ w: 1000, h: 800 });
  mocks.createStage.mockImplementation((host) => {
    const root = document.createElement('div');
    host.append(root);
    return { root, clear: vi.fn(), viewport: {} };
  });
  mocks.build.mockResolvedValue(built());
  mocks.createDriver.mockImplementation(() => ({
    attach: vi.fn(),
    detach: vi.fn(),
    time: vi.fn(() => 1.25),
    seek: vi.fn(),
    stops: vi.fn(() => []),
  }));
  mocks.createPresenter.mockReturnValue({ destroy: vi.fn(), goto: vi.fn() });
  mocks.createA11y.mockReturnValue({ destroy: vi.fn() });
  mocks.exportPath.mockReturnValue({ duration: 8 });
  mocks.buildExport.mockReturnValue({});
});
afterEach(() => vi.useRealTimers());

describe('boot', () => {
  it('renders validation errors and throws before planning', async () => {
    mocks.validateDeck.mockReturnValue({ ok: false, errors: [{ path: 'beats[0]', message: 'bad' }] });
    await expect(
      boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' }),
    ).rejects.toThrow('validation failed');
    expect(document.querySelector('.sl-error')).not.toBeNull();
    expect(mocks.plan).not.toHaveBeenCalled();
  });

  it('builds the live integrations and exposes window.__deck', async () => {
    const ready = vi.fn();
    window.addEventListener('scrolline:ready', ready);
    const handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    expect(mocks.validateDeck).toHaveBeenCalledBefore(mocks.plan);
    expect(mocks.plan).toHaveBeenCalledBefore(mocks.createStage);
    expect(mocks.createDriver).toHaveBeenCalledOnce();
    expect(mocks.createPresenter).toHaveBeenCalledOnce();
    expect(window.__deck.mode).toBe('live');
    expect(ready).toHaveBeenCalledOnce();
    handle.destroy();
    window.removeEventListener('scrolline:ready', ready);
  });

  it('uses export wrapper instead of scroll integrations', async () => {
    await boot({
      host: document.querySelector('#app'),
      deck,
      concept,
      moves,
      assetBase: '/',
      mode: 'export',
    });
    expect(mocks.createDriver).not.toHaveBeenCalled();
    expect(mocks.createPresenter).not.toHaveBeenCalled();
    expect(mocks.buildExport).toHaveBeenCalledOnce();
    expect(window.__timelines.scrolline).toEqual({});
  });

  it('ignores small height-only resize but rebuilds and preserves time otherwise', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    const handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 950 });
    window.dispatchEvent(new Event('resize'));
    await vi.advanceTimersByTimeAsync(200);
    expect(mocks.build).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1050 });
    window.dispatchEvent(new Event('resize'));
    await vi.advanceTimersByTimeAsync(200);
    expect(mocks.build).toHaveBeenCalledTimes(2);
    expect(handle.driver.seek).toHaveBeenCalledWith(1.25, { immediate: true });
    handle.destroy();
  });
});
