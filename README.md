# SUNCOAST: HEATLINE

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/kanbara12/gta6-01-kanbara12-v16/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/kanbara12/gta6-01-kanbara12-v16/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

A GTA-style open-world crime game for make.fun `gta6-01`. Drive the HEATLINE GT
along a beachfront sunset, run cargo for the fixer Rae, sweep an enemy yard on
foot, and lose a 3-star heat while the SKY-1 helicopter watches from above.

## Play

Serve the game locally and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no install, no network: Three.js r160 is vendored under
`game/vendor/`, and every sound is synthesized live with WebAudio.

## Controls

- **WASD / arrows** — drive (on foot in job 4: walk)
- **E** — interact / pick up / deliver
- **F** — shoot (on foot)
- **H** — hide / show the HUD
- **M** — mute
- **R** — restart the current job

## The 8 jobs — $22,450 total

| # | Job | Pay | Total after |
|---|-----|-----|-------------|
| 1 | Beachfront Pickup | $1,250 | $1,250 |
| 2 | Sunset Run | $2,500 | $3,750 |
| 3 | Palms Courier | $2,300 | $6,050 |
| 4 | Yard Sweep (on foot) | $3,500 | $9,550 |
| 5 | Heatline Escape (3★) | $3,650 | $13,200 |
| 6 | Rae's Return | $3,200 | $16,400 |
| 7 | Night Market | $2,950 | $19,350 |
| 8 | Heatline Finale (3★) | $3,100 | $22,450 |

Drifting pays a live **+$50 per drift**. REP rises by 1 per finished job.

## World

- Coastline, beach and a living ocean (animated swell) west of Ocean Ave
- Waterfront district with lit windows, palm rows, a ferris wheel and a
  hotel pool deck
- Pedestrian NPCs strolling the sidewalks; Rae, Sable and Marlo as named characters
- Police cruisers that pursue with collision avoidance, plus the SKY-1
  helicopter (spinning rotor, spotlight cone) at wanted level 1+
- Screenshot mode: `?shot=start|play|chase|mission&seed=1` stages one
  genuine gameplay frame per shot; `?hud=0` hides the HUD

## Technical source outline

- `game/src/main.js` — bootstrap, game loop, chase camera, `window.__game` test API
- `game/src/config.js` — tuning and the 8-job payout table
- `game/src/world.js` — ocean, beach, roads, district, palms, ferris wheel, pool deck
- `game/src/vehicle.js` — HEATLINE GT mesh, arcade driving, drift detection
- `game/src/npcs.js` — pedestrians, named characters, yard enemies with health bars
- `game/src/police.js` — pursuit cruisers with avoidance, SKY-1 helicopter
- `game/src/missions.js` — 8-job state machine, on-foot combat, payouts, REP
- `game/src/audio.js` — original WebAudio synth: engine, siren, gunshot, chimes
- `game/src/hud.js` — money, job, REP, wanted stars, speed, police panel
- `game/src/shots.js` — deterministic screenshot presets
- `game/src/input.js` — keyboard input; `game/src/random.js` — seeded RNG
- `game/vendor/three.module.js` — Three.js r160, vendored locally
- `main.ts` — entry program: copies `game/` + `screenshots/`, writes `dossier.json`

## License

MIT — see `LICENSE`.
