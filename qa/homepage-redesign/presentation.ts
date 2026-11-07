import home from "@/surfaces/season-hub/CourtsideHome.module.css";
import heading from "@/ui/SectionHeading.module.css";
import roster from "@/surfaces/season-hub/RosterValueSection.module.css";
import stage from "@/surfaces/season-hub/RosterPortraitStage.module.css";
import notebook from "@/surfaces/season-hub/ScoutingNotebook.module.css";
import form from "@/surfaces/season-hub/FormGuideWire.module.css";
import avatar from "@/ui/TeamAvatar.module.css";
import bar from "@/surfaces/season-hub/BarSetSection.module.css";
import face from "@/surfaces/season-hub/FacesStrip.module.css";
import card from "@/ui/Card.module.css";
import standings from "@/surfaces/season-hub/StandingsTable.module.css";

// QA-only composition over the unchanged public composite. Resolve exact
// CSS-module names instead of matching generated class-name substrings.
const s = ".editorial-study [data-courtside-home]";
const c = (name: string) => `${s} .${home[name]}`;
export const presentation = `
${s} {
  --gh-cs-wrap: 78rem;
  --gh-cs-title: clamp(var(--gh-s8), 4vw, var(--gh-s16));
  --gh-cs-heading: clamp(var(--gh-s6), 2.5vw, var(--gh-s10));
  --gh-cs-body: var(--gh-text-md);
  --gh-cs-caption: var(--gh-text-sm);
  --gh-cs-subhead: var(--gh-text-lg);
  --gh-cs-s7: var(--gh-s16);
  --gh-cs-s8: var(--gh-s16);
  background: var(--gh-bg);
}
${s} h2 { font-size: var(--gh-cs-heading); letter-spacing: -.045em; }
${s} .${heading.eyebrow}, ${s} .${roster.label} { text-transform: none; letter-spacing: 0; font-size: var(--gh-text-sm); }
${s} p { text-wrap: pretty; }
${c("opening-zone")} { padding-top: var(--gh-s4); padding-bottom: var(--gh-s4); }
${c("header-edition")}, ${c("stale-note")} { display: none; }
${c("edition-links")} { gap: var(--gh-s6); border-top: 1px solid var(--gh-border); padding-top: var(--gh-s3); margin-top: var(--gh-s4); }
${c("weekly-zone")} { background: var(--gh-bg); padding-top: 0; padding-bottom: var(--gh-s12); }
${s} .${heading.wrap} { align-items: baseline; gap: var(--gh-s6); margin-bottom: var(--gh-s6); }
${s} .${heading.eyebrow} { margin-bottom: var(--gh-s2); color: var(--gh-text-dim); }
${s} .${roster.section}, ${c("value-section")} { margin-top: var(--gh-s4); padding-top: var(--gh-s4); border-top: 1px solid var(--gh-control); }
${s} .${roster.layout} { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: var(--gh-s12); margin-top: 0; }
${s} .${roster.panel} { padding-top: 0; }
${s} .${roster.total} { font-family: var(--gh-font-body); font-size: clamp(var(--gh-s10), 5vw, var(--gh-s16)); font-weight: 700; letter-spacing: -.06em; }
${s} .${roster.meta}, ${s} .${roster.rank} { font-size: var(--gh-text-sm); }
${s} .${stage.stage} { height: auto; border: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--gh-s4); }
${s} .${stage.backdrop} { display: none; }
${s} .${stage.portrait} { position: static; inset: auto; width: 100%; height: calc(var(--gh-s16) + var(--gh-s8)); transform: none; }
${s} .${stage.caption} { display: none; }
${s} .${stage.names} { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-areas: none; gap: var(--gh-s4); margin-top: var(--gh-s4); }
${s} .${stage.names} li { grid-area: auto; text-align: left; }
${s} .${stage.names} a { font-size: var(--gh-text-md); padding-block: var(--gh-s3); }
${s} .${stage.position}, ${s} .${stage.price} { font-size: var(--gh-text-sm); }
${c("trend-unavailable")} { border: 0; border-left: 2px solid var(--gh-control); padding: var(--gh-s2) var(--gh-s4); margin-top: var(--gh-s4); }
${c("bar-layout")} { margin-top: 0; display: block; }
${c("value-face-list")} { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gh-s8); }
${c("value-face")} { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--gh-s1) var(--gh-s4); align-content: center; min-width: 0; }
${s} .${bar.portrait} { grid-row: span 3; height: calc(var(--gh-s16) + var(--gh-s8)); width: calc(var(--gh-s16) + var(--gh-s8)); }
${c("value-face-pos")} { font-size: var(--gh-text-sm); }
${c("value-face-name")} { font-size: var(--gh-s6); }
${c("value-face-team")} { min-width: 0; font-size: var(--gh-text-sm); }
${c("notebook")} { padding-top: var(--gh-s8); border-top: 1px solid var(--gh-control); }
${s} .${notebook.rows} { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); column-gap: var(--gh-s12); margin-top: 0; }
${s} .${notebook.row} { gap: var(--gh-s4); padding-block: var(--gh-s4); }
${s} .${notebook.body} h3 { font-size: var(--gh-text-lg); }
${s} .${notebook.body} p { font-size: var(--gh-text-sm); }
${s} .${form.layout} { gap: var(--gh-s12); margin-top: var(--gh-s12); padding-top: var(--gh-s6); border-top: 1px solid var(--gh-border); }
${c("studchud")} { padding-top: var(--gh-s8); border-top: 1px solid var(--gh-control); }
${c("ai-section")} { padding-top: var(--gh-s8); border-top: 1px solid var(--gh-control); }
${c("ai-row")} { display: grid; grid-template-columns: minmax(0, 1fr) minmax(10rem, .3fr); gap: 0 var(--gh-s8); padding-block: var(--gh-s4); }
${c("ai-row-teams")} { grid-column: 1 / -1; }
${c("ai-row-team")} { gap: var(--gh-s3); }
${c("ai-row-team")} a { min-height: 44px; display: inline-flex; align-items: center; }
${c("ai-row-bar")} { grid-column: 1; height: var(--gh-s1); border-radius: 0; }
${c("ai-row-final")} { grid-column: 1; }
${c("ai-prov")} { grid-column: 2; grid-row: 2 / span 2; margin: 0; align-self: start; }
${c("ai-prov")} summary { font-size: var(--gh-text-sm); }
${c("faces")} { padding-top: var(--gh-s8); border-top: 1px solid var(--gh-control); }
${c("faces-strip")} { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--gh-s6); overflow: visible; padding: var(--gh-s6) 0 0; }
${c("face-card")} { border: 0; border-bottom: 1px solid var(--gh-border); background: transparent; box-shadow: none; transform: none; min-width: 0; }
${c("face-card")}:hover { box-shadow: none; transform: none; }
${c("face-link")} { padding: 0 0 var(--gh-s4); gap: var(--gh-s2); }
${c("face-name")} { font-size: var(--gh-text-md); }
${c("face-team")} { align-items: start; font-size: var(--gh-text-sm); }
${c("face-team")} > span[style] { color: var(--gh-text-dim) !important; }
${s} .${face.portrait} { height: calc(var(--gh-s16) + var(--gh-s8)); }
${c("happenings")} { padding-top: var(--gh-s8); border-top-color: var(--gh-control); }
${c("wire-items")} { gap: var(--gh-s8); }
${c("wire-item")} { padding-left: 0; border: 0; padding-top: var(--gh-s4); border-top: 1px solid var(--gh-border); }
${c("teams-zone")} { background: var(--gh-bg-hover); padding-block: var(--gh-s12); border: 0; }
${c("directory-heading")} h2 { max-width: 18ch; font-size: var(--gh-cs-heading); }
${c("team-summary")} { padding-inline: 0; min-height: calc(var(--gh-s16) + var(--gh-s8)); }
${c("directory-labels")} { padding-inline: 0; }
${c("team-identity")} h3 { font-size: var(--gh-text-md); overflow-wrap: anywhere; }
${c("team-record")} strong { font-size: var(--gh-s6); }
${c("roster-detail")} { background: var(--gh-bg); }
${c("league-section")} { padding-block: var(--gh-s16); background: var(--gh-bg); }
${c("live-grid")} > div:first-child .${heading.wrap} { display: none; }
${s} .${card.card} { border: 0; background: transparent; box-shadow: none; padding: 0; }
${s} .${standings.row} { border: 0; border-bottom: 1px solid var(--gh-border); border-radius: 0; background: transparent; padding-block: var(--gh-s4); }
${s} .${standings.name}, ${s} .${standings.manager} { white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; }
${c("home-tools")} { background: var(--gh-bg); padding-block: 0 var(--gh-s12); }
${c("home-tools-layout")} { gap: var(--gh-s12); }
${c("home-tools-layout")} > div { padding: var(--gh-s6) 0 0; border-top: 1px solid var(--gh-control); }
${c("archive-zone")} { background: var(--gh-bg-hover); padding-block: var(--gh-s12); }
${c("arena-strip")} { display: none; }
${s} .${avatar.initials} { line-height: 1; white-space: nowrap; overflow-wrap: normal; }
${s} :focus-visible { outline: 2px solid var(--gh-focus); outline-offset: var(--gh-s1); }
@media(max-width:64rem) {
  ${c("feature-grid")} { grid-template-columns: minmax(0, 1fr); gap: var(--gh-s8); }
  ${c("team-desk")} { padding-top: var(--gh-s6); border-top: 1px solid var(--gh-control); }
  ${s} .${roster.layout} { gap: var(--gh-s6); }
  ${c("faces-strip")} { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media(max-width:48rem) {
  ${s} .${roster.layout}, ${s} .${notebook.rows} { grid-template-columns: minmax(0, 1fr); }
  ${s} .${roster.panel} { padding-top: var(--gh-s6); }
  ${c("ai-row")} { display: block; }
  ${c("ai-prov")} { margin-top: var(--gh-s2); }
}
@media(max-width:40rem) {
  ${s} { --gh-cs-s7: var(--gh-s12); }
  ${c("opening-zone")} { padding-top: var(--gh-s3); }
  ${c("feature-heading")} h1 { font-size: var(--gh-s8); line-height: 1.1; }
  ${c("feature-heading")} { padding-block: var(--gh-s4); }
  ${c("header-edition")} { flex-wrap: wrap; }
  ${s} .${heading.wrap}, ${c("section-head")} { flex-wrap: wrap; gap: var(--gh-s3); }
  ${s} .${stage.stage} { height: auto; gap: var(--gh-s2); }
  ${s} .${stage.portrait} { height: calc(var(--gh-s16) + var(--gh-s8)); }
  ${s} .${stage.names} { gap: var(--gh-s3); }
  ${s} .${stage.names} a { font-size: var(--gh-text-sm); }
  ${c("value-face-list")} { grid-template-columns: minmax(0, 1fr); gap: var(--gh-s6); }
  ${c("faces-strip")} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gh-s6); }
  ${c("face-team")} { flex-wrap: wrap; }
  ${c("wire-items")} { grid-template-columns: minmax(0, 1fr); gap: var(--gh-s4); }
  ${c("team-summary")} { padding-block: var(--gh-s4); }
  ${c("home-tools-layout")} { gap: var(--gh-s8); }
  ${c("league-section")} { padding-block: var(--gh-s12); }
}
`;
