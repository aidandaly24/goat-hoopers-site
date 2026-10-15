import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CourtsideDialog } from "./CourtsideDialog";

describe("matchup notes reading surface", () => {
  it("gives the native modal a visible, programmatically associated title and retains its content", () => {
    const html = renderToStaticMarkup(<CourtsideDialog label="Matchup notes" title="Synthetic A vs Synthetic B">
      <p>Saved model probabilities: 62% and 38%.</p>
    </CourtsideDialog>);
    const titleId = html.match(/<dialog[^>]*aria-labelledby="([^"]+)"/)?.[1];
    expect(titleId).toBeTruthy();
    expect(html).toContain(`<h2 id="${titleId}">Synthetic A vs Synthetic B</h2>`);
    expect(html).toContain("Saved model probabilities: 62% and 38%.");
    expect(html).toContain('aria-label="Close matchup notes"');
    expect(html.match(/type="button"/g)).toHaveLength(2);
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:\s|=|>)/);
  });

  it("keeps title associations unique when more than one reader is composed", () => {
    const html = renderToStaticMarkup(<>
      <CourtsideDialog label="First notes" title="First matchup">First content</CourtsideDialog>
      <CourtsideDialog label="Second notes" title="Second matchup">Second content</CourtsideDialog>
    </>);
    const ids = [...html.matchAll(/<dialog[^>]*aria-labelledby="([^"]+)"/g)].map(match => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(html).toContain(`<h2 id="${id}">`);
  });
});
