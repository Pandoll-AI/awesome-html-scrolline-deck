#!/usr/bin/env node
/** Build one deck's fixed-size HyperFrames composition and render it to MP4. */
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { exportPath } from '../engine/export.js';
import { plan } from '../engine/timeline.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const usage = 'node tools/export.mjs <deckId> [--fps 30] [--out out/export/<deckId>.mp4] [--dry-run]';
const option = (args, name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { cwd: ROOT, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}`);
};
const holdsFor = (deck, map) =>
  Object.fromEntries(
    map.stops
      .map((stop) => {
        const beat = deck.beats.find((item) => item.id === stop.beat);
        return [stop.name, beat?.exportHold];
      })
      .filter(([, hold]) => Number.isFinite(hold)),
  );

function setCompositionRoot(file, duration) {
  const html = readFileSync(file, 'utf8');
  const root = `<div id="scrolline-root" data-composition-id="scrolline" data-width="1920" data-height="1080" data-duration="${duration}">`;
  const replaced = html.replace('<div id="app"></div>', `${root}<div id="app"></div></div>`);
  if (replaced === html) throw new Error('export HTML must contain <div id="app"></div>');
  writeFileSync(file, replaced);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || !args.length) return console.log(usage);
  const deckId = args[0];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(deckId)) throw new Error(`invalid deck id: ${deckId}`);
  const fps = Number(option(args, '--fps', '30'));
  if (!Number.isInteger(fps) || fps <= 0) throw new Error('--fps must be a positive integer');
  const deckFile = path.join(ROOT, 'decks', deckId, 'deck.yaml');
  if (!existsSync(deckFile)) throw new Error(`deck not found: ${deckId}`);
  const deck = YAML.parse(readFileSync(deckFile, 'utf8'));
  const [{ default: moves }, { default: concept }] = await Promise.all([
    import('../moves/index.js'),
    import(`../concepts/${deck.concept}/index.js`),
  ]);
  const map = plan(deck, { registry: moves, concept });
  const pathInfo = exportPath(map, deck.export, holdsFor(deck, map));
  const out = path.resolve(ROOT, option(args, '--out', `out/export/${deckId}.mp4`));
  const buildDir = path.join(ROOT, 'out', 'export', deckId);
  const report = { deck: deckId, fps, out, buildDir, map, path: pathInfo };
  if (args.includes('--dry-run')) return console.log(JSON.stringify(report, null, 2));
  run('npx', ['vite', 'build'], {
    ...process.env,
    SCROLLINE_MODE: 'export',
    SCROLLINE_DECK: deckId,
    SCROLLINE_OUT: buildDir,
  });
  const html = readdirSync(buildDir, { withFileTypes: true }).find(
    (entry) => entry.isFile() && entry.name.endsWith('.html'),
  );
  if (!html) throw new Error(`Vite build produced no HTML in ${buildDir}`);
  const source = path.join(buildDir, html.name);
  const entry = path.join(buildDir, 'index.html');
  if (source !== entry) renameSync(source, entry);
  setCompositionRoot(entry, pathInfo.duration);
  run('npx', ['hyperframes', 'lint', buildDir]);
  run('npx', ['hyperframes', 'render', buildDir, '--fps', String(fps), '--output', out]);
  console.log(JSON.stringify({ ...report, entry }, null, 2));
}

main().catch((error) => {
  console.error(`export: ${error.message}`);
  process.exitCode = 2;
});
