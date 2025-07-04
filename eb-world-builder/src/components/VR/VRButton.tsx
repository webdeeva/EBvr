import React, { useEffect, useState } from 'react';
import { Headset } from 'lucide-react';

const VRButton: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check WebXR support
    if ('xr' in navigator && navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(setIsSupported);
    }
  }, []);

  if (!isSupported) {
    return null;
  }

  // Just show VR support indicator
  return (
    <div
      className="btn-glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'default'
      }}
    >
      <Headset size={14} />
      <span>VR Ready</span>
    </div>
  );
};

export default VRButton;