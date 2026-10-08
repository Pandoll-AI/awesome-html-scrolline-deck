#!/usr/bin/env node
/** Capture export-path stop centers and optional in-between frames with HyperFrames. */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { exportPath } from '../engine/export.js';
import { plan } from '../engine/timeline.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const usage = 'node tools/capture.mjs <deckId> [--stops] [--at s1,s2]';
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' });
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

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || !args.length) return console.log(usage);
  const deckId = args[0];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(deckId)) throw new Error(`invalid deck id: ${deckId}`);
  const deckFile = path.join(ROOT, 'decks', deckId, 'deck.yaml');
  if (!existsSync(deckFile)) throw new Error(`deck not found: ${deckId}`);
  const deck = YAML.parse(readFileSync(deckFile, 'utf8'));
  const [{ default: moves }, { default: concept }] = await Promise.all([
    import('../moves/index.js'),
    import(`../concepts/${deck.concept}/index.js`),
  ]);
  const map = plan(deck, { registry: moves, concept });
  const pathInfo = exportPath(map, deck.export, holdsFor(deck, map));
  const atIndex = args.indexOf('--at');
  const requested = atIndex < 0 ? [] : args[atIndex + 1].split(',').filter(Boolean);
  const names =
    args.includes('--stops') || requested.length === 0 ? map.stops.map((stop) => stop.name) : requested;
  const unknown = names.filter((name) => !(name in pathInfo.stopAt));
  if (unknown.length) throw new Error(`unknown stop(s): ${unknown.join(', ')}`);
  const shots = names.map((stop) => ({ stop, t: pathInfo.stopAt[stop] }));
  if (args.includes('--stops'))
    for (let index = 1; index < shots.length; index += 1)
      shots.push({ stop: null, t: (shots[index - 1].t + shots[index].t) / 2 });
  shots.sort((a, b) => a.t - b.t);
  const output = path.join(ROOT, 'out', 'capture', deckId);
  mkdirSync(output, { recursive: true });
  run(process.execPath, [path.join(ROOT, 'tools', 'export.mjs'), deckId]);
  const project = path.join(ROOT, 'out', 'export', deckId);
  const manifest = [];
  for (const shot of shots) {
    const before = new Set(readdirSync(output));
    run('npx', ['hyperframes', 'snapshot', project, '--at', String(shot.t), '--no-end', '--output', output]);
    const file = readdirSync(output).find((name) => name.endsWith('.png') && !before.has(name));
    if (!file) throw new Error(`snapshot did not produce a PNG at ${shot.t}s`);
    manifest.push({ file, t: shot.t, stop: shot.stop });
  }
  writeFileSync(
    path.join(output, 'manifest.json'),
    `${JSON.stringify({ deck: deckId, shots: manifest }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(`capture: ${error.message}`);
  process.exitCode = 2;
});
