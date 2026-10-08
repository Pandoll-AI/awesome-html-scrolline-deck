// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('capture CLI', () => {
  it('documents stop and named capture options without invoking a renderer', () => {
    const output = execFileSync(process.execPath, ['tools/capture.mjs', '--help'], { encoding: 'utf8' });
    expect(output).toContain('node tools/capture.mjs <deckId>');
    expect(output).toContain('--stops');
    expect(output).toContain('--at');
  });
});
