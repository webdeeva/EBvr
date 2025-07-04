import React, { useState, useEffect } from 'react';
import { Mic, MicOff, VolumeX } from 'lucide-react';

interface VoiceButtonOverlayProps {
  user: any;
  onAuthPrompt: () => void;
}

const VoiceButtonOverlay: React.FC<VoiceButtonOverlayProps> = ({ user, onAuthPrompt }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const handleMuteChange = (event: CustomEvent<{ isMuted: boolean }>) => {
      setIsMuted(event.detail.isMuted);
    };

    const handleSpeakingChange = (event: CustomEvent<{ isSpeaking: boolean }>) => {
      setIsSpeaking(event.detail.isSpeaking);
    };

    window.addEventListener('voiceMuteChanged' as any, handleMuteChange);
    window.addEventListener('voiceSpeakingChanged' as any, handleSpeakingChange);

    return () => {
      window.removeEventListener('voiceMuteChanged' as any, handleMuteChange);
      window.removeEventListener('voiceSpeakingChanged' as any, handleSpeakingChange);
    };
  }, []);

  const handleClick = () => {
    if (user) {
      const event = new CustomEvent('toggleMute');
      window.dispatchEvent(event);
    } else {
      onAuthPrompt();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '74px', // Below the header
      right: '20px',
      zIndex: 101,
    }}>
      {!user ? (
        <button
          className="btn-glass disabled"
          onClick={handleClick}
          title="Sign in to use voice chat"
          style={{ height: '32px' }}
        >
          <VolumeX size={14} />
          <span>Voice</span>
        </button>
      ) : (
        <button
          className={`btn-glass ${isMuted ? 'muted' : ''} ${isSpeaking ? 'speaking' : ''}`}
          onClick={handleClick}
          title={isMuted ? 'Unmute' : 'Mute'}
          style={{ height: '32px' }}
        >
          {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
          <span>Voice</span>
        </button>
      )}
    </div>
  );
};

export default VoiceButtonOverlay;