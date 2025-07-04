# Persist User Uploads Guide

This guide explains how to enable persistent uploads across worlds for authenticated users.

## Problem
Previously, uploaded skyboxes, environments, and content were only stored in the component's local state, meaning they would be lost when creating a new world or refreshing the page.

## Solution
We've implemented a database-backed solution that stores upload metadata and automatically loads user uploads in any world they create.

## Database Setup

1. **Run the SQL script** in your Supabase SQL editor:
   ```sql
   -- Execute the contents of supabase/create-user-uploads-table.sql
   ```

   This creates:
   - `user_uploads` table to store upload metadata
   - Proper indexes for performance
   - Row Level Security policies
   - Triggers for timestamp updates

2. **Verify the table was created**:
   - Go to your Supabase dashboard
   - Navigate to Table Editor
   - Confirm `user_uploads` table exists

## How It Works

### Upload Flow
1. User uploads a file (skybox, environment, or content)
2. File is uploaded to S3
3. If user is authenticated, metadata is saved to `user_uploads` table
4. Upload appears in all worlds created by that user

### Load Flow
1. When WorldBuilder component mounts
2. If user is authenticated, it queries `user_uploads` table
3. Loads all user's skyboxes, environments, and content
4. Items appear in respective pickers/browsers

## Features

- **Automatic Loading**: Uploads appear in all your worlds
- **Type Organization**: Uploads are categorized by type (skybox, environment, content)
- **Metadata Storage**: Stores file size, mime type, upload date
- **Guest Support**: Guests can still upload, but uploads won't persist
- **Security**: Row Level Security ensures users only see their own uploads

## Testing

1. Sign in to your account
2. Upload a skybox in one world
3. Create a new world or refresh the page
4. Open the skybox manager - your uploads should appear
5. Same applies for environments and content

## Note for Existing Users

Uploads made before this update won't appear in the database. Only new uploads after running the SQL script will be persisted.