import React, { useEffect, useState } from 'react';
import { useXRStore } from '@react-three/xr';
import { Headset } from 'lucide-react';

const VRButton: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const enterVR = useXRStore((state) => state.enterVR);
  const exitVR = useXRStore((state) => state.exitVR);
  const isPresenting = useXRStore((state) => state.isPresenting);

  useEffect(() => {
    // Check WebXR support
    if ('xr' in navigator && navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(setIsSupported);
    }
  }, []);

  const handleVRToggle = () => {
    if (isPresenting) {
      exitVR();
    } else {
      enterVR();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      className={`btn-glass ${isPresenting ? 'active' : ''}`}
      onClick={handleVRToggle}
      title={isPresenting ? 'Exit VR' : 'Enter VR'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <Headset size={14} />
      <span>{isPresenting ? 'Exit VR' : 'Enter VR'}</span>
    </button>
  );
};

export default VRButton;