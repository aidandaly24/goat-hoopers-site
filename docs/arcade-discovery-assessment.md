# Arcade access repair

Boundary: the public catalogue and return/help controls for the existing
free-throw practice. One writer; a ten-manager league; release now. The
homepage, accounts, persistence, competition, assets and shot physics are
outside this change.

The user clarified that the iPhone complaint concerns finding the game.
The existing hub uses coming-soon competition status and account/store
availability to describe a working public practice route. That produces
"Not yet live", claim-team/bench prompts and Details instead of Play.
Separately, the court's opaque loading/error overlay sits above Back/help;
help text can enter the parent court's drag handler.
Screenshot review also exposed the shared header's ticker offset when the
ticker is absent. An Arcade-only selector removes that offset (including
Next.js's hidden metadata node); homepage chrome is unchanged.

| Kind | Evidence and decision |
| --- | --- |
| Essential | Advertise actual implementations, show a genuine preview, launch directly, and keep Back/help usable in every loading state. |
| Accidental | The catalogue's account/store gate and competition messaging obscure public practice. Remove that coupling with explicit optional `Game.play` metadata and `PlayableGame`. |
| Imported | Next.js routing/images, GLB downloads, WebGL and native touch events require real browser checks. Keep existing adapters and dependencies. |
| Transitional | Planned competitions remain in the registry/store but have no hub card until implemented. The parent owns their future activation; rewards stay closed. |
| Unknown | Physical iPhone/Safari performance is not established by desktop software WebGL or a cloud browser with WebGL disabled. Preserve that limitation in the handoff. |

The smallest design is a synchronous public catalogue filtered from the
registry, one scoped neutral canvas, one gameplay screenshot and one Play
link. No new service, cache, queue, storage or account flow is justified.
Back/help sit above the opaque overlay; HUD/help targets are excluded from
court pointer gestures. Existing physics and controls remain intact.

Existing touch input is drag-to-adjust then release-to-shoot: horizontal
movement aims, downward movement increases power and upward movement
decreases it. Holding/releasing the shoot button also works. It is not an
upward-flick velocity mechanic. A later, separately approved gesture could
map one upward drag distance to shot power while retaining button controls;
that is not required to restore discovery now.

Verification: offline rendering regression, exact-tree tests/typecheck,
changed-file lint, surface contracts, full build, loopback homepage →
Arcade → Play, mobile touch, and ready/loading/asset-error/WebGL-unavailable
return/help checks. Independent head review and CI precede parent merge.
