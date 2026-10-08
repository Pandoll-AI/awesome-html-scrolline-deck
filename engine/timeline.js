/**
 * @stub W2-E2 구현 대상. 구현 시 이 줄 삭제 + timeline.test.js 작성
 * 연속 timeline(CONTRACTS C6). plan = 순수(DOM 없음), build = DOM·GSAP.
 */
import { ENGINE_TIMING_DEFAULTS } from './constants.js';

/**
 * 내장 move 정의 4종(engine:fade-in, engine:fade-out, engine:crossfade, engine:none). MoveDef 형식.
 * @type {import('./types.js').MoveDef[]}
 */
export const ENGINE_MOVE_DEFS = [];

/**
 * ENGINE_TIMING_DEFAULTS → concept.timing → deck.timing 순으로 덮어쓴 값.
 * @param {Partial<import('./types.js').Timing>} [conceptTiming]
 * @param {Partial<import('./types.js').Timing>} [deckTiming]
 * @returns {import('./types.js').Timing}
 */
export function resolveTiming(conceptTiming = {}, deckTiming = {}) {
  return { ...ENGINE_TIMING_DEFAULTS, ...conceptTiming, ...deckTiming };
}

/**
 * C6 알고리즘 정본 그대로. viewport·reduce와 무관한 순수 함수.
 * @param {import('./types.js').DeckSpec} deck  validateDeck 통과한 덱
 * @param {{ registry: import('./types.js').Registry, concept: import('./types.js').ConceptPack,
 *           beatTypes?: Record<string, import('./types.js').BeatTypeDef>,
 *           sequences?: Record<string, import('./types.js').SequenceDef> }} env
 * @returns {import('./types.js').TimelineMap}
 */
export function plan(deck, env) {
  throw new Error('TODO(E2): plan');
}

/**
 * C6 build 순서 ①~⑦. reduce && move.reduce==='fade'면 REDUCE_FALLBACK으로 같은 길이 대체.
 * @param {import('./types.js').TimelineMap} map
 * @param {{ stage: import('./types.js').Stage, deck: import('./types.js').DeckSpec,
 *           registry: import('./types.js').Registry, concept: import('./types.js').ConceptPack,
 *           beatTypes: Record<string, import('./types.js').BeatTypeDef>,
 *           sequences?: Record<string, import('./types.js').SequenceDef>,
 *           reduce: boolean, gsap: object, plugins?: Record<string, any>,
 *           asset: (p: string) => string, measureFn?: Function }} env
 * @returns {import('./types.js').BuiltDeck}
 */
export function build(map, env) {
  throw new Error('TODO(E2): build');
}
