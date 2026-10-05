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

- **TypeScript strict.** `npx tsc --noEmit` must pass. No `any`, no `@ts-ignore`
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
npm install
npm run dev      # http://localhost:3000
npm run build    # must pass before opening a PR
```

## Deployments

- Push to `main` → production deploys automatically.
- Open a PR → preview deployment with its own URL.
- The production URL is the source of truth; verify your change there after
  merge.
