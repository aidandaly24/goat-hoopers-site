-- PRIVATE, READ-ONLY REVIEW AID. Not run by this task/build/CI.
-- Operator saves output outside the repo; never include hashes/tokens/passwords.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- Discover declared dependents; investigate any table absent from the inventory.
SELECT conrelid::regclass AS dependent_table, conname,
       pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'f' AND confrelid = 'site_users'::regclass
ORDER BY conrelid::regclass::text, conname;

-- Enumerate stable owner IDs and counts, including scoreless accounts.
SELECT u.id, u.team_id,
       (SELECT count(*) FROM sessions s WHERE s.user_id = u.id) AS sessions,
       (SELECT count(*) FROM game_scores s WHERE s.user_id = u.id) AS scores,
       (SELECT count(*) FROM rewards r WHERE r.user_id = u.id) AS rewards,
       (SELECT count(*) FROM invite_codes i WHERE i.used_by = u.id) AS used_invites
FROM site_users u ORDER BY u.id;

-- Each dependent row ID/owner is needed for exact before/after comparison.
SELECT id, user_id, game_id, week FROM game_scores ORDER BY id;
SELECT id, user_id, game_id, week FROM rewards ORDER BY id;
-- Invite code/token/password values are intentionally excluded.
SELECT used_by AS user_id, count(*) AS used_invites
FROM invite_codes WHERE used_by IS NOT NULL GROUP BY used_by ORDER BY used_by;
SELECT user_id, count(*) AS session_count FROM sessions GROUP BY user_id ORDER BY user_id;

-- All of these must return zero rows. Invite used_by has no declared FK.
SELECT 'game_scores' AS source, s.user_id FROM game_scores s
LEFT JOIN site_users u ON u.id = s.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'rewards', r.user_id FROM rewards r
LEFT JOIN site_users u ON u.id = r.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'sessions', s.user_id FROM sessions s
LEFT JOIN site_users u ON u.id = s.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'invite_codes', i.used_by FROM invite_codes i
LEFT JOIN site_users u ON u.id = i.used_by WHERE i.used_by IS NOT NULL AND u.id IS NULL;

-- Locate optional AI storage. Run the separate conditional query only if present.
SELECT to_regclass('public.ai_decider_control') AS ai_budget_table;
COMMIT;
