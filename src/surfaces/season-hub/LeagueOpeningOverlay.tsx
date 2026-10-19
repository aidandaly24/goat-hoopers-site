import type { LeagueOpening } from "@/domain/league-opening";
import type { ServerClockAnchor } from "@/domain/server-clock";
import { ServerCountdown } from "@/ui/ServerCountdown";
import styles from "./PersonalizedHome.module.css";

/** Date-only provider evidence never becomes an invented midnight countdown.
 * A verified instant still requires an explicit server clock exchange.
 */
export function LeagueOpeningOverlay({ opening, clock = null }: { opening?: LeagueOpening; clock?: ServerClockAnchor | null }) {
  const date = opening?.date ? new Intl.DateTimeFormat("en", { month: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${opening.date}T12:00:00Z`)) : null;
  return <figcaption className={styles.openingOverlay} data-league-opening={opening?.status ?? "unavailable"}>
    <span className={styles.eyebrow}>League opening · Week 1</span>
    {opening?.status === "verified" ? <>
      <ServerCountdown clock={clock} deadlineMs={opening.startsAtMs} label="League tipoff in" endedLabel="Week 1 has started" uncertaintyLabel="Confirming the league clock" />
      <span>{date} · {opening.timeZone}</span>
    </> : <><strong>{date ?? "Opening week ahead"}</strong><span>League tipoff time awaiting confirmation</span></>}
  </figcaption>;
}
