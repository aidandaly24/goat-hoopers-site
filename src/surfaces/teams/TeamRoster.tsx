"use client";

import { useSearchParams } from "next/navigation";
import type { Player } from "@/domain";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import { PlayerName } from "@/ui/PlayerRow";
import { filterRoster, readRosterFilters, rosterFiltersUrl, rosterPositions } from "./rosterQuery";
import styles from "./TeamRoster.module.css";

/**
 * teams — compact roster identity and local search/position filters.
 * Receives the already-loaded Player[] and owning team id; never fetches.
 * Ordinary PlayerName links keep their existing /player/[id] destinations.
 * Native history replacement preserves the filtered URL for browser Back
 * without a server navigation or a new entry for each keystroke.
 */
export function TeamRoster({ players, teamId }: { players: Player[]; teamId: string }) {
  const params = useSearchParams();
  const positions = rosterPositions(players);
  const filters = readRosterFilters(params, positions);
  const shown = filterRoster(players, filters);

  function update(next: typeof filters) {
    window.history.replaceState(null, "", rosterFiltersUrl(
      window.location.pathname, window.location.search, window.location.hash, next,
    ));
  }

  return (
    <>
      <div className={styles.controls}>
        <label className={styles.search}>
          <span className={styles.sr}>Search this roster</span>
          <input type="search" placeholder="Search this roster" value={filters.search}
            onChange={(event) => update({ ...filters, search: event.target.value })} />
        </label>
        <fieldset className={styles.positions}>
          <legend className={styles.sr}>Filter roster by position</legend>
          {["All", ...positions].map((position) => (
            <label key={position}>
              <input type="radio" name="roster-position" value={position}
                checked={filters.position === position}
                onChange={() => update({ ...filters, position })} />
              <span>{position}<small className="gh-num">{position === "All" ? players.length :
                players.filter((player) => player.position === position).length}</small></span>
            </label>
          ))}
        </fieldset>
      </div>
      <p className={styles.sr} role="status">{shown.length} of {players.length} players shown</p>
      <TeamRosterList players={shown} teamId={teamId} />
      {shown.length === 0 && (
        <div className={styles.noResults}>
          <p>No roster players match these filters.</p>
          <button type="button" onClick={() => update({ search: "", position: "All" })}>Clear filters</button>
        </div>
      )}
    </>
  );
}

/** Complete roster fallback for prerendering; no essential player waits on a hook. */
export function TeamRosterList({ players, teamId }: { players: Player[]; teamId: string }) {
  return (
    <div className={styles.table}>
      <div className={styles.columns} aria-hidden="true"><span>Player</span><span>Pos.</span><span>NBA</span></div>
      <ul className={styles.list} aria-label="Team roster">
        {players.map((player) => (
          <li key={player.id} data-roster-player={player.id}>
            <div className={styles.identity}>
              <PlayerHeadshot espnId={player.espnId} name={player.fullName} teamId={teamId} size={28} />
              <PlayerName player={player} />
            </div>
            <span className={styles.position}><span className={styles.sr}>Position: </span>{player.position || "—"}</span>
            <span className={`${styles.club} gh-num`}><span className={styles.sr}>NBA club: </span>{player.nbaTeam || "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
