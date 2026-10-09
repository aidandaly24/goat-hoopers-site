---
name: goat-hoopers-design
description: Design or review Goat Hoopers UI in aidandaly24/goat-hoopers-site and its worktrees, using the selected design decisions and surface-specific evidence. Applies only to this project.
---

# Goat Hoopers design

Use this skill only in this repository or its worktrees. Read the current
[DESIGN.md](../../../DESIGN.md) as the visual decision record, together with
the repository instructions. Inspect the affected surface and shared primitives
at the working revision; old audit notes and prototypes are not current runtime
proof. Resolve its ownership before proposing shared changes.
If current ownership cannot be checked, mark it unresolved and limit output
to a bounded proposal.

Load only the reference needed for the task:

- Composition, color roles or density: [visual hierarchy](references/visual-hierarchy.md).
- Destinations, responsive chrome, controls or access: [navigation and accessibility](references/navigation-accessibility.md).
- Transitions, ticker or optional 3D: [motion](references/motion.md).

For the affected surface, state its user question, primary action, relevant
states, narrow layout and forbidden patterns. Preserve confirmed design choices
and working functionality. Distinguish the requested change from adjacent
owner work; recommendations in DESIGN.md do not authorize a broad migration.

Return the smallest useful proposal or patch, its concrete interaction path,
and evidence bound to the revision. Separate implemented behavior, proposed
rules and unverified checks. Update DESIGN.md only when a decision changes;
keep values and product rules there rather than duplicating them in this skill.
