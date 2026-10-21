"""Offline source-feasibility diagnostic. Reads saved public receipts; performs no fetch/write upstream.

Inputs: 2025-drafts.json, startup-draft-picks.json, 2025-week{1..24}-events.json,
2025-final-rosters.json. Prints the replay and final membership reconciliation.
This is a producer handoff proof, not an application loader or valuation model.
"""
from pathlib import Path
from datetime import datetime, timezone
import json, sys

p = Path(sys.argv[1])
read = lambda name: json.loads((p/name).read_text())
picks = read('startup-draft-picks.json')
drafts = read('2025-drafts.json')
assert len(drafts) == 1 and drafts[0]['status'] == 'complete'
anchor = drafts[0]['last_picked']
raw = [x for week in range(1, 25) for x in read(f'2025-week{week}-events.json')]
rows = {}
for x in raw:
    prior = rows.get(x['transaction_id'])
    assert prior is None or x == prior, 'Conflicting source duplicate'
    rows[x['transaction_id']] = x
moves = sorted((x for x in rows.values() if x['status'] == 'complete'), key=lambda x: (x.get('status_updated') or x['created'], int(x['transaction_id'])))
owners = {}
for x in picks:
    assert str(x['player_id']) not in owners, 'Duplicate draft player'
    owners[str(x['player_id'])] = x['roster_id']
errors, applied, noops = [], [], []
for x in moves:
    at = x.get('status_updated') or x['created']
    adds, drops = x.get('adds') or {}, x.get('drops') or {}
    if at < anchor:
        if not adds and not drops:
            noops.append(x['transaction_id'])
            continue
        errors.append(dict(id=x['transaction_id'], reason='Player move predates completed draft'))
        continue
    before = dict(owners)
    bad = []
    # Every trade is atomic: validate/apply all drops before any additions.
    for player, roster in drops.items():
        if owners.get(player) != roster:
            bad.append(dict(drop=player, assertedOwner=roster, actualOwner=owners.get(player)))
        else:
            del owners[player]
    for player, roster in adds.items():
        if player in owners:
            bad.append(dict(add=player, assertedOwner=roster, actualOwner=owners[player]))
        else:
            owners[player] = roster
    if bad:
        errors.append(dict(id=x['transaction_id'], conflicts=bad))
        owners = before
    else:
        applied.append(x['transaction_id'])
diff = []
for roster in read('2025-final-rosters.json'):
    rid = roster['roster_id']
    source = set(roster.get('players') or [])
    replay = {player for player, owner in owners.items() if owner == rid}
    diff.append(dict(rosterId=rid, replayCount=len(replay), sourceFinalCount=len(source), exactMembersMatch=source == replay, onlyInReplay=sorted(replay-source), onlyInFinalSource=sorted(source-replay)))
print(json.dumps(dict(realPublicSources=True, leagueId='1282883196567977984', weeks=list(range(1, 25)), rawTransactions=len(raw), uniqueTransactions=len(rows), completed=len(moves), initialDraftPicks=len(picks), draftCompletedAt=datetime.fromtimestamp(anchor/1000, timezone.utc).isoformat(), preAnchorPickOnlyEvents=noops, appliedAfterAnchor=len(applied), ownershipConflicts=errors, finalRosterReconciliation=diff, scope='Feasibility diagnostic only. Source final rosters are not independently dated daily anchors. No historical prices calculated, source/provider state or database changed.'), indent=2))
assert not errors and all(x['exactMembersMatch'] for x in diff), 'Reconciliation incomplete; do not assert history'
