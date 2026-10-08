/**
 * @stub W2-E8 구현 대상. 구현 시 이 줄 삭제 + boot.test.js 작성
 * 통합 진입(CONTRACTS C15). live/export 분기, resize 규칙(C12), window.__deck, 이벤트.
 */

/**
 * @param {{ host: HTMLElement, deck: import('./types.js').DeckSpec, concept: import('./types.js').ConceptPack,
 *           moves: import('./types.js').Registry,
 *           sequences?: Record<string, import('./types.js').SequenceDef>,
 *           assetBase: string, mode?: 'live'|'export' }} opts
 * @returns {Promise<import('./types.js').DeckHandle>}
 */
export async function boot(opts) {
  throw new Error('TODO(E8): boot');
}
