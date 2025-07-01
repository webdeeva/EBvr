import React, { useRef, useEffect, useState } from 'react';
import './ScreenShare.css';

interface ScreenShareProps {
  onClose: () => void;
}

const ScreenShare: React.FC<ScreenShareProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setIsSharing(true);
      
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsSharing(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="screen-share-overlay">
      <div className="screen-share-container glassmorphism-dark">
        <div className="screen-share-header">
          <h3>Screen Share</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="screen-share-content">
          {isSharing ? (
            <video 
              ref={videoRef} 
              autoPlay 
              className="screen-share-video"
            />
          ) : (
            <div className="screen-share-placeholder">
              <p>Share your screen with others in this world</p>
            </div>
          )}
        </div>
        
        <div className="screen-share-controls">
          {!isSharing ? (
            <button className="btn-primary" onClick={startScreenShare}>
              Start Sharing
            </button>
          ) : (
            <button className="btn-glass" onClick={stopScreenShare}>
              Stop Sharing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenShare;