import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { AccessToken } from 'https://esm.sh/livekit-server-sdk@2.13.1'

const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY')!
const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { roomName, participantName } = await req.json()
    
    if (!roomName || !participantName) {
      return new Response(
        JSON.stringify({ error: 'Room name and participant name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      ttl: '24h', // 24 hours
    })

    // Grant permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    // Generate JWT token
    const token = await at.toJwt()

    return new Response(
      JSON.stringify({ token }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error generating token:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate token' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})