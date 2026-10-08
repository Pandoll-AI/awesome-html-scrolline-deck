/**
 * @stub W2-E4 구현 대상. 구현 시 이 줄 삭제 + testing.test.js 작성
 * move·beat 테스트 harness(CONTRACTS C17). *.test.js에서만 import(C1 R2).
 * happy-dom은 layout이 없으므로 측정은 rects 옵션 값으로 대체(기본 {x:0,y:0,w:100,h:100}).
 */

/**
 * @param {{ beats: Array<{ id: string, type: string, data: object, place?: import('./types.js').Place }>,
 *           viewport?: Partial<import('./types.js').Viewport>, reduce?: boolean,
 *           rects?: Record<string, import('./types.js').Rect>,
 *           concept?: Partial<import('./types.js').ConceptPack> }} opts
 * @returns {{
 *   stage: import('./types.js').Stage,
 *   beats: Map<string, import('./types.js').BeatInstance>,
 *   runMove: (move: import('./types.js').MoveDef, o: { role: import('./types.js').Role, beat: string, from?: string, params?: object }) =>
 *            { tl: object, ctx: import('./types.js').MoveContext, timing: import('./types.js').MoveTiming },
 *   seek: (t: number) => void,
 *   snapshot: (nodes: Element[], props?: string[]) => object,
 *   destroy: () => void
 * }}
 */
export function createHarness(opts) {
  throw new Error('TODO(E4): createHarness');
}
