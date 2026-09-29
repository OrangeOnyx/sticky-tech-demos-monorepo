# TypeSafe Jev

Single-user playground for sticky demo triage. Paste a bookmark candidate, hit Judge, and read Approve / Tweak / Skip plus fit and yes/no signals before spending other LLM tokens.

```bash
cd apps/typesafe-jev
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Fixture mode is the default. It needs no API key and no `.env` file.

Node 22 or newer is required (`npm run dev` starts a small API with Node's TypeScript stripper). Bun is optional.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | Default. Works with `TYPESAFE_API_KEY` unset. | `POST /api/judge` returns local answers for the same question ids live mode uses. |
| **Live** | `TYPESAFE_API_KEY` is set in `.env`, then the dev process is restarted. | The server calls `POST https://api.typesafe.ai/v1/systemone` with model `jev-latest`. The browser never sees the key. Latency and token usage show on the verdict card. |

The UI toggle picks the mode per request. A key on the server does not force live calls.

This repo does not ship a key, and CI does not call TypeSafe. Leave live mode unchecked here if you have no key. Fixture mode is the path to demo.

## Enable live mode

1. Copy `.env.example` to `.env` in this folder.
2. Set `TYPESAFE_API_KEY` to your TypeSafe key. Do not prefix it with `VITE_` and do not commit `.env`.
3. Restart `npm run dev`.
4. Switch the toggle to **Live** and press **Judge**.

The local API listens on `127.0.0.1:3001`. Vite proxies `/api` so the page stays on port 5173.

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
| `npm run dev` | Vite on http://127.0.0.1:5173 plus the judge API |
| `npm test` | Fixture judgments and the live request shape (no network key required) |
| `npm run build` | Typecheck and production client build |
| `npm run lint` | oxlint |

## Questions

Both modes use these ids:

| Id | Type | Asks |
| --- | --- | --- |
| `verdict` | choice | `approve`, `tweak`, or `skip` against the sticky filter |
| `sticky_fit` | score | Poor / Partial / Strong sticky MVP fit |
| `needs_api_key` | noul | Does a meaningful demo need a third-party API key? |
| `is_near_miss` | noul | Interesting, but fails the sticky filter? |

Live request body follows [the TypeSafe API](https://docs.typesafe.ai/api.md): `state`, `model`, and `questions` in, `answers` and `usage` out.

## Stack

Vite + React + TypeScript, shadcn/ui (radix-nova), Tailwind v4, a Node HTTP server. `cn` is local (`clsx` + `tailwind-merge`).
