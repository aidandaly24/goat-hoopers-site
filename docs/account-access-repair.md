# Account access repair

The enrollment-only login omitted recovery, and reset/settings routes required
full provider activation. Existing-team confirmation looked like ordinary login.
The repair exposes account lifecycle with either flag and labels old-password
confirmation explicitly. Registration and optional team claim are separate.

Each account chooses a unique normalized non-email username, independent of its
team name. Individual identity is the verified provider subject; optional league
membership maps that subject one-to-one to the existing SiteUser UUID. The game
owner owns personal score persistence and League/Everyone filtering. Team and
paid AI authorization keep the existing linked UUID, valid-team checks and atomic
admission. No game/reward/AI source is modified here.

The existing membership constraints handle single ownership: subject primary key,
unique linked UUID and unique team ID. Claim checks session/email inside the same
transaction as invitation consumption; no transfer or reclaimed code exists.
A fresh legacy session may link the original owner's UUID without a code.
Unclaimed accounts may register, verify, log in and reset/change their password.
They receive no team or paid AI privileges merely by registering.

## Required rollout work

Review and apply only the additive `db/friends-auth/0001_account_usernames.sql`
index after checking existing lowercase username duplicates and a recoverable
backup. It is not a broad schema push. Stop on duplicates for explicit owner
resolution; source never renames/deletes existing users. Original auth tables,
app IDs, score rows and AI counters remain. Existing private mail/provider settings
and the earlier additive auth schema are still required. Root owns source review,
merge and the coordinated full-flag deployment; users enter passwords privately.

## Validation

Focused tests cover exact registration/claim/recovery inputs, same-origin/size/
rate boundaries, real pinned-provider password lifecycle, and username syntax/
normalization. The explicit existing localhost PostgreSQL CI smoke applies both
reviewed account SQL files, verifies case-insensitive uniqueness rollback, checks
unclaimed recovery, and blocks two claim transactions to prove one winner plus
replay/alternate-code denial. Ordinary tests keep database opt-ins off.

Local TypeScript and focused offline tests run before publication. Local browser
navigation verified login to reset on the real Next app with synthetic config.
No user credentials or real reset email were submitted. Local PostgreSQL is
unavailable, so normal CI supplies the actual database proof. Library denied the
three supplied screenshot downloads (HTTP 403); no image-specific or physical
phone assertion is made.

## Complexity boundary

Essential work is independent personal identity, private recovery and one-owner
team admission. Better Auth and PostgreSQL provide sessions and locking. The
accidental complexity removed is flag-gated recovery and ambiguous confirmation.
The legacy proof is a bounded transition, retained only for original-owner linking.
There is no new service, provider, queue, account-copy migration or reward system.
