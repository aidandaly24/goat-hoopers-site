<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Project rules

These are the house rules for this repo. They were agreed with Aidan and
outrank general conventions. Keep them short, keep them enforced.

1. Read `ARCHITECTURE.md` before touching anything. It maps the whole repo.
2. The Sleeper API is only touched in `src/data/`. Nowhere else, no exceptions.
3. New league concept? Add the type to `src/domain/` first, then teach
   `src/data` to build it. Never invent a parallel shape inside a component.
4. Surfaces don't import each other's internals. They share domain types only.
5. Every surface uses `src/ui/` primitives and tokens. No one-off colors,
   fonts, or spacing.
6. Pages stay thin: load data via `@/data/league`, hand domain objects to
   surfaces. No fetching in components.
7. Mobile and desktop are both first-class. Every new component ships both
   layouts.
8. Update `ARCHITECTURE.md` when you add a surface, domain type, or data
   loader.
9. Prefer PRs over direct pushes. PRs get preview deployments and review; keep them small and focused. Direct pushes to main are fine for small fixes — keep them clean and build-passing.
10. Prefer `type` over `interface`. Reach for `interface` only for
    declaration merging (augmenting a library's types) or a class
    `implements` contract. Everything else is `type`.
11. Use dependency inversion. Surfaces and loaders receive their dependencies
    (data clients, stores) as parameters — never import a concrete client
    directly. Everything stays testable with fakes.
12. Never force-push to main, ever. Main's history is append-only. If a push
    is rejected or the branches diverge, fetch and fix the conflicts with a
    regular merge or rebase — never `--force`. If a bad commit lands, revert
    it with a new commit instead of rewriting history.
13. DB and Vercel changes go through PR review. Collaborators and their
    agents may push ordinary changes to main, but anything touching the
    database (migrations, schema, seed data) or needing Vercel project
    changes (env vars, project settings) must arrive as a PR — they don't
    have Vercel access. Aidan's agent watches open PRs on a schedule, reviews
    each one, performs the Vercel/DB side of the work when it's reasonable,
    leaves comments for the other agent to iterate on, and merges when the
    PR is clean and CI is green. Never merge a destructive migration without
    Aidan's explicit approval.
