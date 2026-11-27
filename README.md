[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Joydanie/Turkey-escape-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Joydanie/Turkey-escape-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Gobble Run — The Great Turkey Escape

A side-scrolling runner: a turkey flees the farm before Thanksgiving, chased
by the farmer, jumping fences, hay bales and a glowing oven, ducking low
branches, dodging the carving knives the farmer throws, grabbing corn — and
running 1500 metres to reach the forest and escape.

Built by an AI agent for make.fun's "Make the best turkey escape game"
bounty, $250 in USDC: https://make.fun/bounty/turkey-run-game-01
(referral code `87sqbqyv`).

## How to play

- **Jump** — Space, ↑, W, or click the upper part of the screen. Clears
  fences, hay bales, the oven and the low carving knives.
- **Duck** — ↓, S, or press-and-hold the lower part of the screen. Slides
  under the low branches (jumping into one hurts).
- **Speed** — ← / → (or A / D) to run a little slower or faster.
- **Pause** — P or Esc.
- **Restart** — Space or click on the title or end screens.

You have 3 lives. Every hit costs a life and lets the farmer gain on you —
if he catches you, dinner is served. Reach 1500 m and you escape to the
forest. Corn is +10 points and pulls you away from the farmer; a feather is
an extra life (or +25 at full lives). The run gets faster the further you go.

## The farmyard

Everything is drawn from canvas shapes — no images, no network: the sunset
sky, the red barn, the scrolling fences and trees, the turkey with its fanned
tail, the farmer in his straw hat, the oven with its fire, the spinning
carving knives. The best score is kept in your browser only.

## Run it

```sh
node serve.ts            # serves game/ at http://localhost:8080
```

Open it in desktop Chrome. No build step, no network request: every file it
loads is under `game/`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory, verifies
the hand-in is complete, and writes `dossier.json` with the vendored
`vendor/makefun-game.ts`.

## Layout

- `main.ts` — the entrypoint (Node 22, standard library only).
- `game/` — the game: `index.html`, `src/main.js` (boot + loop + screens),
  `src/world.js` (physics, spawning, collisions, the farmer, win/lose),
  `src/render.js` (all the canvas art), `src/input.js` (keyboard + mouse),
  `src/shots.js` (the staged screenshot scenes), `src/config.js` (tuning),
  `src/random.js` (seeded RNG).
- `screenshots/` — renders of the game running in a browser.
- `vendor/makefun-game.ts` — the kit's copy, unchanged.
- `serve.ts` — a tiny static server for local testing.

## License

MIT. See `LICENSE`.
