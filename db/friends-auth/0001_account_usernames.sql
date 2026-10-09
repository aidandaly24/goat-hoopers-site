-- Additive account-only constraint. Review existing lower(name) duplicates before applying.
-- Do not rename, delete or merge accounts to make this migration pass automatically.
CREATE UNIQUE INDEX "auth_user_username_unique" ON "auth_user" (lower("name"));
