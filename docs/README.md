# Documentation

Start with the maintained guides below. This directory also holds operational
notes and dated review evidence; it is browsed directly in the repository.

## Maintained guides

- [Architecture](../ARCHITECTURE.md) — contributors: repository map, domain/data/surface boundaries and application contracts.
- [Design](../DESIGN.md) — designers and UI contributors: selected Paper + Slate direction, shared tokens and review rules.
- [Contributing](../CONTRIBUTING.md) — contributors: branch workflow, supported runtime and development/CI commands.
- [Project rules](../AGENTS.md) — agents and contributors: house rules to read before editing.

## Price history

- [Correction and publication review](price-history-repair.md) — operators and reviewers: offline preparation, backup/plan checks and separately approved publication. Recorded audit counts are a baseline, not authorization for a production repair.
- [Quote and detail queries](quote-history-queries.md) — data contributors: bounded read shapes, query fixtures and measured transfer limits. Evidence is revision-specific; check current code for the detail-sampling policy.
- [Source data](../data/README.md) — data contributors and reviewers: frozen input provenance, scoring, coverage and reconstruction limitations.

## QA harness instructions

These READMEs explain how to run existing checks and what each fixture can prove.
Use their stated prerequisites and limitations; synthetic fixtures do not establish
hosted behavior or physical-device coverage.

- [Homepage sorting](../qa/homepage-sorting/README.md) — UI reviewers: directory/standings controls and the actual split-column layout.
- [Newsroom](../qa/newsroom/README.md) — UI reviewers: synthetic stories, reader links, native dialogs and navigation limits.
- [Paper + Slate](../qa/paper-slate/README.md) — UI reviewers: component palette, responsive states and recovery fixtures.
- [Shared shell](../src/test/site-shell/README.md) — navigation contributors: headers, anchors, mobile clearance and Next Back restoration.
- [Stock inspector](../src/test/stock-inspector/README.md) — Stocks contributors: board alignment, detail states, keyboard dismissal and focus.
- [Live ticker](../src/test/live-ticker/README.md) — ticker contributors: injected clock/slate polling and expiry checks.
- [Arcade](../src/test/arcade/README.md) — game reviewers: public discovery, touch/keyboard controls and asset/fallback paths.
- [Trade analyzer](../src/surfaces/trade-analyzer/__tests__/README.md) — trade-tool contributors: URL state, real Next navigation and clipboard checks.
- [3D viewers](../src/three/__tests__/README.md) — viewer contributors: effect tests, mounted fixtures and WebGL failure/recovery checks.

## Historical review evidence

These reports record particular revisions and their acceptance limits. They are
historical evidence, not current setup instructions or proof of the current
release. Consult the linked issue/PR for ongoing review status.

- [Arcade assessment](arcade-discovery-assessment.md) — reviewers: rationale and scope of the public-access repair.
- [Arcade QA](arcade-discovery-qa.md) — reviewers: dated discovery/access regression evidence.
- [Free-throw practice QA](free-throw-practice-qa.md) — reviewers: dated gameplay, asset and integration checks.
- [Homepage sorting QA](homepage-sorting-qa.md) — reviewers: reproduced sorting behavior and verification limits.
- [Newsroom design review](newsroom-design-review.md) — reviewers: editorial scope, decisions and recorded reader checks.
- [Paper + Slate QA](paper-slate-palette-qa.md) — reviewers: selected-palette migration and fixture evidence.
- [Shared shell QA](shared-shell-qa.md) — reviewers: header/Stocks diagnosis, repair and acceptance record.
- [Stocks discovery QA](stocks-chart-discovery-qa.md) — reviewers: chart entry points and inspection evidence, separate from pricing accuracy.
- [Trophy Room artwork QA](trophy-room-embroidered-qa.md) — reviewers: approved embroidered artwork provenance and rendered checks.
