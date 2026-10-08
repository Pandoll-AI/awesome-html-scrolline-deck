/** 통합 진입(CONTRACTS C12, C15). */
import { EVENTS, RESIZE, VERSION } from './constants.js';
import { createA11y, prefersReducedMotion } from './a11y.js';
import { validateDeck } from './deck-schema.js';
import { buildExportTimeline, exportPath } from './export.js';
import { createPresenter } from './presenter.js';
import { createScrollDriver } from './scroll.js';
import { computeViewport, createStage } from './stage.js';
import { build, plan } from './timeline.js';
import { beatTypes } from './beats/index.js';
import { gsap } from 'gsap';

const eventTarget = () => (typeof window === 'undefined' ? null : window);

function emit(name, detail) {
  const target = eventTarget();
  if (target) target.dispatchEvent(new CustomEvent(name, { detail }));
}

function errorScreen(host, errors) {
  const box = document.createElement('section');
  box.className = 'sl-error';
  box.setAttribute('role', 'alert');
  const heading = document.createElement('h1');
  heading.textContent = 'Deck validation failed';
  const list = document.createElement('ul');
  for (const issue of errors) {
    const item = document.createElement('li');
    item.textContent =
      typeof issue === 'string' ? issue : `${issue.path ?? 'deck'}: ${issue.message ?? 'invalid'}`;
    list.append(item);
  }
  box.append(heading, list);
  host.replaceChildren(box);
}

function viewportFor(mode) {
  if (mode === 'export') return computeViewport(1920, 1080, 1);
  return computeViewport(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
}

function makeTrack(host) {
  const track = document.createElement('div');
  track.className = 'sl-track';
  track.setAttribute('aria-hidden', 'true');
  host.append(track);
  return track;
}

/**
 * @param {{ host: HTMLElement, deck: import('./types.js').DeckSpec, concept: import('./types.js').ConceptPack,
 *           moves: import('./types.js').Registry,
 *           sequences?: Record<string, import('./types.js').SequenceDef>,
 *           assetBase: string, mode?: 'live'|'export' }} opts
 * @returns {Promise<import('./types.js').DeckHandle>}
 */
export async function boot(opts) {
  const { host, deck, concept, moves, sequences = {}, assetBase, mode = 'live' } = opts;
  if (!host) throw new TypeError('boot requires host');
  if (mode !== 'live' && mode !== 'export') throw new TypeError(`Unknown boot mode: ${mode}`);

  const validation = validateDeck(deck, { registry: moves, concept, beatTypes, sequences });
  if (!validation.ok) {
    errorScreen(host, validation.errors);
    const error = new Error(`Deck validation failed (${validation.errors.length} errors)`);
    error.errors = validation.errors;
    throw error;
  }

  const map = plan(deck, { registry: moves, concept, beatTypes, sequences });
  let viewport = viewportFor(mode);
  const stage = createStage(host, { viewport, concept, mode });
  const track = mode === 'live' ? makeTrack(host) : null;
  let built;
  let driver;
  let presenter;
  let a11y;
  let resizeTimer;
  let disposed = false;
  let fontsRebuilt = false;
  let removeResize = () => {};

  const buildDeck = async () => {
    built?.destroy?.();
    built = await build(map, {
      stage,
      deck,
      registry: moves,
      concept,
      beatTypes,
      sequences,
      reduce: mode === 'live' && prefersReducedMotion(),
      assetBase,
    });
    return built;
  };

  await buildDeck();

  const rebuild = async (reason = 'resize') => {
    if (disposed) return;
    const time = driver?.time?.() ?? built.tl.time?.() ?? 0;
    driver?.detach?.();
    presenter?.destroy?.();
    a11y?.destroy?.();
    stage.clear();
    viewport = viewportFor(mode);
    stage.viewport = viewport;
    // The map deliberately remains unchanged: geometry must not alter timing.
    await buildDeck();
    if (mode === 'live') {
      driver = createScrollDriver({ track, tl: built.tl, map, viewport, reduce: prefersReducedMotion() });
      driver.attach();
      driver.seek(time, { immediate: true });
      presenter = createPresenter(driver, { reduce: prefersReducedMotion() });
      a11y = createA11y({ stage, beats: built.beats });
    }
    emit(EVENTS.rebuild, { reason, time });
  };

  if (mode === 'live') {
    const reduce = prefersReducedMotion();
    driver = createScrollDriver({ track, tl: built.tl, map, viewport, reduce });
    driver.attach();
    presenter = createPresenter(driver, { reduce });
    a11y = createA11y({ stage, beats: built.beats });
    let previous = { w: window.innerWidth, h: window.innerHeight };
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const current = { w: window.innerWidth, h: window.innerHeight };
        const heightChange = previous.h ? Math.abs(current.h - previous.h) / previous.h : 1;
        if (current.w === previous.w && heightChange < RESIZE.heightTolerance) return;
        previous = current;
        void rebuild('resize');
      }, RESIZE.debounceMs);
    };
    window.addEventListener('resize', onResize);
    // Keep removal private while preserving the public, contract-defined handle shape.
    removeResize = () => window.removeEventListener('resize', onResize);
  } else {
    const path = exportPath(map, deck.export);
    const wrapper = buildExportTimeline(built.tl, path, gsap);
    window.__timelines ??= {};
    window.__timelines.scrolline = wrapper;
    emit(EVENTS.exportReady, { duration: path.duration });
  }

  const api = {
    version: VERSION,
    mode,
    map,
    tl: built.tl,
    time: () => driver?.time?.() ?? built.tl.time(),
    seek: (t) => (driver ? driver.seek(t) : built.tl.seek(t)),
    goto: (name) => {
      if (presenter) return presenter.goto(name);
      const stop = map.stops.find((item) => item.name === name || item.label === name);
      if (stop) built.tl.seek(stop.t);
    },
    stops: () => (driver ? driver.stops() : map.stops),
  };
  window.__deck = api;
  emit(EVENTS.ready, { map, mode });

  // Fonts can change measured rects once.  Do not delay readiness for it.
  document.fonts?.ready?.then(() => {
    if (!fontsRebuilt && !disposed) {
      fontsRebuilt = true;
      void rebuild('fonts');
    }
  });

  return {
    map,
    get built() {
      return built;
    },
    get driver() {
      return driver;
    },
    get presenter() {
      return presenter;
    },
    rebuild,
    destroy() {
      disposed = true;
      clearTimeout(resizeTimer);
      removeResize();
      driver?.detach?.();
      presenter?.destroy?.();
      a11y?.destroy?.();
      built?.destroy?.();
      track?.remove();
      stage.root?.remove();
      if (window.__deck === api) delete window.__deck;
    },
  };
}
