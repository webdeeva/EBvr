# Fix World Save Issue

The world save is failing with a 500 error. This is likely due to a foreign key constraint issue where the `worlds` table references `profiles(id)`, but your user might not have a profile yet.

## Solution

Run the following SQL script in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/fix-save-with-profile.sql`
4. Execute the script

This script:
- Updates the save_world function to automatically create a profile if it doesn't exist
- Ensures the foreign key constraint is satisfied
- Adds a policy to allow users to create their own profile

## What the fix does:

1. Checks if the user has a profile
2. If not, creates one automatically using their email or user ID
3. Then saves the world normally

## Test it:

1. After running the SQL script
2. Try saving a world again
3. It should work without the 500 error

## If you still get errors:

Check the browser console and look for the specific error message. Common issues:

- **"relation does not exist"** - A required table is missing
- **"permission denied"** - RLS policies need updating
- **"foreign key violation"** - Profile creation failed

The fix-save-with-profile.sql script should handle all of these cases.