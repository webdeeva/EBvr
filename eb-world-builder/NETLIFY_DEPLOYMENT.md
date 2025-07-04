# Netlify Deployment Guide

## Environment Variables to Add in Netlify Dashboard

Go to Site Settings > Environment Variables and add:

### AWS S3 Configuration
- `REACT_APP_AWS_ACCESS_KEY_ID` - Your AWS access key
- `REACT_APP_AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `REACT_APP_AWS_REGION` - us-east-2
- `REACT_APP_AWS_BUCKET_NAME` - eb-world-builder-assets

### Supabase Configuration
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### LiveKit Configuration
- `REACT_APP_LIVEKIT_URL` - wss://ebvr-uvi2ou7r.livekit.cloud

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Netlify configuration"
   git push origin master
   ```

2. **Connect to Netlify**
   - Log in to Netlify
   - Click "Add new site" > "Import an existing project"
   - Connect your GitHub account
   - Select your repository
   - Keep the default build settings (they'll use netlify.toml)

3. **Add Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add all variables listed above

4. **Deploy**
   - Netlify will automatically deploy
   - Your site will be available at: https://[your-site-name].netlify.app

## Important Notes

- Your Supabase Edge Functions will continue to work as they're hosted on Supabase
- The LiveKit token generation will still go through your Supabase Edge Function
- Make sure your S3 bucket CORS is configured to allow your Netlify domain
- Update your Supabase Auth settings to include your Netlify URL in:
  - Allowed redirect URLs
  - Site URL (if needed)

## Post-Deployment

1. Test voice chat functionality
2. Test file uploads to S3
3. Test authentication flow
4. Update your S3 CORS if needed to include your Netlify domain

## Custom Domain (Optional)

If you want to use a custom domain:
1. Go to Domain Settings in Netlify
2. Add your custom domain
3. Update DNS records as instructed
4. Update all service configurations (Supabase, S3 CORS) to include your custom domain