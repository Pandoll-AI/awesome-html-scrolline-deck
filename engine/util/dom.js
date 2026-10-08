/**
 * @stub W2-E1 구현 대상. 구현 시 이 줄 삭제 + dom.test.js 작성
 * 작은 DOM 도우미(CONTRACTS C4). J조 scroll-v2 core/dom.js·type.js 계승.
 */

/**
 * @param {string} tag
 * @param {string|null} [cls]
 * @param {Element|null} [parent]
 * @param {string|null} [text]
 * @returns {HTMLElement}
 */
export function el(tag, cls, parent, text) {
  throw new Error('TODO(E1): el');
}

/**
 * 어절 단위(공백 분리) span.sl-word[data-part="word"]를 parent에 붙이고 목록 반환. 어절 사이 공백은 텍스트 노드.
 * @param {Element} parent
 * @param {string} text
 * @returns {HTMLElement[]}
 */
export function words(parent, text) {
  throw new Error('TODO(E1): words');
}

/**
 * 글자 단위 span.sl-char[data-part="char"]. '\n'은 <br>. 공백도 글자 1개로 센다.
 * @param {Element} parent
 * @param {string} text
 * @returns {HTMLElement[]}
 */
export function chars(parent, text) {
  throw new Error('TODO(E1): chars');
}
