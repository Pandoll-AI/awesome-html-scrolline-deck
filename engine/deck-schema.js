/**
 * @stub W2-E2 구현 대상. 구현 시 이 줄 삭제 + deck-schema.test.js 작성
 * deck.yaml 검사 + 내용 감사(CONTRACTS C3). 자리표 패턴은 constants.PLACEHOLDER_PATTERNS.
 */

/**
 * @param {import('./types.js').DeckSpec} deck
 * @param {{ registry: import('./types.js').Registry, concept: import('./types.js').ConceptPack,
 *           beatTypes: Record<string, import('./types.js').BeatTypeDef>,
 *           sequences?: Record<string, import('./types.js').SequenceDef> }} env
 * @returns {{ ok: boolean, errors: import('./types.js').SchemaIssue[] }}
 */
export function validateDeck(deck, env) {
  throw new Error('TODO(E2): validateDeck');
}
