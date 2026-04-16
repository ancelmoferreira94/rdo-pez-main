---
name: Storage fallback
description: localStorage fallback when Supabase connection unavailable
type: feature
---
The storage layer checks `isSupabaseReady()` before every operation.
If VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY are missing,
all CRUD operations fall back to localStorage keys: jpl-projects, jpl-diaries.
This prevents the blank page error on published builds where env vars might not be injected.
