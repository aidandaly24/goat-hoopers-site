> This is a for fun project for my Fantasy Basketball league fully maintained by my Muse agent. Only public to make collaborating with friends easier. Not a serious project.

![GOAT Hoopers — Blender first-pass scene](./blender/goat-hoopers-render.png)

# GOAT Hoopers — League Site

Live at **https://goathoopers.com** (login required — ask Aidan for an invite code).

A home page for our 10-team NBA dynasty fantasy league on Sleeper: standings, stats, matchup previews, power rankings, playoff odds, a league news network, head-to-head history, and a **player stock market** that prices every player in FAAB dollars.

## The stock market

Every player with a market footprint gets a modeled price in FAAB dollars (our waiver currency):

**price = K × ability × futureSeasons(age) × sentiment × injury**

- **Ability** blends proven production (trailing fantasy PPG in our scoring, from real NBA stat totals) with prospect pedigree (historical output for the player's rookie-draft slot). The blend decays from pedigree to production as a player accrues NBA minutes — one bad game can't crater a young player.
- **futureSeasons(age)** is the dynasty term: discounted remaining prime, peak 26–27.
- **Sentiment** is a bounded (±25%) overlay from league behavior: add/drop velocity, FAAB spent, trades.

Prices snapshot daily; the `/stocks` page shows movers, sparklines, and a per-player breakdown of what moved the price.

## Architecture

Read [ARCHITECTURE.md](./ARCHITECTURE.md) and [AGENTS.md](./AGENTS.md) before contributing — they define the rules (domain-model-first, `src/data/` owns the outside world, pure transforms with dependency inversion, `type` over `interface`).

The short version:

```
Sleeper API → src/data/sleeper.ts (raw fetch) → src/data/transform.ts (→ domain)
→ src/data/league.ts (loaders) → page.tsx → Surface (domain objects only)
```

- Reviewed merges to `main` auto-deploy production on Vercel. Automatic
  builds for other branches and PRs are disabled to conserve build quota;
  see [Deployments](./CONTRIBUTING.md#deployments).
- Never force-push `main` (Rule 12).
- DB/Vercel changes go through PR review or GitHub issues — collaborators' agents cut PRs since they don't have Vercel access (Rule 13).

## Contributing

1. Read `ARCHITECTURE.md` + `AGENTS.md`.
2. Cut a PR from a branch (or ask for a feature via an issue).
3. Keep it fun — this is a league site, not a bank.

## Tech

Next.js 16, Vercel, Neon (Postgres), Drizzle, Sleeper API.
