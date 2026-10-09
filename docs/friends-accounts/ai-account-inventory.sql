-- PRIVATE READ-ONLY. Run only if account-inventory.sql confirms this table exists.
-- Enumerates undeclared app-user references in draft #117's budget JSON.
-- Does not output state, prompts, tokens, fingerprints or credentials.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
WITH owners AS (
  SELECT 'users' AS source, jsonb_object_keys(state -> 'users') AS user_id
  FROM ai_decider_control
  UNION ALL
  SELECT 'leases', item ->> 'userId'
  FROM ai_decider_control, jsonb_array_elements(state -> 'leases') AS item
  UNION ALL
  SELECT 'duplicates', item ->> 'userId'
  FROM ai_decider_control, jsonb_array_elements(state -> 'duplicates') AS item
)
SELECT o.source, o.user_id, u.id IS NOT NULL AS known_owner, count(*) AS owner_references
FROM owners o LEFT JOIN site_users u ON u.id::text = o.user_id
GROUP BY o.source, o.user_id, u.id ORDER BY o.source, o.user_id;
COMMIT;
