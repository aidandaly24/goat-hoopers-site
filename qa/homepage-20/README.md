# Twenty independent homepage directions

User-authorized design round, October 29, 2026. This separate QA branch starts
from the preserved #271 benchmark `64b9971f88ad1f73f5bd00ac0fdef9019909561b`.
Neither that folder/captures nor production, Muse's Week2 content/3D work,
recap/Power, routes, credentials, dependencies or services are modified.

The user explicitly asked for 20 fresh-context authors and 20 homepage mocks.
We use 20 actual fresh-context agents in concurrency-limited batches. Every
author receives the same BRIEF, data and scope, with a different starting
composition hypothesis. Authors are instructed to remain blind to other
directions and previous mock pixels until first submissions. This is an
instruction boundary, not OS-enforced filesystem secrecy. Root authors the
shared data, gallery/capture/test infrastructure, not the 20 initial designs.

`author-ledger.json` records actual author tasks and submission hashes.
`inventory.json` is the common #271 fixture snapshot: real dated approved
identities/editorial, every current metric/news/model example synthetic.
`data.js` provides only data and string/money helpers; `base.css` provides only
existing tokens, fonts, reset and focus. No shared section renderer is supplied.
Every author's complete markup, layout and controls are independently authored.

Initial designs remain in `directions/NN/`. Shortlisted iterations will live
separately in `iterations/NN/`; a gallery will retain both and explain the changes.
Design preferences/critique are qualitative, not statistical proof.

Run using existing Python and browser dependencies:

```sh
python3 -m http.server 4198 --bind 127.0.0.1 --directory /absolute/path/to/repository
# http://127.0.0.1:4198/qa/homepage-20/index.html
```

These are browser-rendered static concepts with synthetic data. They do not
establish production Next routing, real auth/data, physical devices or spoken
screen-reader behavior, and do not authorize release. No merge/deploy.
