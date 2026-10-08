// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('export CLI', () => {
  it('documents its supported invocation without invoking a build', () => {
    const output = execFileSync(process.execPath, ['tools/export.mjs', '--help'], { encoding: 'utf8' });
    expect(output).toContain('node tools/export.mjs <deckId>');
    expect(output).toContain('--dry-run');
  });
});
