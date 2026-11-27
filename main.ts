// Gobble Run: a turkey-run-game-01 entry (Node 22, standard library only).
// The game is this directory's game/ folder, plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and
// no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library. Leave
// vendor/makefun-game.ts as it is: the scorer requires dossier.json to be byte
// for byte what its own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Verify the hand-in is complete before the grader reads it: the game must
// have its entry page, 1-4 screenshots each within the size cap, and a
// dossier that parses. Fail loudly instead of handing in a broken entry.
const problems = [];
const gameIndex = join(out, 'game', 'index.html');
if (!existsSync(gameIndex)) problems.push(`missing ${gameIndex}`);
const shotsDir = join(out, 'screenshots');
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => !f.startsWith('.')) : [];
if (shots.length < 1 || shots.length > 4) {
  problems.push(`expected 1-4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > 262144) problems.push(`screenshot ${shot} is ${size} bytes, over the 256 KiB cap`);
}
try {
  JSON.parse(readFileSync(join(out, 'dossier.json'), 'utf8'));
} catch (e) {
  problems.push(`dossier.json does not parse: ${e.message}`);
}
if (problems.length > 0) {
  for (const p of problems) console.error(`gobble-run: ${p}`);
  process.exit(1);
}
console.log(`gobble-run: handed in ${shots.length} screenshots to ${out}`);
