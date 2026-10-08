"use client";

/* eslint-disable @next/next/no-img-element -- Approved, pre-sized local assets are served directly without image-optimizer quota. */

import { useRef, useState, type ReactNode } from "react";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { FigurineDialog } from "./CourtsideDialog";
import { cs } from "./CourtsideStyles";

type Props = {
  entries: LiveClubhouseDirectoryEntry[];
  seasonLabel: string;
  checkedAt: string;
  preseason: boolean;
  rosterNamesAvailable: boolean;
  portraits: Record<string, string>;
  children?: ReactNode;
};
const ordinal = (value: number) =>
  `${value}${value === 1 ? "st" : value === 2 ? "nd" : value === 3 ? "rd" : "th"}`;

export function CourtsideDirectory({
  entries,
  seasonLabel,
  checkedAt,
  preseason,
  rosterNamesAvailable,
  portraits,
  children,
}: Props) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("league");
  const input = useRef<HTMLInputElement>(null);
  const search = query.trim().toLocaleLowerCase();
  const filtered = entries.filter((entry) =>
    [
      entry.identity.name,
      entry.identity.managerName,
      ...entry.players.map((player) => player.fullName),
    ].some((name) => name.toLocaleLowerCase().includes(search)),
  );
  if (order === "finish")
    filtered.sort(
      (a, b) =>
        (a.previousSeason?.finish ?? Infinity) -
        (b.previousSeason?.finish ?? Infinity),
    );
  const total = entries.reduce((sum, entry) => sum + entry.players.length, 0);
  return (
    <section
      className={cs("teams-zone")}
      id="teams"
      aria-labelledby="teams-title"
    >
      <div className={cs("wrap")}>
        <div className={cs("directory-heading")}>
          <div>
            <h2 id="teams-title">Know who you’re playing.</h2>
            <p>Ten managers. Their rosters. The next matchup.</p>
            <div className={cs("directory-date")}>
              {seasonLabel}{" "}
              <span>
                Live roster check ·{" "}
                {new Date(checkedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            </div>
          </div>
        </div>
        {!rosterNamesAvailable && (
          <p className={cs("stale-note")}>
            Player names are temporarily unavailable. Player IDs and team
            profiles remain accessible.
          </p>
        )}
        <form
          className={cs("directory-tools")}
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className={cs("directory-search")}>
            <span aria-hidden="true">⌕</span>
            <span className={cs("sr-only")}>
              Find a team, manager or roster player
            </span>
            <input
              ref={input}
              type="search"
              placeholder="Find a team, manager or roster player"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              aria-controls="directory-list"
            />
          </label>
          <label className={cs("sort-label")}>
            Order
            <select
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              aria-controls="directory-list"
            >
              <option value="league">League order</option>
              <option value="finish">2025 finish</option>
            </select>
          </label>
          <button
            className={cs("clear-search")}
            type="button"
            onClick={() => {
              setQuery("");
              input.current?.focus();
            }}
          >
            Clear
          </button>
        </form>
        <div className={cs("directory-labels")} aria-hidden="true">
          <span>Team / manager</span>
          <span>{preseason ? "2025 record" : "Current record"}</span>
          <span>
            {preseason ? "Opening week · Upcoming" : "Current matchup"}
          </span>
          <span>Full roster</span>
        </div>
        <div id="directory-list">
          {filtered.length ? (
            filtered.map((entry) => {
              const team = entry.identity;
              const prior = entry.previousSeason;
              const matchup = entry.currentMatchup;
              const opponent = matchup
                ? matchup.home.id === team.id
                  ? matchup.away
                  : matchup.home
                : null;
              const anchors = entry.featuredPlayerIds
                .map((id) => entry.players.find((player) => player.id === id))
                .filter((player) => !!player);
              const hits = search
                ? entry.players
                    .filter((player) =>
                      player.fullName.toLocaleLowerCase().includes(search),
                    )
                    .map((player) => player.fullName)
                : [];
              return (
                <details
                  key={team.id}
                  className={cs("team-entry")}
                  data-team-id={team.id}
                >
                  <summary
                    className={cs("team-summary")}
                    aria-label={`${team.name}, ${entry.players.length} players; expand roster${preseason && prior?.ownerNote ? "; 2025 record under previous manager" : ""}`}
                  >
                    <div className={cs("team-identity")}>
                      <TeamAvatar name={team.name} avatar={team.avatar} />
                      <div>
                        <h3>{team.name}</h3>
                        <p>
                          {team.managerName}
                          {team.id === "5" ? " · 2025 champion" : ""}
                        </p>
                      </div>
                    </div>
                    <div className={cs("team-record")}>
                      {preseason && prior ? (
                        <>
                          <strong>
                            {prior.wins}–{prior.losses}
                          </strong>
                          <small>2025 · {ordinal(prior.finish)}</small>
                          {prior.ownerNote && (
                            <small className={cs("owner-qualifier")}>
                              Previous manager
                            </small>
                          )}
                        </>
                      ) : entry.currentRecord ? (
                        <>
                          <strong>
                            {entry.currentRecord.wins}–
                            {entry.currentRecord.losses}
                            {entry.currentRecord.ties
                              ? `–${entry.currentRecord.ties}`
                              : ""}
                          </strong>
                          <small>Current season</small>
                        </>
                      ) : (
                        <small>Record unavailable</small>
                      )}
                    </div>
                    <div className={cs("team-opponent")}>
                      {opponent
                        ? `Week ${matchup!.week} vs ${opponent.name}`
                        : "Pairing pending"}
                    </div>
                    <span className={cs("roster-toggle")}>
                      {entry.players.length} players{" "}
                      <span aria-hidden="true">⌄</span>
                    </span>
                  </summary>
                  {hits.length > 0 && (
                    <p className={cs("search-hit")}>
                      On this roster: {hits.join(", ")}
                    </p>
                  )}
                  <div className={cs("roster-detail")}>
                    <div className={cs("roster-detail-heading")}>
                      <p>Current roster · {seasonLabel}</p>
                      <a className={cs("text-link")} href={`/teams/${team.id}`}>
                        Full team profile ↗
                      </a>
                    </div>
                    {!!anchors.length && (
                      <div className={cs("anchor-detail")}>
                        <div className={cs("anchor-faces")}>
                          {anchors.map(
                            (player) =>
                              portraits[player.id] && (
                                <a
                                  href={`/player/${player.id}`}
                                  key={player.id}
                                  aria-label={`Open ${player.fullName} player page`}
                                >
                                  <img
                                    src={portraits[player.id]}
                                    alt=""
                                    width="300"
                                    height="200"
                                    loading="lazy"
                                  />
                                </a>
                              ),
                          )}
                        </div>
                        <p>
                          Roster anchors:{" "}
                          {anchors.map((player, index) => (
                            <span key={player.id}>
                              {index > 0 && " / "}
                              <a href={`/player/${player.id}`}>
                                {player.fullName}
                              </a>
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                    <ul className={cs("roster-list")}>
                      {entry.players.map((player) => (
                        <li key={player.id}>
                          <a href={`/player/${player.id}`}>
                            <span>{player.fullName}</span>
                            <small>
                              {player.position || "—"} ·{" "}
                              {player.nbaTeam || "FA"}
                            </small>
                          </a>
                        </li>
                      ))}
                    </ul>
                    {prior?.ownerNote && (
                      <p className={cs("owner-note")}>
                        2025 context: {prior.ownerNote}
                      </p>
                    )}
                    {opponent && (
                      <a
                        className={cs("text-link")}
                        href={`/teams/${opponent.id}`}
                      >
                        {preseason ? "Opening opponent" : "Current opponent"}:{" "}
                        {opponent.name} ↗
                      </a>
                    )}
                    {entry.latestMove && (
                      <p className={cs("roster-wire")}>
                        <strong>
                          Latest move ·{" "}
                          {new Date(
                            entry.latestMove.createdAt,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })}
                        </strong>{" "}
                        {entry.latestMove.summary}
                      </p>
                    )}
                    <div>
                      <FigurineDialog teamId={team.id} name={team.name} />
                    </div>
                  </div>
                </details>
              );
            })
          ) : (
            <p className={cs("empty")}>
              {entries.length
                ? "No matching team, manager or roster player. Clear the search to show all teams."
                : "Live rosters are temporarily unavailable. Browse the team profiles below."}
            </p>
          )}
        </div>
        <p className={cs("directory-count")} role="status" aria-live="polite">
          {search
            ? `${filtered.length} of ${entries.length} teams match your search`
            : `All ${entries.length} teams · ${total} current roster players`}
        </p>
        <details className={cs("directory-method")}>
          <summary>What these summaries show</summary>
          <p>
            Rosters and pairings come from Sleeper.{" "}
            {preseason
              ? "Record and finish refer to the completed 2025 season; current records are available in the live standings below."
              : "Records refer to the current season. The 2025 order uses final historical placements."}{" "}
            NeuralNets inherited the 2025 record under QBs Gremlins’ previous
            manager. Roster anchors are editorial selections checked against
            current ownership, not a ranked list or declared starting lineup.
            Open a row to see every player and the full team profile.
          </p>
        </details>
        {children}
      </div>
    </section>
  );
}
