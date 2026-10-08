/**
 * move family 'media'(CONTRACTS C5·C16). 메인 소유: W3 잡이 move를 병합할 때 메인이 import 한 줄 + 배열 항목 하나를 추가한다.
 * 규칙: default export = MoveDef 배열, id 알파벳 순, 이 폴더 밖 import 금지(./<id>.js만). 목록 정본 = plan/MOVES.md §3.
 */
import intoWord from './into-word.js';
import maskWordIn from './mask-word-in.js';
import textMaskDive from './text-mask-dive.js';
import windowOpen from './window-open.js';
import windowTakeover from './window-takeover.js';
import wordDoor from './word-door.js';

export default [intoWord, maskWordIn, textMaskDive, windowOpen, windowTakeover, wordDoor];
