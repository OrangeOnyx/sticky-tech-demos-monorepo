---
title: Retrieval vs maintenance
type: synthesis
created: 2026-09-21
updated: 2026-09-21
---

# Retrieval vs maintenance

[[karpathy-llm-wiki]] and [[second-brain-os]] agree on a split that a lot of "AI memory" products blur.

**Retrieval** (RAG, search over raw) is good when you do not yet know what the corpus is about. It does not accumulate judgment. Tomorrow's query pays the same cost as today's.

**Maintenance** (an [[llm-wiki]]) is the model doing filing work: write the page, link it, note the contradiction, update the [[index]]. That is slower up front and cheaper later — the [[compounding-wiki]] bet.

This page exists because neither source is only "use embeddings." They argue for a durable, human-readable layer. [[raw-vs-wiki]] is the mechanical rule; this page is the reason.

Open question, not covered by the sample sources: when a vault is huge, which pages the model should rewrite versus leave alone.
