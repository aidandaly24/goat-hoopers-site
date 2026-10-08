import Link from "next/link";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { cs } from "./CourtsideStyles";
import "@/ui/courtside-tokens.css";

export function CourtsideArchive({ editions }: { editions: WeeklyEdition[] }) {
  return (
    <main className={cs("surface")} data-courtside-home>
      <section className={cs("archive-page")}>
        <div className={cs("wrap")}>
          <h1>Every week has a story.</h1>
          <p className={cs("archive-intro")}>
            Game of the Week, players to watch, and the moves everybody’s
            talking about. Past editions stay here as the season moves on.
          </p>
          <p className={cs("caption")}>
            Drafts are sample editions for review, not previously published Muse
            editions.
          </p>
          <div className={cs("archive-list")}>
            {editions.map((edition) => (
              <Link
                className={cs("archive-row")}
                href={`/weekly/${edition.id}`}
                key={edition.id}
              >
                <time>{edition.dateLabel}</time>
                <div>
                  <h2>{edition.title}</h2>
                  <p>
                    {edition.game.note} ·{" "}
                    {edition.status === "draft" ? "Sample draft" : "Published"}
                  </p>
                </div>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
          <Link className={cs("text-link")} href="/">
            ← Back to this week
          </Link>
        </div>
      </section>
    </main>
  );
}
