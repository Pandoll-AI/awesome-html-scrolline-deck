#!/usr/bin/env node
/**
 * npm run check = check-deps + check-tests + check-state (+ --hat <range>면 check-hat).
 * 하나라도 실패하면 exit 1. W3에서 check-moves, W5에서 check-diversity가 여기에 붙는다.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDeps } from './check-deps.mjs';
import { checkTests } from './check-tests.mjs';
import { checkState } from './check-state.mjs';
import { checkHat } from './check-hat.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let fail = 0;

const deps = checkDeps(root);
for (const x of deps.violations) console.log(`  ${x.rule} ${x.file} '${x.spec}' ${x.message}`);
console.log(`${deps.violations.length ? 'FAIL' : 'ok  '} deps   파일 ${deps.files}, 간선 ${deps.edges}, 위반 ${deps.violations.length}`);
fail += deps.violations.length;

const tests = checkTests(root);
for (const m of tests.missing) console.log(`  테스트 없음: ${m}`);
console.log(`${tests.missing.length ? 'FAIL' : 'ok  '} tests  모듈 ${tests.checked}, 스텁 ${tests.stubs.length}, 누락 ${tests.missing.length}`);
fail += tests.missing.length;

const state = checkState(root);
for (const m of [...state.board, ...state.runs]) console.log(`  ${m}`);
console.log(`${state.board.length + state.runs.length ? 'FAIL' : 'ok  '} state  board 오류 ${state.board.length}, runs ${state.runLines}줄 오류 ${state.runs.length}`);
fail += state.board.length + state.runs.length;

const hatAt = args.indexOf('--hat');
if (hatAt >= 0) {
  const hat = checkHat(root, args[hatAt + 1]);
  for (const x of hat) console.log(`  ${x.commit.slice(0, 8)} ${x.message}`);
  console.log(`${hat.length ? 'FAIL' : 'ok  '} hat    위반 ${hat.length}`);
  fail += hat.length;
}

process.exit(fail ? 1 : 0);
