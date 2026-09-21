# PLAN — second-brain-os

## Goal
Single-user web MVP that demos the Karpathy-style AI second brain from `undefined-ui/second-brain-os`: sample vault → live wiki graph → mock ingest that creates a linked wiki page (fixture mode, no Obsidian/Claude required).

## Single-user MVP
- Load a small embedded vault template (markdown pages with `[[wikilinks]]`) inspired by upstream `vault-template/`
- Interactive wiki graph (nodes = pages, edges = wikilinks); click node → preview panel
- Mock ingest flow: drop/paste a “raw” source → fixture LLM step → new wiki page + updated links (deterministic fixtures, no API key)
- Self-contained under `apps/second-brain-os/`: `bun install && bun run dev`
- README credits `undefined-ui/second-brain-os` (MIT) + Karpathy llm-wiki pattern
- PR must attach **screenshot AND video** of the running app

## Explicitly out of scope
- Real Claude Code / Obsidian / MCP wiring
- Full 18 skills / 72 commands port
- Touching sibling apps, `AGENTS.md`, or tracking unless needed for this slug
- New GitHub repository
- Owning or rewriting Adam’s AI OS vault root (this is a sticky playground only)

## Outcome-oriented tasks
1. Scaffold Vite+React+TS + `bunfig.toml` (`minimumReleaseAge = 259200`) + minimal shadcn chrome
2. Ship sample vault JSON/MD under `public/vault/` (sources + concepts + entities, ≥8 linked pages)
3. Graph view (cytoscape / sigma / force-graph — pick one boring library) + page preview
4. Ingest UI: paste short article → fixture pipeline → new node + edges animate in
5. README + run instructions; PR with screenshot + video

## Stack
- **Bun** — monorepo default
- **Vite + React + TS + shadcn** — one-screen playground
- **Force-directed graph lib** — wiki graph
- **Fixture ingest** — no keys

## Deferred
- Live LLM ingest
- Obsidian sync
- Multi-project vault switcher
