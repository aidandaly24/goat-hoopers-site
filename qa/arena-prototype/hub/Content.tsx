import Link from "next/link";
import { memo } from "react";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import home from "@/surfaces/season-hub/CourtsideHome.module.css";
import reveal from "@/surfaces/season-hub/Reveal.module.css";
import avatar from "@/ui/TeamAvatar.module.css";
import card from "@/ui/Card.module.css";
import roster from "@/surfaces/season-hub/RosterValueSection.module.css";
import portraitsStyle from "@/surfaces/season-hub/RosterPortraitStage.module.css";
import { portraits, type arenaFixture } from "../fixture";
import type { Destination } from "./model";

type Fixture = ReturnType<typeof arenaFixture>;
const c = (key: string) => `.${home[key]}`;
// Existing public composite, one DOM tree, with scoped destination views.
// Full edition remains available as the exact content/control inventory.
const rules = `
.hub-content [data-courtside-home] { background: transparent; --gh-cs-wrap: 100%; }
.hub-content [data-courtside-home] > *, .hub-content ${c("wrap")} { background: transparent; }
.hub-content ${c("wrap")} { width: 100%; max-width: none; padding: 0; }
.hub-content ${c("opening-zone")}, .hub-content ${c("weekly-zone")}, .hub-content ${c("teams-zone")}, .hub-content ${c("league-section")}, .hub-content ${c("archive-zone")}, .hub-content ${c("home-tools")} { padding: 0; border: 0; }
.hub-content ${c("weekly-zone")} > ${c("wrap")} > *, .hub-content [data-league-section], .hub-content ${c("archive-zone")}, .hub-content ${c("home-tools")} { margin-block: var(--gh-s8); }
.hub-content .${reveal.reveal} { opacity: 1; transform: none; animation: none; }
.hub-content .${card.card} { background: transparent; border: 0; box-shadow: none; border-radius: 0; }
.hub-content .${roster.layout} { grid-template-columns: minmax(0,1fr); gap: var(--gh-s6); }
.hub-content .${roster.total} { font-size: var(--gh-s8); letter-spacing: -.02em; }
.hub-content .${roster.cents} { font-size: inherit; color: inherit; }
.hub-content .${roster.meta}, .hub-content .${roster.rank} { font-size: var(--gh-text-sm); }
.hub-content .${portraitsStyle.stage} { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); height: auto; gap: var(--gh-s2); overflow: visible; }
.hub-content .${portraitsStyle.backdrop} { display: none; }
.hub-content .${portraitsStyle.portrait}[data-position] { position: relative; inset: auto; width: 100%; height: 6rem; transform: none; }
.hub-content .${portraitsStyle.caption} { position: static; grid-column: 1/-1; padding: 0; background: transparent; }
.hub-content .${portraitsStyle.names} a { font-size: var(--gh-text-sm); }
.hub-content .${portraitsStyle.price}, .hub-content .${portraitsStyle.position} { font-size: var(--gh-text-xs); }
.hub-content ${c("clubhouse-court")}, .hub-content ${c("arena-strip")} { display: none; }
.hub-content ${c("feature-grid")} { display: block; }
.hub-content ${c("feature-heading")} h1 { font-size: clamp(var(--gh-s6), 3vw, var(--gh-s8)); }
.hub-content ${c("team-desk")} { margin-block: var(--gh-s6); }
.hub-content ${c("faces-strip")} { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); overflow: visible; gap: var(--gh-s4); }
.hub-content ${c("face-card")} { min-width: 0; border: 0; background: transparent; }
.hub-content ${c("face-team")} > span[style] { color: var(--gh-text) !important; }
.hub-content .${avatar.initials} { white-space: nowrap; overflow-wrap: normal; line-height: 1; }
.hub-content ${c("face-team")} .${avatar.initials} { font-size: var(--gh-text-xs); }
:where(.hub-content[data-place]:not([data-place="edition"])) [data-courtside-home] > * { display: none; }
.hub-content[data-place="matchup"] ${c("opening-zone")}, .hub-content[data-place="matchup"] ${c("weekly-zone")},
.hub-content[data-place="team"] ${c("weekly-zone")}, .hub-content[data-place="players"] ${c("weekly-zone")},
.hub-content[data-place="standings"] [data-league-section],
.hub-content[data-place="league"] ${c("teams-zone")}, .hub-content[data-place="league"] ${c("weekly-zone")}, .hub-content[data-place="league"] ${c("archive-zone")}, .hub-content[data-place="league"] ${c("home-tools")} { display: block; }
.hub-content[data-place]:not([data-place="edition"]) ${c("weekly-zone")} > ${c("wrap")} > * { display: none; }
.hub-content[data-place="matchup"] ${c("weekly-zone")} > ${c("wrap")} > :has([data-ai-decides]),
.hub-content[data-place="team"] ${c("weekly-zone")} > ${c("wrap")} > :has([data-roster-value], [data-form-wire]),
.hub-content[data-place="players"] ${c("weekly-zone")} > ${c("wrap")} > :has([data-scouting-notebook], [data-stud-chud], [data-faces-strip], [data-bar-set]),
.hub-content[data-place="league"] ${c("weekly-zone")} > ${c("wrap")} > ${c("happenings")} { display: block; }
.hub-content[data-missing="true"] [data-courtside-home] > * { display: block !important; }
@media(max-width:40rem) {
 .hub-content ${c("faces-strip")} { grid-template-columns: repeat(2,minmax(0,1fr)); }
 .hub-content ${c("value-face-list")}, .hub-content ${c("live-grid")} { grid-template-columns: minmax(0,1fr); }
 .hub-content ${c("section-head")} { flex-direction: column; align-items: flex-start; }
}
`;

function Content({ data, place, member }: { data: Fixture; place: Destination; member: boolean }) {
  return <div className="hub-content" data-place={place} data-missing={!data.home.edition}>
    <style>{rules}</style>
    {place === "team" && <p className="hub-context">{member ? "Your roster, its modeled value and this week’s player evidence." : <>Your bench is waiting. <Link href="/login">Log in</Link> or <Link href="/account">claim your team</Link> to open your own edition.</>}</p>}
    {place === "arcade" ? <section className="hub-arcade"><h3>Step onto the practice court.</h3><p>Take a few free throws, or open the Arcade for the playable games.</p><Link href="/arcade/free-throw">Play free throw</Link><Link href="/arcade">Open Arcade</Link></section> :
      <CourtsideHome data={data.home} archive={data.archive} portraits={portraits} personal={data.personal}
        aiWeekly={data.weekly} faces={data.faces} viewerTeamId={member ? "1" : undefined} />}
  </div>;
}
export default memo(Content);
