# Agent conventions

This is the sticky monorepo for weekday tech demos. One repo, many apps.

Demos are planned in chat, then built by a Cursor cloud agent (model `claude-fable-5` / Fable 5) against this repo.

## Hard rules

- Never create a new GitHub repository for a demo. Add a folder under `apps/<kebab-slug>/`.
- Cloud agents may only add or update `apps/<kebab-slug>/`. Do not touch sibling apps, `AGENTS.md`, or tracking unless the task is explicitly about those files.
- Plan first: run `skills/project-planning/` and write `apps/<kebab-slug>/PLAN.md` before implementation.
- Each app must be self-contained. From that folder, `bun install && bun run dev` is enough.
- Use Bun as the runtime, package manager, and script runner.
- Every app needs a `bunfig.toml` with `[install] minimumReleaseAge = 259200` before `bun install` or `bun add`.
- UI default is shadcn/ui with a minimalist preset. Add components on demand.
- Open one PR per demo. The PR must attach **both** at least one screenshot **and** at least one video of the running app. Not optional.
- Use model `claude-fable-5` (Fable 5) for initial prototypes unless the owner asks otherwise.

## Preview hosting

Preferred durable option: one Cloudflare Pages project for the whole repo, routed by `apps/<slug>/`. Not one Pages project per app. Secrets on this repo: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Stack defaults

- Build for one user first.
- Official `bunx create-*` scaffolds over hand-rolled skeletons.
- Boring, well-documented defaults. Cut features before cutting clarity.
