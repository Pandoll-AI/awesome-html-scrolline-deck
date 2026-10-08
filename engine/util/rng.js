/**
 * @stub W2-E1 구현 대상. 구현 시 이 줄 삭제 + rng.test.js 작성
 * seeded RNG(CONTRACTS C5 ctx.rng). Math.random 금지 규칙의 대체.
 */

/**
 * 문자열 → 32bit 정수 seed(FNV-1a 32).
 * @param {string} s
 * @returns {number}
 */
export function hashSeed(s) {
  throw new Error('TODO(E1): hashSeed');
}

/**
 * mulberry32. 같은 seed → 같은 수열, 값은 [0, 1).
 * @param {number|string} seed  문자열이면 hashSeed
 * @returns {() => number}
 */
export function createRng(seed) {
  throw new Error('TODO(E1): createRng');
}
