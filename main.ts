// SUNCOAST: HEATLINE — make.fun gta6-01 entry program (Node 22, standard library only).
// Copies game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored make.fun
// library. Run it with MAKEFUN_OUTPUT_DIR set outside the grader's container:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Pre-flight: the scorer refuses an entry whose screenshots break its caps,
// so refuse here first, loudly, naming the file. Screenshots must be 3 or 4
// JPEG/PNG images, each at most 256 KiB.
const shotsDir = join(here, 'screenshots');
const shots = readdirSync(shotsDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots: expected 3 or 4 images, found ${shots.length}`);
}
for (const shot of shots) {
  const shotPath = join(shotsDir, shot);
  const size = statSync(shotPath).size;
  if (size > 262144) throw new Error(`screenshots: ${shot} is ${size} bytes, over the 262144 cap`);
  const head = readFileSync(shotPath).subarray(0, 4);
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if (!isJpeg && !isPng) throw new Error(`screenshots: ${shot} is neither JPEG nor PNG`);
}
console.error(`SUNCOAST: HEATLINE — ${shots.length} screenshots OK (${shots.join(', ')})`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
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
console.error(`SUNCOAST: HEATLINE — dossier.json written (${statSync(join(out, 'dossier.json')).size} bytes)`);
