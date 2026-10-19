# Account settings and contained team action

This is a controlled local rendering of the checked-out production
`AccountPage`, `TeamRoute`, password/email-login pages, `AccountForm`, and
their real shared header/footer/components. Synthetic source aliases replace
account, league and store reads. The fixture loads Inter/Geist from the site's
existing local Next build output. No Library transfer, production credential,
account operation or original-photo comparison is involved.

The async page functions are invoked in the fixture and their output is mounted
with React; Next headers/navigation and Link are explicitly shimmed. Native
fixture links and history are tested. This does not establish hosted Next
request/RSC behavior, live auth, physical-device or screen-reader acceptance.

## Observed problem and correction

The original account/team baseline is commit
`ee11ef690823188095c2710d4225cd92a18dcc44` (routing PR211).
Before captures show a full-width account card with no h1 and two bare links
at x=0, plus the team settings link outside the centered content. Those link
targets measured 20px high. Claim/password inspection also found underlined
20px account-help links. The `before-*-help` images capture that help navigation
before its styling correction, with the new account frame already present.
The final patch integrates main `6c95e4d9ead993c342740d0058aa9d01477aaf93`,
including its independently owned Table heading/navigation update. That shared
code is preserved; it is not part of this account/team patch.

The patch uses the existing Paper + Slate tokens, Card, SectionHeading and
neutral shared controls. Settings get a bounded page, account identity and
separate team/password rows; the team action lives in its identity card.
Account-help navigation uses the same quiet controls. Claims, password fields,
safe return values, endpoints and security payloads stay intact. Global styles,
shared tokens and homepage files are unchanged.

Surface contract: the question is “what is linked, and where can I manage it?”;
My Team is the linked account's primary destination. Linked, unclaimed and
enrollment-only states remain distinct. Narrow rows stack all actions. Bare
viewport-edge links, inline password forms for linked settings, invented team
data and page-local account/theme logic are excluded.

## Reproduce

```sh
npm run build
node qa/account-settings-visual/server.mjs
# In another terminal:
node qa/account-settings-visual/browser.mjs
node qa/account-settings-visual/audit-links.cjs
npm test -- src/app/account/page.test.tsx src/app/team/page.test.tsx --maxWorkers=1
npm run typecheck -- --incremental false
npm run check:contracts
```

The browser driver uses this executor's Chromium/Playwright installation paths.
The server binds loopback port 4181 and blocks no real app server. Stop that
fixture process after review. Do not run a build concurrently with browser
captures because the fixture reads fonts from generated build output.

## Evidence

- **12 focused page tests pass:** identity escaping/private-field omission,
  one linked h1/no password form, claim return preservation, account/team auth
  gates, existing flag visibility, missing-team and reward-error fallbacks.
- **68 rendered states pass:** 320/390/768/1440px; light/dark linked pages;
  unclaimed/enrollment/signed-out/disabled/error/loading states; partial,
  missing and empty roster values; nine account-form modes; long names; and
  separate 200% root-font enlargement at 1280px. This is text enlargement,
  not browser zoom and not a substitute for the separate 320px reflow cases.
- **Five interaction flows pass:** keyboard focus and hover feedback plus
  account → team → settings / native Back/Forward in both themes; synthetic
  claim/password pending-error flows; and signup completion. Password submission
  still carries `revokeOtherSessions: true`. API responses are fulfilled locally.
- All measured main-content link targets are at least **44.89px** high; label
  contrast against composited backgrounds is at least **5.15:1**. No horizontal
  overflow, underlined/default-blue main anchors, page errors or external
  requests occurred. This is not a site-wide contrast or all-state guarantee.
- Source inventory covers **146** production Link/anchor declarations. Only
  the shared header's callback links lack direct/ancestor classes at their
  declaration site; those receive the existing nav/panel descendant styles.
  The four original account/team bare declarations are removed. Other routes
  received source inspection only; this matrix does not claim to render them.

The final 68-state matrix and five interaction flows ran on the integrated
main base above. `browser.json` records the exact application `src` tree.
The earlier routing-only tests were not rerun for this presentation work.

Representative captures (all synthetic local application output):

| View | Before | After |
| --- | --- | --- |
| Account, desktop | [Before](evidence/before-account-1440.png) | [After](evidence/after-account-1440-light.png) |
| My Team, phone | [Before](evidence/before-team-390.png) | [After](evidence/after-team-390-light.png) |
| Account, phone | [Before](evidence/before-account-390.png) | [After](evidence/after-account-390-light.png) |

[Dark settings](evidence/after-account-1440-dark.png),
[long account name](evidence/long-account-320.png),
[200% text](evidence/text200-account-1280.png),
[password error](evidence/password-390.png),
[browser measurements](evidence/browser.json),
[source inventory](evidence/source-link-audit.json).

The exhausted original-image transfers remain closed. The correction follows
directly observed local application rendering under issue212's updated scope.
PR211 remains a separate routing change and has no dependency on this UI patch.
