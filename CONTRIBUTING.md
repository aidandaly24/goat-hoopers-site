# CONTRIBUTING.md

## Workflow

1. **Branch** off `main`: `git checkout -b <your-name>/<what>`.
2. **Build** following `ARCHITECTURE.md` — domain types first, data layer
   second, surface last. UI from `@/ui` primitives and `--gh-*` tokens.
3. **Open a PR** against `main`. Every PR gets a **preview deployment** on
   Vercel automatically — check your changes live on the preview URL before
   asking for review.
4. **Aidan reviews and merges.** `main` is protected: PRs required, no direct
   pushes.

## Conventions

- **TypeScript strict.** `npm run typecheck` must pass. No `any`, no `@ts-ignore`
  without a comment explaining why.
- **No dead code.** If it's not rendered or called, delete it.
- **Domain before code.** New league concept? Type in `src/domain/` first.
- **One door for data.** Only `src/data/sleeper.ts` touches the Sleeper API.
  Components never fetch league data.
- **Tokens, not hex.** All colors/spacing from `src/ui/tokens.css`.
- **CSS modules** for component styles (`Component.module.css` next to the
  component). No global CSS beyond `src/app/globals.css`.
- **Document surfaces.** The entry component of each surface carries a comment
  block stating its contract (props in, what it renders).

## Local development

```bash
nvm use          # Node 22; Vitest 5 requires >=22.12 in this major
npm ci --include=dev
npm run dev      # http://localhost:3000
npm test         # offline fixtures; real requests/connections are rejected
npm run typecheck
npm run build    # must pass before opening a PR
```

CI uses the same locked install and commands, and rejects unsupported package
engines. Default tests need no database or secrets. The separate
`npm run test:price-history:local` opt-in requires synthetic Postgres at
`127.0.0.1:55438/price_history_test`. Once PR53's claim suite lands, run it with
`RUN_CLAIM_TEAM_LOCAL_TEST=1 npm test -- src/data/__tests__/claim-team-local.test.ts`
against `127.0.0.1:55441/claim_team_test`. The guard stays active: each flag
allows only its own numeric loopback endpoint; fetch and other sockets stay
blocked. Both flags are cleared in CI. Production builds may download public Google fonts.
PR checks compile the merge result with the base branch; logs print that commit
and the PR head so validation can be tied to the actual revision.

## Deployments

- Push to `main` → production deploys automatically.
- Open a PR → preview deployment with its own URL.
- The production URL is the source of truth; verify your change there after
  merge.
