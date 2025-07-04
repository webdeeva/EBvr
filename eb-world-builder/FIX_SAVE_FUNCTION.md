# Fix Save World Function Error

## Problem
The error "Could not find the function public.save_world(p_assets, p_owner_id, p_settings, p_world_id, p_world_name)" indicates a parameter order mismatch in the database function cache.

## Solution
Run the SQL script `supabase/fix-save-function.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/fix-save-function.sql`
4. Execute the script

This will:
- Drop any existing versions of the save_world function
- Recreate it with the correct parameter order
- Grant proper permissions

## Alternative: Direct Supabase CLI
If you're using Supabase CLI:
```bash
supabase db push supabase/fix-save-function.sql
```