# Fix Save Error

The "infinite recursion detected in policy" error is caused by Row Level Security policies in Supabase. To fix this:

## Steps to Fix

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Click on "SQL Editor" in the left sidebar

2. **Run the Fix Script**
   - Copy the entire contents of `supabase/fix-policies.sql`
   - Paste it into the SQL Editor
   - Click "Run" button

3. **Verify the Fix**
   - Try saving a world again
   - Check the browser console for any errors

## What This Fixes

- Removes recursive policy checks that were causing the infinite loop
- Simplifies policies to avoid cross-table recursion
- Maintains security while allowing proper access

## Alternative Quick Fix

If you need to save immediately and don't care about security temporarily:

```sql
-- TEMPORARY: Disable RLS (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE public.worlds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_assets DISABLE ROW LEVEL SECURITY;
```

But make sure to re-enable it and fix the policies properly later!