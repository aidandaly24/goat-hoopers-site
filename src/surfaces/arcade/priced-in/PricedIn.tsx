"use client";

/**
 * Priced In — the arcade price game (practice).
 *
 * Receives five dealt rounds from the page: real modeled FAAB values
 * sampled server-side from the shared market loader, each with a line
 * set just off the value. The visitor calls over or under; the real
 * value lands and the round scores by the domain rules in
 * `domain/arcade/priced-in.ts` (correct side 100, closeness bonus up
 * to 50, best game 750).
 *
 * All game state lives in the domain's pure state machine
 * (`PricedInGameState`), which ties every result to one complete deal
 * identity: pressing Play again locks input while the refresh is in
 * flight, and the delivery that answers it starts the fresh game
 * wholesale — different prices or lines for the same players, or the
 * same deal redealt identically — instead of ever pairing the old
 * deal's calls with another deal's rounds.
 *
 * Practice only, like free-throw: scores live in this session's
 * memory. Nothing here calls a server action or the GameStore, so no
 * client-computed score is ever recorded as a leaderboard truth.
 * League competition stays closed (registry status) until a
 * server-scored mode is designed.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PRICED_IN_MAX_SCORE,
  PRICED_IN_ROUND_COUNT,
  advancePricedIn,
  callPricedIn,
  pricedInCallIsCorrect,
  receivePricedInDeal,
  requestPricedInRedeal,
  startPricedInGame,
  type PricedInCall,
  type PricedInRound,
} from "@/domain/arcade";
import { Badge } from "@/ui/Badge";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import controls from "@/ui/controls.module.css";
import styles from "./PricedIn.module.css";

const faab = (value: number) => `$${value.toFixed(2)}`;

export function PricedIn({
  rounds,
  pricingBasis,
}: {
  /** Dealt rounds; a short array renders the honest unavailable state. */
  rounds: PricedInRound[];
  /** The market's pricing basis, labelled while prices are preseason-modeled. */
  pricingBasis: "preseason" | "in-season";
}) {
  const router = useRouter();
  const [game, setGame] = useState(() => startPricedInGame(rounds));

  // A refresh delivers a new deal through props. Reconcile before
  // deriving anything: the render-phase adjustment React prescribes
  // for prop-driven resets. A different deal identity starts a fresh
  // game; the same identity leaves a running game untouched — and
  // while a re-deal is outstanding, the new delivery completes it
  // even when the redealt content is identical (the state machine
  // tracks which delivery it has already consumed, so the render
  // still holding the old props never completes it early).
  const active = receivePricedInDeal(game, rounds);
  if (active !== game) setGame(active);

  const total = active.results.reduce((sum, result) => sum + result.points, 0);
  const roundIndex = active.roundIndex;
  const round = active.rounds[roundIndex];
  const current = active.results[roundIndex];
  const revealed = current !== undefined;
  const finished = active.finished;
  const redealing = active.redealing;

  if (rounds.length < PRICED_IN_ROUND_COUNT || !round) {
    return (
      <div className={`gh-arcade-canvas ${styles.surface}`} data-arcade-page>
        <div className={styles.inner}>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>GOAT Hoopers · Arcade</p>
            <h1 className={styles.title}>Priced In</h1>
          </header>
          <section className={styles.card} aria-label="Priced In unavailable">
            <h2 className={styles.cardTitle}>The market is quiet</h2>
            <p className={styles.copy}>
              Priced In deals from the live player market, and there are not
              enough priced players right now to deal a fair game. Nothing
              here is estimated — try again once the market is moving.
            </p>
            <Link href="/arcade" prefetch={false} className={controls.secondary}>
              Back to the Arcade
            </Link>
          </section>
        </div>
      </div>
    );
  }

  const choose = (call: PricedInCall) => setGame(callPricedIn(active, call));

  const advance = () => setGame(advancePricedIn(active));

  const playAgain = () => {
    // Lock input on the old deal first; the fresh game starts when
    // the refresh's delivery arrives — a different deal, or the same
    // one redealt identically.
    setGame(requestPricedInRedeal(active));
    // Re-deals server-side: a refresh samples a fresh set of rounds.
    router.refresh();
  };

  return (
    <div className={`gh-arcade-canvas ${styles.surface}`} data-arcade-page>
      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>GOAT Hoopers · Arcade</p>
          <h1 className={styles.title}>Priced In</h1>
          <p className={styles.sub}>
            Five players, five lines. Call over or under the real modeled
            value — the closest calls score the most.
          </p>
          <div className={styles.meta}>
            <Badge tone="gold">{pricingBasis === "preseason" ? "Preseason pricing" : "In-season pricing"}</Badge>
            <Link href="/arcade" prefetch={false} className={controls.quiet}>
              Back to the Arcade
            </Link>
          </div>
          {pricingBasis === "preseason" && (
            <p className={styles.note}>
              Values are preseason modeled prices, running on prior
              production and pedigree until games are played.
            </p>
          )}
          <p className={styles.rules}>
            How it scores: a correct call earns 100 points plus a closeness
            bonus of up to 50 — the nearer the line lands to the real value,
            the bigger the bonus. A wrong call earns nothing. Best possible
            score is <span className="gh-num">{PRICED_IN_MAX_SCORE}</span>.
            Practice game — scores stay in this session.
          </p>
        </header>

        {finished ? (
          <section className={styles.card} aria-label="Final score">
            <p className={styles.progress}>Final score</p>
            <p className={styles.finalScore}>
              <span className="gh-num">{total}</span>
              <span className={styles.finalMax}> of <span className="gh-num">{PRICED_IN_MAX_SCORE}</span></span>
            </p>
            <ul className={styles.recap}>
              {active.results.map(({ round: played, call, points }) => (
                <li key={played.playerId} className={styles.recapRow}>
                  <span className={styles.recapName}>{played.playerName}</span>
                  <span className="gh-num">
                    Line {faab(played.line)} · Real {faab(played.price)} · Called {call}
                  </span>
                  <span className="gh-num">{points > 0 ? `+${points}` : "0"}</span>
                </li>
              ))}
            </ul>
            <div className={styles.calls}>
              <button
                type="button"
                className={controls.primary}
                onClick={playAgain}
                disabled={redealing}
                aria-live="polite"
              >
                {redealing ? "Dealing a fresh game…" : "Play again"}
              </button>
              <Link href="/arcade" prefetch={false} className={controls.secondary}>
                Back to the Arcade
              </Link>
            </div>
          </section>
        ) : (
          <section className={styles.card} aria-label={`Player ${roundIndex + 1} of ${active.rounds.length}`}>
            <div className={styles.progress}>
              <span>Player <span className="gh-num">{roundIndex + 1}</span> of <span className="gh-num">{active.rounds.length}</span></span>
              <span>Score <span className="gh-num">{total}</span></span>
            </div>
            <div className={styles.player}>
              <PlayerHeadshot espnId={round.espnId} name={round.playerName} size={96} />
              <div>
                <h2 className={styles.playerName}>{round.playerName}</h2>
                <p className={styles.playerMeta}>
                  {[round.position, round.nbaTeam].filter(Boolean).join(" · ") || "NBA"}
                </p>
              </div>
            </div>
            <p className={styles.line}>
              The line <strong className="gh-num">{faab(round.line)}</strong>
            </p>
            <p className={styles.question}>
              Is the real modeled value over or under the line?
            </p>
            {!revealed ? (
              <div className={styles.calls}>
                <button type="button" className={controls.primary} onClick={() => choose("under")}>
                  Under {faab(round.line)}
                </button>
                <button type="button" className={controls.primary} onClick={() => choose("over")}>
                  Over {faab(round.line)}
                </button>
              </div>
            ) : (
              <div className={styles.reveal} role="status">
                <p className={styles.realValue}>
                  Real value <strong className="gh-num">{faab(round.price)}</strong>
                </p>
                <p className={styles.copy}>
                  {round.changePct !== null
                    ? <>Versus the last snapshot: <span className="gh-num">{round.changePct >= 0 ? "+" : ""}{round.changePct.toFixed(1)}%</span>.</>
                    : "No earlier snapshot yet — this is the first priced value."}
                </p>
                <p className={styles.copy}>
                  {pricedInCallIsCorrect(round, current.call)
                    ? <>You called {current.call} — right side. <strong className="gh-num">+{current.points} points</strong> (100 for the call, {current.points - 100} closeness bonus).</>
                    : <>You called {current.call} — it landed {round.price > round.line ? "over" : "under"}. No points.</>}
                </p>
                <div className={styles.calls}>
                  <button type="button" className={controls.primary} onClick={advance}>
                    {roundIndex === active.rounds.length - 1 ? "See final score" : "Next player"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
