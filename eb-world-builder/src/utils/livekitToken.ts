import { supabase } from '../config/supabase';

// Production-ready token generation using Supabase Edge Functions
export const getToken = async (roomName: string, participantName: string): Promise<string> => {
  try {
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User must be authenticated to join voice chat');
    }

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('livekit-token', {
      body: { roomName, participantName }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error('Failed to get voice chat token');
    }

    if (!data?.token) {
      throw new Error('Invalid token response');
    }

    return data.token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
};