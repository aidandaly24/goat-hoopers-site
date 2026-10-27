import home from "@/surfaces/season-hub/CourtsideHome.module.css";
import reveal from "@/surfaces/season-hub/Reveal.module.css";

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
  .arena-study .${home["opening-zone"]} > .${home.wrap} {
    padding-block: var(--gh-s6);
    background: transparent;
  }
  .arena-study .${home["header-edition"]},
  .arena-study .${home["stale-note"]} { margin: 0; width: 100%; border: 0; }
  .arena-study .${home["feature-heading"]} { padding-top: var(--gh-s4); }
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
    border-top-color: var(--gh-accent);
  }
  .arena-study .${home["weekly-zone"]} > .${home.wrap},
  .arena-study .${home["teams-zone"]} > .${home.wrap},
  .arena-study .${home["league-section"]} > .${home.wrap},
  .arena-study .${home["archive-zone"]} > .${home.wrap} {
    padding-block: var(--gh-s8);
  }
  .arena-study .${home["weekly-zone"]},
  .arena-study .${home["teams-zone"]},
  .arena-study .${home["league-section"]},
  .arena-study .${home["home-tools"]},
  .arena-study .${home["archive-zone"]} {
    padding-block: var(--gh-s8);
  }
  .arena-study .${home["clubhouse-court"]} {
    background: transparent;
    border: 1px solid var(--gh-border);
    min-height: 23rem;
  }
  .arena-study[data-arena-ready="true"] .${home["clubhouse-court"]} > img { opacity: 0; }
  .arena-study .${home["arena-strip"]} { opacity: .88; }
  .arena-study .${home["teams-zone"]}::before { content: none; }
  .arena-study .${reveal.reveal} { opacity: 1; transform: none; animation: none; }
  @media(max-width: 40rem) {
    .arena-study .${home.wrap} { padding-inline: var(--gh-s4); width: calc(100% - var(--gh-s8)); }
    .arena-study .${home["opening-zone"]} > .${home.wrap} { width: 100%; }
    .arena-study .${home["clubhouse-court"]} { min-height: 0; width: 100%; aspect-ratio: 16 / 9; }
    .arena-study .${home["team-desk"]} { padding: var(--gh-s4); }
    .arena-study .${home["weekly-zone"]}, .arena-study .${home["teams-zone"]},
    .arena-study .${home["league-section"]}, .arena-study .${home["home-tools"]},
    .arena-study .${home["archive-zone"]} { padding-block: var(--gh-s4); }
  }
`;

// Match the existing nested module selectors without changing their source.
export const presentation = rules.replaceAll(".arena-study .", ".arena-study [data-courtside-home] .")
  .replace(`[data-courtside-home] .${home.surface}`, `[data-courtside-home].${home.surface}`)
  .concat(`.arena-study[data-arena-ready="true"] [data-courtside-home] .${home["clubhouse-court"]} { background: transparent; }`);
