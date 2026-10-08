/**
 * move registry(CONTRACTS C16, 메인 소유). W3에서 family index를 여기에 묶는다:
 *   import reveal from './reveal/index.js';  … createRegistry([...reveal, ...])
 */
import { createRegistry } from '../engine/index.js';

export default createRegistry([]);
