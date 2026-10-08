// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { exportPaths, parseExportArgs } from './export-lib.mjs';

describe('export CLI', () => {
  it('documents its supported invocation without invoking a build', () => {
    const output = execFileSync(process.execPath, ['tools/export.mjs', '--help'], { encoding: 'utf8' });
    expect(output).toContain('node tools/export.mjs <deckId>');
    expect(output).toContain('--dry-run');
  });

  it('prints the _smoke dry-run path plan without invoking Vite or a renderer', () => {
    const output = execFileSync(process.execPath, ['tools/export.mjs', '_smoke', '--fps', '15', '--dry-run'], {
      encoding: 'utf8',
    });
    const plan = JSON.parse(output);
    expect(plan.out).toMatch(/out\/export\/_smoke\.mp4$/);
    expect(plan.path.duration).toBeGreaterThan(0);
  }, 20_000);

  it('parses an internal deck ID and resolves its isolated output paths', () => {
    expect(parseExportArgs(['_smoke', '--fps', '15', '--dry-run'])).toMatchObject({ deckId: '_smoke', fps: 15, dryRun: true });
    expect(exportPaths('/workspace', '_smoke')).toEqual({
      deckFile: '/workspace/decks/_smoke/deck.yaml',
      buildDir: '/workspace/out/export/_smoke',
      out: '/workspace/out/export/_smoke.mp4',
    });
  });
});
