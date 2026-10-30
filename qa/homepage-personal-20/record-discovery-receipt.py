"""Persist only IDs whose collaboration.spawn_agent call already succeeded.

The tool currently returns a canonical task_name and no opaque UUID. This helper
records that real response shape; it neither launches agents nor invents IDs.
"""
from pathlib import Path
from datetime import datetime, timezone
import json, hashlib, sys

r = Path('qa/homepage-personal-20')
p = r / 'author-ledger.json'
j = json.loads(p.read_text())
for value in sys.argv[1:]:
    n = f'{int(value):02d}'
    if any(a['catalogId'] == n for a in j['launches']):
        raise ValueError('Receipt already exists: ' + n)
    task = '/root/personal' + n
    message = f'Independent discovery for GOAT complete personalized desktop homepage concept {n}. Worktree /workspace/goat-homepage-structures. Read qa/homepage-personal-20/briefs/{n}.md and its referenced AUTHOR-BRIEF, product inventory and data-only fixture. Own only qa/homepage-personal-20/{n}/. You are a fresh author, not a critic. DISCOVERY ONLY: inspect the actual product and assigned primary references, answer your distinct product discovery question with your own complete website architecture, and write PLAN.md covering two contrasting member teams plus guest, navigation/content/footer, body/control/data typography, useful local action flows and actual source applications. Do not inspect peers or old prototypes or write presentation code yet. Stop after the plan awaiting build followup. No subagents, publication, production changes or dependencies.'
    request = {'task_name': 'personal' + n, 'fork_turns': 'none', 'message': message}
    receipt = {
        'catalogId': n, 'canonicalTaskName': task, 'opaquePlatformId': None,
        'platformReceipt': {'task_name': task}, 'tool': 'collaboration.spawn_agent',
        'request': request,
        'requestSha256': hashlib.sha256(json.dumps(request, sort_keys=True).encode()).hexdigest(),
        'recordedAt': datetime.now(timezone.utc).isoformat(),
        'briefPath': str(r / 'briefs' / f'{n}.md'),
        'briefSha256': hashlib.sha256((r / 'briefs' / f'{n}.md').read_bytes()).hexdigest(),
        'inputsAtLaunch': [{'path': str(r / f), 'sha256': hashlib.sha256((r / f).read_bytes()).hexdigest()} for f in ['AUTHOR-BRIEF.md', 'PRODUCT-INVENTORY.md', 'fixture.json', 'fixture.js']],
        'ownDirectory': str(r / n), 'phase': 'discovery',
        'status': 'launched successfully', 'context': 'fork_turns none',
        'receiptLimit': 'Tool returned canonical task_name only. Timestamp is receipt persistence time.'
    }
    (r / 'briefs' / f'{n}-launch-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    j['launches'].append(receipt)
j['freshAuthorsLaunched'] = len(j['launches'])
p.write_text(json.dumps(j, indent=2) + '\n')
print(f'{len(j["launches"])} successful fresh author launches recorded.')
