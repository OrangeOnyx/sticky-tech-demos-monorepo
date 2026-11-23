# PLAN — atlas-rig-lab

## Goal
Drop a character image and watch it come back as a rigged, animated GLB in a three.js viewer (idle / walk / run, skeleton toggle, orbit). Sample mode works with no key.

> **Which Atlas?** This app uses **Atlas AI Studio** by Atlas (https://atlas.design, docs at https://docs.atlas.design), a node-based 3D / game-asset workflow platform. It has **nothing to do with Orange Ocean Atlas / On The Boulevard (OTB)**. Don't import OTB code, keys, naming, or data. In code, env vars, and copy, always write "Atlas AI Studio" in full or prefix with `ATLAS_STUDIO_`.

## Single-user MVP
- Vite + React + TypeScript under `apps/atlas-rig-lab/` only, in the existing `sticky-tech-demos-monorepo`
- One screen:
  - Left panel: image drop zone (PNG/JPEG/WebP, ≤10 MB, preview thumbnail), mode toggle **Sample** (default) / **Live**, Generate button, status line (uploading → queued → running → downloading → ready / error, with elapsed seconds)
  - Right panel: three.js canvas with OrbitControls, ground grid, hemisphere + directional light, auto-framing to the model's bounding box
  - Controls under the canvas: clip buttons **Idle / Walk / Run** (crossfade 0.3 s), a dropdown with every other clip in the file, a **Skeleton** toggle (`SkeletonHelper`), play/pause, and a **Download GLB** link
- **Sample mode** (no env, no network): ignores the image content (the dropped image is still shown so the flow looks the same), waits ~1.5 s with fake progress, then loads the bundled `public/samples/RobotExpressive.glb`. `npm install && npm run dev` is enough.
- **Live mode**: a local Node API (sibling pattern: `server/dev.mjs` + `server/index.ts` on 127.0.0.1:3001, Vite proxies `/api`) calls the user's exported **Atlas AI Studio workflow API**. The input is **one image only** (API Input Image → … → Rig Humanoid Mesh → Animate Rigged Model / Animate Tripo Mesh → API Output Mesh). No text prompt input. The key and workflow credentials stay on the server.
- Clip mapping: case-insensitive match of `/idle/`, `/walk/`, `/run/` on `AnimationClip.name`. Buttons with no match are disabled, and every clip is still in the dropdown, because Atlas clip names aren't documented.
- `.env.example`, a README that leads with npm, `package-lock.json`, and `bunfig.toml` (only for the monorepo AGENTS.md rule)

## Explicitly out
- Text-to-3D or any text prompt input to Atlas
- Building or editing the Atlas workflow from this app (the user builds and exports it in Atlas AI Studio; the README documents the node chain)
- Atlas MCP (`mcp.dev.atlas.design`), the Unity/Unreal plugins, multi-image or character-sheet input
- Auth, multi-user, history, persistence, a gallery of past runs
- Sibling apps, root `AGENTS.md`, `tracking/`, a new repository
- Anything Orange Ocean / OTB
- Bun as a requirement (Adam has no Bun; npm is the path)

## Outcome-oriented tasks
1. **Plan + scaffold.** Commit this PLAN.md. Scaffold with `npm create vite@latest atlas-rig-lab -- --template react-ts`. Add `bunfig.toml` (`[install] minimumReleaseAge = 259200`) before installing. Run `npx shadcn@latest init` with a minimalist preset (match typesafe-jev: radix-nova, neutral, Geist). Run `npm install`. Copy the sibling `.gitignore` and `.oxlintrc.json`.
2. **Sample viewer runs end to end.** Bundle `RobotExpressive.glb` and its license note. The `<RigViewer glbUrl>` component loads it with GLTFLoader, plays Idle, switches between Idle/Walk/Run, toggles the skeleton, orbits, and disposes cleanly on unmount or URL change.
3. **Drop → Generate flow (sample).** Add the drop zone, validation, the status state machine, and the fake progress, then hand `/samples/RobotExpressive.glb` to the viewer.
4. **Live Atlas proxy.** `POST /api/generate` (multipart image) does: upload → `file_id`, execute async → `execution_id`, then returns `{ executionId }`. `GET /api/status/:id` proxies the status. `GET /api/result/:id` streams the GLB bytes back, so the browser never sees a key or a signed URL. The client polls every 3 s with a 5 min timeout. Any error or timeout shows a readable message and a "Try sample" button.
5. **Tests.** Node `--test` for: clip-name matching, the status-response normalizer (fixtures in `shared/fixtures/atlas-*.json`), and request building (the multipart upload and the execute body use the input key from env and send no text field). No network calls in tests.
6. **README + `.env.example` + PR.** README: npm quickstart, Sample vs Live table, how to export the workflow in Atlas AI Studio (API Input Image → rig → animate → API Output Mesh → Export API → copy the base URL / version / API ID / auth from the generated JSON), the GLB credit, and the "not OTB" note. Open one PR with at least one screenshot (sample model mid-walk, skeleton on) and one short video (10–30 s: drop image → Generate → Idle → Walk → Run → skeleton toggle → orbit).

## Stack
- **Vite + React + TypeScript (npm)**: same shape and scripts as typesafe-jev / claude-motion-explainer, and it runs without Bun
- **shadcn/ui (minimalist preset)**: the monorepo UI default. Add only button, card, toggle-group, switch, select, badge, and progress
- **Plain `three` (+ `@types/three`), not @react-three/fiber**: one imperative canvas (GLTFLoader, AnimationMixer, SkeletonHelper, OrbitControls from `three/examples/jsm`) inside one `useEffect`, with no R3F/drei version coupling to React 19. The tradeoff is manual lifecycle and disposal code, about 150 lines, instead of R3F's declarative scene graph. That's fine for one fixed viewer.
- **Node `http` server + Vite proxy (`server/dev.mjs` launcher)**: the copied sibling pattern. It keeps `ATLAS_STUDIO_API_KEY` server-side and needs no extra dependencies (Node 22 `fetch`, `FormData`, `Blob`)
- **oxlint + Node test runner**: same as the siblings, with no Jest/Vitest
- **Bundled sample: three.js `RobotExpressive.glb` (CC0 1.0)**: ~464 KB, 14 clips including `Idle`, `Walking`, `Running`, skinned (2 skins)
  - Source: https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb
  - License: CC0 1.0. Model by Tomás Laulhé (Quaternius); modifications by Don McCurdy. See https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/RobotExpressive/README.md. Copy that README into `public/samples/LICENSE-RobotExpressive.md`.
  - It's a humanoid robot, not a human. It was chosen because it's truly CC0 and ships idle/walk/run. The Khronos `Fox.glb` has CC-BY rigging and isn't humanoid. The Mixamo-based `Soldier.glb` / `Xbot.glb` have unclear redistribution terms.

## Atlas AI Studio Live mode (from docs.atlas.design, 2026-10-29)
- An exported workflow is **async-only**. Upload the image with `multipart/form-data` to `POST {baseUrl}/{version}/upload/{apiId}` and get back a `file_id`. Then `POST {baseUrl}/{version}/api_execute_async/{apiId}` with a JSON body that references that `file_id` under the workflow's API Input Image key, and get back an `execution_id`. Poll `GET {baseUrl}/{version}/api_status/{execution_id}` until it completes. Then download the API Output Mesh (GLB) through the authenticated result-download endpoint.
- The docs **don't publish** the literal base URL, the auth header syntax, the input key name, the status field names, or the download route. Atlas AI Studio generates all of them per export (Bash example, Python example, full API JSON spec, API ID). The cloud agent must read these from Adam's export rather than guess. Those values go in env. The status normalizer must be tolerant (look for a state/status string and an output URL or file id) and must be tested against fixtures copied from the real spec.
- Expect 30–60 s or more for 3D generation plus rigging. Each run spends workspace credits.
- Treat the exported workflow JSON as a credential (the docs say it embeds the auth). Gitignore it.

## Live-mode env (`.env.example`)
```bash
# Server-side only. Leave ATLAS_STUDIO_API_KEY empty to stay in Sample mode.
# Atlas AI Studio (docs.atlas.design), NOT Orange Ocean Atlas / OTB.
# Copy to .env in this folder. Never commit real values. No VITE_ prefix.
ATLAS_STUDIO_API_KEY=
# From the "Export API" output of your image -> rigged GLB workflow:
ATLAS_STUDIO_BASE_URL=
ATLAS_STUDIO_API_VERSION=
ATLAS_STUDIO_API_ID=
# Header used by the generated Bash/Python example (default shown)
ATLAS_STUDIO_AUTH_HEADER=Authorization
ATLAS_STUDIO_AUTH_SCHEME=Bearer
# Name of the API Input Image parameter in the exported spec
ATLAS_STUDIO_IMAGE_INPUT_KEY=image
# Optional: poll interval / overall timeout
ATLAS_STUDIO_POLL_MS=3000
ATLAS_STUDIO_TIMEOUT_MS=300000
```

## Deferred
- **Calling Live in CI or for the PR video**: there's no key in the repo, and each run costs credits. Sample mode is the required demo path. Record Live mode only if Adam provides a key.
- **R3F/drei, post-processing, or an environment HDRI**: not needed for one viewer. Revisit if the scene grows.
- **Text-to-3D, multi-view, or character-sheet input**: out of the image-only brief
- **Hosting on Cloudflare Pages**: the monorepo prefers it, but Live mode needs a server and a secret. Ship local first.
- **Atlas MCP or the Unity/Unreal plugins**: not needed for a REST demo
- **Caching or history of generated GLBs**: one user, one session

## Acceptance
- From `apps/atlas-rig-lab/` with no `.env`, `npm install && npm run dev` opens http://127.0.0.1:5173. Dropping any image and pressing Generate in Sample mode shows the robot playing Idle within ~2 s.
- Idle / Walk / Run switch the visible animation with a crossfade. The Skeleton toggle shows and hides the bones. Drag orbits, scroll zooms. Download GLB saves the file.
- Live mode with all `ATLAS_STUDIO_*` vars set uploads only the image, polls, and renders the returned GLB. Missing env produces a clear "Live mode needs ATLAS_STUDIO_* in .env" message and never crashes. The key never appears in browser network payloads or the client bundle (`grep -r atk_ dist/` is empty).
- `npm test`, `npm run lint`, and `npm run build` pass.
- `package-lock.json` and `bunfig.toml` are committed. Nothing outside `apps/atlas-rig-lab/` changes.
- The PR includes **at least one screenshot** (viewer with the sample mid-walk, skeleton on) **and one short video** (10–30 s: drop → Generate → Idle → Walk → Run → skeleton → orbit).
- README and UI copy say "Atlas AI Studio" and include the not-OTB note.
