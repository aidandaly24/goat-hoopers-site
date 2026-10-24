# Free Throw Week 1 worker installation

The installed workflow is `.github/workflows/arcade-reconcile.yml`. The original
example remains as historical design evidence. Installing source alone does not
enable it: its job requires main and `GOAT_ARCADE_WORKER_ENABLED=1`. Before that
variable is set, the existing authorized operator must configure the dedicated
`arcade-production` Actions environment with a main-only deployment-branch policy
and its `GOAT_ARCADE_RECONCILE_TOKEN` environment secret. Use the same one private
random token stored in Vercel Production, never a commissioner or cron secret.
Do not print it, put it in a workflow body or create an additional credential.

The worker has no GitHub permissions, checkout, dependencies or artifacts. One
non-overlapping job runs every five minutes off the hour and sends only an empty
POST to the fixed production reconciliation endpoint. Source and database guards
remain authoritative. The fixed October 20–27 UTC authorization interval matches
the reviewed Week 1 design; expiry is not silently renewed. It is not an ongoing
Week 2 calendar or a reward worker. Rewards stay off.

An operator must separately attest the deployed database/calendar, compare the
existing ranked schema before applying the reviewed additive migration, confirm
the sourced fixture assignment, and enable the existing runtime and reconciler
settings before the first authorized reconciliation. Readiness requires a fresh
accepted source receipt and an actually open period, not merely a 200 response.
Verify the first worker run and its subsequent freshness, then use normal signed-in
gameplay to save a real round and inspect weekly/all-time boards. Do not insert
a test result, fabricate input as a human score or backdate a round.

A client timeout does not prove rollback: an admitted transaction may commit
after its final SQL authorization check, even after the cutoff. Inspect retained
state before retrying any uncertain write. Revocation disables the worker variable
and server flag/token configuration with deployment; retain all competition data.
Environment setup and enabling remain operational actions, not consequences of
merging this source.
