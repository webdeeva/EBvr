import React, { useEffect, useState, useCallback } from 'react';
import { Room, RoomEvent, Track, Participant, ConnectionState } from 'livekit-client';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import './VoiceChat.css';

// LiveKit configuration
export const LIVEKIT_URL = process.env.REACT_APP_LIVEKIT_URL!;

interface VoiceChatProps {
  roomName: string;
  userName: string;
  token: string;
  minimal?: boolean;
  onMuteChange?: (isMuted: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ roomName, userName, token, minimal = false, onMuteChange, onSpeakingChange }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Define toggleMute early so it can be used in useEffect
  const toggleMute = useCallback(async () => {
    if (!room) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    onMuteChange?.(newMutedState);
    
    // Emit custom event for overlay
    const event = new CustomEvent('voiceMuteChanged', { detail: { isMuted: newMutedState } });
    window.dispatchEvent(event);
    
    try {
      await room.localParticipant.setMicrophoneEnabled(!newMutedState);
      setAudioEnabled(!newMutedState);
    } catch (error) {
      console.error('Error toggling microphone:', error);
      // Revert state if failed
      setIsMuted(!newMutedState);
      onMuteChange?.(!newMutedState);
    }
  }, [room, isMuted, onMuteChange]);

  // Set up speaking detection
  useEffect(() => {
    if (!room || !room.localParticipant) return;

    const handleSpeakingChanged = () => {
      const speaking = room.localParticipant.isSpeaking;
      setIsSpeaking(speaking);
      onSpeakingChange?.(speaking);
      
      // Emit custom event for overlay
      const event = new CustomEvent('voiceSpeakingChanged', { detail: { isSpeaking: speaking } });
      window.dispatchEvent(event);
    };

    // Listen for speaking changes
    room.localParticipant.on('isSpeakingChanged', handleSpeakingChanged);

    return () => {
      room.localParticipant.off('isSpeakingChanged', handleSpeakingChanged);
    };
  }, [room, onSpeakingChange]);

  // Listen for toggleMute events
  useEffect(() => {
    const handleToggleMute = () => {
      toggleMute();
    };

    window.addEventListener('toggleMute', handleToggleMute);
    return () => {
      window.removeEventListener('toggleMute', handleToggleMute);
    };
  }, [toggleMute]);

  useEffect(() => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        simulcast: false,
      },
    });

    room.on(RoomEvent.Connected, () => {
      console.log('Connected to room:', room.name);
      setIsConnected(true);
      setParticipants(Array.from(room.remoteParticipants.values()));
    });

    room.on(RoomEvent.Disconnected, () => {
      console.log('Disconnected from room');
      setIsConnected(false);
    });

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity);
      setParticipants(prev => [...prev, participant]);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
      setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
    });

    room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
      console.log('Local track published:', publication.trackName);
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('Track subscribed:', track.kind, 'from', participant.identity);
      if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.play().catch(e => console.error('Error playing audio:', e));
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
      track.detach();
    });

    room.connect(LIVEKIT_URL, token, {
      autoSubscribe: true,
    }).then(() => {
      console.log('Room connection established');
      // Enable microphone
      room.localParticipant.setMicrophoneEnabled(true);
    }).catch(error => {
      console.error('Failed to connect to room:', error);
    });

    setRoom(room);

    return () => {
      room.disconnect();
    };
  }, [token]);

  if (minimal) {
    return (
      <button
        className="voice-toggle-btn"
        onClick={toggleMute}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: isMuted ? 'rgba(255, 59, 48, 0.9)' : 'rgba(0, 199, 60, 0.9)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
    );
  }

  return (
    <div className="voice-chat-container">
      <div className="voice-chat-header">
        <Volume2 size={16} />
        <span>Voice Chat {isConnected ? '• Connected' : '• Connecting...'}</span>
      </div>
      
      <div className="voice-participants">
        {participants.map((participant) => (
          <div key={participant.sid} className="voice-participant">
            <div className={`voice-indicator ${participant.isSpeaking ? 'speaking' : ''}`} />
            <span>{participant.name || participant.identity || 'Anonymous'}</span>
          </div>
        ))}
        {room?.localParticipant && (
          <div className="voice-participant">
            <div className={`voice-indicator ${room.localParticipant.isSpeaking ? 'speaking' : ''}`} />
            <span>{userName} (You)</span>
          </div>
        )}
      </div>
      
      <div className="voice-controls">
        <button
          className={`voice-control-btn ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
      </div>
    </div>
  );
};

export default VoiceChat;