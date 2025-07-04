# Supabase Edge Functions Setup

## Deploy LiveKit Token Function

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Initialize Supabase (if not already done):
```bash
supabase init
```

4. Link to your project:
```bash
supabase link --project-ref mvsjkhswkpefxssnyijs
```

5. Set the environment variables:
```bash
supabase secrets set LIVEKIT_API_KEY=APIHDURKA9gDnHs
supabase secrets set LIVEKIT_API_SECRET=EzVDVWuAefk2RXeEQlnGhJlTVqXZBmzUU25lmE3WahJB
```

6. Deploy the function:
```bash
supabase functions deploy livekit-token
```

7. The function will be available at:
```
https://mvsjkhswkpefxssnyijs.supabase.co/functions/v1/livekit-token
```

## Testing the Function

```bash
curl -X POST https://mvsjkhswkpefxssnyijs.supabase.co/functions/v1/livekit-token \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"roomName": "test-room", "participantName": "Test User"}'
```