# Atlas Rig Lab

Drop a character image and watch a rigged, animated GLB in a three.js viewer. Idle, walk, and run crossfade. A skeleton toggle and orbit controls sit on the same screen.

This app uses **Atlas AI Studio** (https://atlas.design, docs at https://docs.atlas.design). It is not Orange Ocean Atlas / On The Boulevard (OTB). Nothing in this folder imports OTB code, keys, naming, or data.

```bash
cd apps/atlas-rig-lab
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Sample mode is the default. It needs no `.env` and no API key. Node 22 or newer is required because `npm run dev` starts a small API with Node's TypeScript stripper. Bun is optional.

## Sample vs Live

| Mode | When | What happens |
| --- | --- | --- |
| **Sample** | Default. Works with no `.env`. | The dropped image is previewed and then ignored. After about 1.5 seconds the viewer loads `public/samples/RobotExpressive.glb`. |
| **Live** | Every `ATLAS_STUDIO_*` value in `.env.example` is set, then the dev process is restarted. | The local API uploads that one image to your exported Atlas AI Studio workflow, polls until the mesh is ready, and streams the GLB back. The browser never sees the key or the download URL. |

There is no key in this repo. Leave Live unchecked unless you have exported a workflow. Sample mode is the demo path. Each live run spends Atlas AI Studio workspace credits and often takes 30–60 seconds or longer.

## Enable live mode

Build the workflow in Atlas AI Studio, then export it. This app does not edit the graph.

1. Start with **API Input Image** (one image, no text prompt).
2. Generate a mesh, then rig and animate it. A typical chain is image → mesh → **Rig Humanoid Mesh** → **Animate Rigged Model** or **Animate Tripo Mesh**.
3. Connect the animated mesh to **API Output Mesh**.
4. Click **Export API**. Atlas AI Studio gives you a Bash example, a Python example, a JSON spec, and an API ID. The JSON embeds auth. Do not commit it.
5. Copy `.env.example` to `.env` in this folder.
6. Fill `ATLAS_STUDIO_BASE_URL`, `ATLAS_STUDIO_API_VERSION`, `ATLAS_STUDIO_API_ID`, `ATLAS_STUDIO_API_KEY`, the auth header and scheme, and `ATLAS_STUDIO_IMAGE_INPUT_KEY` from that export. Do not prefix them with `VITE_`.
7. Set `ATLAS_STUDIO_RESULT_PATH` to the download route in the Bash example. The docs do not publish that path. Placeholders are `{base}`, `{version}`, `{api_id}`, `{execution_id}`, and `{file_id}`.
8. Restart `npm run dev`, switch the toggle to **Live**, and press **Generate**.

The local API listens on `127.0.0.1:3001`. Vite proxies `/api` so the page stays on port 5173. Routes:

- `POST /api/generate` uploads the image (`multipart` field `file` by default, overridable) and calls `api_execute_async`. The JSON body is only the image file id.
- `GET /api/status/:id` polls `api_status` and returns a phase. File ids and URLs stay on the server.
- `GET /api/result/:id` downloads the GLB with the server key and streams the bytes.

Missing env returns `Live mode needs ATLAS_STUDIO_* in .env` and does not call Atlas.

Clip buttons match `/idle/`, `/walk/`, and `/run/` on the clip name, case-insensitive. Unmatched buttons are disabled. Every other clip is in the dropdown, because Atlas clip names are not a fixed list.

## Sample GLB

`public/samples/RobotExpressive.glb` is from the three.js examples. CC0 1.0. Model by Tomás Laulhé (Quaternius); modifications by Don McCurdy. The license note is `public/samples/LICENSE-RobotExpressive.md`. It is a humanoid robot with Idle, Walking, and Running, chosen because those clips are CC0. It is not a generated human.

## Bun

The monorepo convention is Bun. This app includes `bunfig.toml` with `minimumReleaseAge = 259200`. If Bun is installed:

```bash
bun install
bun run dev
```

`bun run dev` still launches the Node API and Vite. npm is the path to use when Bun is not installed. `package-lock.json` is committed for that.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite on http://127.0.0.1:5173 plus the Atlas proxy |
| `npm test` | Clip matching, status fixtures, and request building. No network. |
| `npm run build` | Typecheck and production client build |
| `npm run lint` | oxlint |

## Stack

Vite + React + TypeScript, shadcn/ui (radix-nova, neutral), Tailwind v4, plain `three` (GLTFLoader, AnimationMixer, SkeletonHelper, OrbitControls), and a Node HTTP server. No `@react-three/fiber`.
