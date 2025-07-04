import React from 'react';
import VoiceChat from './VoiceChat';
import { getToken } from '../utils/livekitToken';

interface VoiceChatWrapperProps {
  roomName: string;
  userName: string;
  minimal?: boolean;
}

const VoiceChatWrapper: React.FC<VoiceChatWrapperProps> = ({ roomName, userName, minimal }) => {
  const [token, setToken] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const fetchToken = async () => {
      try {
        const newToken = await getToken(roomName, userName);
        if (!cancelled) {
          setToken(newToken);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to get voice chat token');
          console.error('Token fetch error:', err);
        }
      }
    };

    fetchToken();

    return () => {
      cancelled = true;
    };
  }, [roomName, userName]);

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        padding: '12px',
        background: 'rgba(255, 59, 48, 0.1)',
        border: '1px solid rgba(255, 59, 48, 0.3)',
        borderRadius: '6px',
        color: '#ff6b6b',
        fontSize: '13px'
      }}>
        Voice chat unavailable: {error}
      </div>
    );
  }

  if (!token) {
    return null; // Loading state
  }

  return <VoiceChat roomName={roomName} userName={userName} token={token} minimal={minimal} />;
};

export default VoiceChatWrapper;