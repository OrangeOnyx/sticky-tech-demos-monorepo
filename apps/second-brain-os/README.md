# Second Brain OS

Single-user playground for a Karpathy-style AI second brain: a small markdown vault, a live wiki graph, and mock ingest that files a new page **without API keys**.

Inspired by [undefined-ui/second-brain-os](https://github.com/undefined-ui/second-brain-os) (MIT) and [Andrej Karpathy's llm-wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). This folder is a sticky demo of the *artifact* (linked wiki pages), not a port of the 18 skills / 72 commands.

```bash
cd apps/second-brain-os
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). `bunfig.toml` sets `minimumReleaseAge = 259200`.

## What you get

1. **Sample vault** in `public/vault/` — ≥8 markdown pages (`index`, `log`, sources, concepts, entities, synthesis) with `[[wikilinks]]`.
2. **Wiki graph** — nodes are pages, edges are resolved wikilinks. Click a node to open the preview. Wikilinks in the preview jump to the target page.
3. **Mock ingest** — paste or drop a short raw source (or use a sample chip). A deterministic fixture LLM step files a new wiki page, appends `log` / `index`, and the graph grows. No Claude, Obsidian, or MCP.

Keyword routes: `RAG` → source arguing against the wiki; `Obsidian` → source about the graph view; `Zettelkasten` / `atomic note` → concept page; anything else → generic source.

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Vite on port 5173 (`--host`) |
| `bun run build` | Production client build |
| `bun test` | Wikilink parse, graph edges, fixture ingest |
| `bun run lint` | oxlint |

## Credits

| Source | Role |
| --- | --- |
| [undefined-ui/second-brain-os](https://github.com/undefined-ui/second-brain-os) | Vault layout (`raw/` vs `wiki/`), page types, MIT license |
| [Karpathy llm-wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | Compounding wiki vs re-retrieval |
| [react-force-graph-2d](https://github.com/vasturiano/react-force-graph) | Force-directed canvas graph |
| shadcn/ui (radix-nova) | Minimal chrome |

## Out of scope

Live LLM ingest, Obsidian sync, the upstream skill/command pack, multi-vault switching.
