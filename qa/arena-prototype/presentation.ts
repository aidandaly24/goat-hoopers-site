import home from "@/surfaces/season-hub/CourtsideHome.module.css";
import reveal from "@/surfaces/season-hub/Reveal.module.css";
import card from "@/ui/Card.module.css";
import heading from "@/ui/SectionHeading.module.css";
import notebook from "@/surfaces/season-hub/ScoutingNotebook.module.css";
import spotlight from "@/surfaces/season-hub/StudChud.module.css";
import roster from "@/surfaces/season-hub/RosterValueSection.module.css";

/** Review-only composition overrides. Source components, DOM content and
 * production CSS remain unchanged. Resolved module names avoid fuzzy selectors. */
const rules = `
  .arena-study .${home.surface},
  .arena-study .${home["opening-zone"]},
  .arena-study .${home["weekly-zone"]},
  .arena-study .${home["teams-zone"]},
  .arena-study .${home["league-section"]},
  .arena-study .${home["home-tools"]},
  .arena-study .${home["archive-zone"]} { background: transparent; }
  .arena-study .${home.wrap} {
    background: var(--gh-bg);
    padding-inline: var(--gh-s8);
  }
  .arena-study .${home["weekly-zone"]} > .${home.wrap} { display: flow-root; }
  .arena-study .${home["opening-zone"]} > .${home.wrap} {
    padding-block: var(--gh-s6);
    background: transparent;
  }
  .arena-study .${home["header-edition"]},
  .arena-study .${home["stale-note"]} { margin: 0; width: 100%; max-width: none; border: 0; }
  .arena-study .${home["feature-heading"]} { padding-top: var(--gh-s4); }
  .arena-study .${home["feature-heading"]} h1 { font-size: var(--arena-title); max-width: 26ch; line-height: 1.08; }
  .arena-study .${home["header-edition"]},
  .arena-study .${home["stale-note"]},
  .arena-study .${home["feature-heading"]},
  .arena-study .${home["feature-caption-row"]},
  .arena-study .${home["edition-links"]} {
    background: var(--gh-bg);
    padding: var(--gh-s4);
  }
  .arena-study .${home["team-desk"]} {
    background: var(--gh-bg);
    padding: var(--gh-s6);
    border: 0;
  }
  .arena-study .${home["weekly-zone"]} > .${home.wrap},
  .arena-study .${home["teams-zone"]} > .${home.wrap},
  .arena-study .${home["league-section"]} > .${home.wrap},
  .arena-study .${home["archive-zone"]} > .${home.wrap} {
    padding-block: var(--gh-s12);
  }
  .arena-study .${home["weekly-zone"]},
  .arena-study .${home["teams-zone"]},
  .arena-study .${home["league-section"]},
  .arena-study .${home["home-tools"]},
  .arena-study .${home["archive-zone"]} {
    padding-block: 0;
  }
  .arena-study .${home["clubhouse-court"]} {
    background: transparent;
    border: 0;
    min-height: 23rem;
  }
  .arena-study[data-arena-ready="true"] .${home["clubhouse-court"]} > img { opacity: 0; }
  .arena-study .${home["arena-strip"]} { opacity: .88; }
  .arena-study .${home["teams-zone"]}::before { content: none; }
  .arena-study .${home["teams-zone"]} { border: 0; }
  .arena-study .${home["directory-heading"]} { border-top: 1px solid var(--gh-border); padding-top: var(--gh-s12); }
  .arena-study .${home["live-grid"]} { gap: var(--gh-s12); }
  .arena-study .${card.card} { background: none; border: 0; border-radius: 0; box-shadow: none; padding: 0; }
  .arena-study .${heading.title}, .arena-study .${home["section-head"]} h2,
  .arena-study .${home["directory-heading"]} h2 { font-size: var(--arena-section); font-weight: 700; }
  .arena-study .${heading.eyebrow}, .arena-study .${home["section-eyebrow"]},
  .arena-study .${home["feature-season"]}, .arena-study .${home["desk-eyebrow"]},
  .arena-study .${home["desk-label"]}, .arena-study .${roster.label} {
    text-transform: none; letter-spacing: normal; font-family: var(--gh-font-body); font-size: var(--gh-text-sm); font-weight: 400;
  }
  .arena-study .${home["face-card"]}, .arena-study .${home["face-card"]}:hover {
    border: 0; background: none; box-shadow: none; transform: none;
  }
  .arena-study .${home["face-link"]} { padding: 0 var(--gh-s4) 0 0; }
  .arena-study .${home["faces-strip"]} { gap: var(--gh-s6); padding-block: var(--gh-s6); }
  .arena-study .${roster.total} { font-size: clamp(var(--gh-s12), 5vw, var(--gh-s16)); }
  .arena-study .${roster.meta}, .arena-study .${roster.rank} { font-size: var(--gh-text-sm); }
  .arena-study .${notebook.rows} { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); column-gap: var(--gh-s12); }
  .arena-study .${notebook.row}:first-child { grid-row: span 2; align-content: start; padding-top: var(--gh-s4); }
  .arena-study .${notebook.row}:first-child h3 { font-size: var(--gh-text-lg); }
  .arena-study .${spotlight.layout} { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: var(--gh-s12); }
  .arena-study .${home["wire-item"]} { border-left: 0; border-top: 1px solid var(--gh-border); padding: var(--gh-s4) 0; }
  .arena-study .${home["home-tools-layout"]} > div { padding: var(--gh-s6) 0; border-top: 1px solid var(--gh-border); }
  .arena-study .${home["archive-preview"]} { border-top: 1px solid var(--gh-border); }
  .arena-study .${reveal.reveal} { opacity: 1; transform: none; animation: none; }
  @media(max-width: 40rem) {
    .arena-study .${home.wrap} { padding-inline: var(--gh-s4); width: calc(100% - var(--gh-s8)); }
    .arena-study .${home["opening-zone"]} > .${home.wrap} { width: 100%; }
    .arena-study .${home["clubhouse-court"]} { min-height: 0; width: 100%; aspect-ratio: 16 / 9; }
    .arena-study .${home["team-desk"]} { padding: var(--gh-s4); }
    .arena-study .${home["weekly-zone"]}, .arena-study .${home["teams-zone"]},
    .arena-study .${home["league-section"]}, .arena-study .${home["home-tools"]},
    .arena-study .${home["archive-zone"]} { padding-block: 0; }
    .arena-study .${notebook.rows}, .arena-study .${spotlight.layout} { grid-template-columns: minmax(0, 1fr); gap: var(--gh-s4); }
    .arena-study .${notebook.row}:first-child { grid-row: auto; }
    .arena-study .${home["live-grid"]} { gap: var(--gh-s8); }
    .arena-study .${home["directory-heading"]} { padding-top: var(--gh-s8); }
    .arena-study .${home["section-head"]} { flex-direction: column; align-items: flex-start; gap: var(--gh-s3); }
  }
`;

// Match the existing nested module selectors without changing their source.
export const presentation = rules.replaceAll(".arena-study .", ".arena-study [data-courtside-home] .")
  .replace(`[data-courtside-home] .${home.surface}`, `[data-courtside-home].${home.surface}`)
  .concat(`.arena-study[data-arena-ready="true"] [data-courtside-home] .${home["clubhouse-court"]} { background: transparent; }`);
