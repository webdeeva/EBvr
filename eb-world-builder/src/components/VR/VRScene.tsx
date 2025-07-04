import React from 'react';
import { Interactive, useXR } from '@react-three/xr';
import { Box } from '@react-three/drei';

const VRScene: React.FC = () => {
  const { isPresenting, player } = useXR();

  if (!isPresenting) return null;

  return (
    <>
      {/* Simple teleport targets */}
      <Interactive onSelect={(e) => {
        if (player && e.intersection) {
          player.position.x = e.intersection.point.x;
          player.position.z = e.intersection.point.z;
        }
      }}>
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[100, 0.1, 100]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      </Interactive>
    </>
  );
};

export default VRScene;