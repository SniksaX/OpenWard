# OpenWard backend

Go API (`module openward`) using `database/sql` + SQLite and `net/http` ServeMux.

## Upgrading

Databases created before the `peers.user_id` foreign key was added are **not**
migrated by `CREATE TABLE IF NOT EXISTS`. Recreate the file:

```bash
# stop the API first
rm -f database.db database.db-wal database.db-shm
# or, if using a custom path:
rm -f "$DB_PATH" "$DB_PATH"-wal "$DB_PATH"-shm
```

Then start the server again so it recreates `users` and `peers` (with
`REFERENCES users(id) ON DELETE SET NULL`) and optionally seeds the bootstrap
admin from `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
