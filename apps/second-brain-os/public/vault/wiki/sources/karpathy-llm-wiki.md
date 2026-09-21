---
title: Karpathy llm-wiki gist
type: source
created: 2026-04-04
updated: 2026-09-21
---

# Karpathy llm-wiki gist

Source: [Andrej Karpathy, "llm-wiki"](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) (4 Apr 2026). This playground page is a short original summary, not a copy of the gist.

[[andrej-karpathy]] argues that a personal knowledge base should not be a pile of notes the model re-reads from scratch. Raw material stays in `raw/`. The model writes and maintains `wiki/` in its own words, with [[wikilinks]] between pages.

The claim this source actually makes: **compounding beats retrieval**. If something matters, it has to land on a wiki page. Search is a fallback, not the product.

Touches [[llm-wiki]], [[raw-vs-wiki]], [[compounding-wiki]], and the later contrast in [[retrieval-vs-maintenance]].
