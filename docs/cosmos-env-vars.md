# 小宇宙 Supabase Env Vars

Phase 3 is optional until you create a Supabase project.

Set these in Vercel when you are ready for long-term sync:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
COSMOS_ADMIN_TOKEN=a-long-random-admin-token
NEXT_PUBLIC_ENABLE_ADMIN=true
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed in client code.
- `COSMOS_ADMIN_TOKEN` is required for write requests to `/api/cosmos`.
- Keep `/admin` disabled for public sharing unless you are actively editing.
- For now, the app still works fully with localStorage when Supabase env vars are absent.
