# Fix for Worlds Not Showing in Dashboard

## Problem
Saved worlds are not appearing in the dashboard due to a foreign key constraint issue. The `worlds` table references `profiles(id)`, but users might not have a profile created.

## Solution

### Step 1: Run the Profile Fix SQL
Execute the SQL script in `supabase/fix-save-with-profile.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/fix-save-with-profile.sql`
4. Execute the script

This will:
- Update the save_world function to automatically create a profile if it doesn't exist
- Add a policy to allow users to create their own profile
- Ensure the foreign key constraint is satisfied

### Step 2: Clear Browser Cache
1. Open Developer Tools (F12)
2. Go to Application/Storage
3. Clear Local Storage and Session Storage
4. Refresh the page

### Step 3: Verify
1. Create a new world or update an existing one
2. Save it
3. Navigate to the dashboard
4. Your worlds should now appear

## What This Fixes
- Ensures every authenticated user has a profile entry
- Satisfies the foreign key constraint between worlds and profiles
- Allows the dashboard query to properly fetch user's worlds

## Additional Debugging
If worlds still don't appear:
1. Check the browser console for errors
2. Look for "Loaded my worlds:" log message
3. Verify the user ID matches between auth.users and profiles tables in Supabase