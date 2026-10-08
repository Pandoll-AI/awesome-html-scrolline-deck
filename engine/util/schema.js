/**
 * @stub W2-E1 구현 대상. 구현 시 이 줄 삭제 + schema.test.js 작성
 * move params·beat fields 공통 schema(CONTRACTS C9).
 */

export class SchemaError extends Error {
  /** @param {import('../types.js').SchemaIssue[]} issues */
  constructor(issues) {
    super(issues.map((i) => `${i.path}: ${i.message}`).join('\n'));
    this.name = 'SchemaError';
    this.issues = issues;
  }
}

/**
 * value를 schema로 검사. 문제 목록 반환(없으면 []).
 * @param {import('../types.js').FieldSchema} schema
 * @param {Record<string, any>} value
 * @param {string} [path]
 * @returns {import('../types.js').SchemaIssue[]}
 */
export function validateSchema(schema, value, path = '') {
  throw new Error('TODO(E1): validateSchema');
}

/**
 * 기본값을 채운 새 객체 반환. 모르는 키·범위 위반·필수 누락이면 SchemaError.
 * @param {import('../types.js').FieldSchema} schema
 * @param {Record<string, any>} [given]
 * @returns {Record<string, any>}
 */
export function resolveParams(schema, given = {}) {
  throw new Error('TODO(E1): resolveParams');
}
