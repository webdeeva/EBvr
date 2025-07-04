import React from 'react';
import EnhancedAvatar from './EnhancedAvatar';
import TestAvatar from './TestAvatar';

interface AvatarWithVoiceStateProps {
  avatarUrl: string;
  position: [number, number, number];
  cameraMode: 'normal' | 'zoom' | 'birdseye';
  userName: string;
}

const AvatarWithVoiceState: React.FC<AvatarWithVoiceStateProps> = ({ 
  avatarUrl, 
  position, 
  cameraMode, 
  userName 
}) => {
  if (avatarUrl === 'test-box') {
    return <TestAvatar position={position} />;
  }

  return (
    <EnhancedAvatar 
      avatarUrl={avatarUrl}
      position={position}
      cameraMode={cameraMode}
      userName={userName}
    />
  );
};

export default AvatarWithVoiceState;