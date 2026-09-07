# NEXUS — 3D Tic Tac Toe

[Play in your browser](https://shaightro.github.io/tictactoe/)

A standalone, Korean-language tic-tac-toe arena with a floating 3D board, neon X/O pieces, bloom, orbit rings, particle bursts, impact motion, and a victory beam. Independent of Kiwi Slitherlink.

## Play

- Face three AI levels or play with a friend on the same device.
- Choose X (first move) or O (second move). X always starts.
- Expert uses optimal minimax: it cannot lose with normal legal play.
- Undo restores your most recent turn, including the AI response.
- Round scores stay in the current match. Changing match settings resets scores.
- Sound is opt-in. Turn off cinematic effects for reduced movement and lower rendering cost; the system reduced-motion preference is respected.
- Mouse, touch, Tab/Enter, and arrow keys are supported. A basic board is available if WebGL fails.

## Development

Node.js 24 and pnpm 11 are used.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm exec tsc --noEmit
pnpm build:pages
```

GitHub Pages serves the static build from `out/` at `/tictactoe/`. The Pages entry uses the same React game, styles, AI, and Three.js renderer as the local preview. Pushes to `main` run the independent game audit, type checks, build, and Pages deployment. The standard `pnpm build` also retains the original Sites-compatible server build.

## Verification

The independent audit enumerates all 5,478 reachable legal boards, compares exact optimal move sets, checks difficulty policies and reducer transitions, and traverses 40,480 complete expert-versus-human paths across both sides with zero expert losses.

WebMCP hooks expose reading the board, placing a legal move, and starting a round where supported. They are feature-detected; a supported WebMCP validation context was unavailable during creation, so their browser registration/execution was not independently verified. General browser interaction and visual QA were not run.

## Dependencies

Three.js provides the 3D renderer and post-processing; React owns game state and controls. The existing Sites/Vinext scaffold and its UI primitives are retained. No game API, account, analytics, or runtime data service is required. The original Python files were replaced, with their history preserved in Git.
