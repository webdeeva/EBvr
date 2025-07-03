import React from 'react';
import { Text } from '@react-three/drei';
import { useXR } from '@react-three/xr';

interface VRPanelProps {
  userName: string;
  worldName: string;
}

const VRPanel: React.FC<VRPanelProps> = ({ userName, worldName }) => {
  const { isPresenting } = useXR();

  if (!isPresenting) return null;

  return (
    <group position={[0, 2.5, -3]}>
      {/* Panel Background */}
      <mesh>
        <planeGeometry args={[2, 0.8]} />
        <meshBasicMaterial color="#000000" opacity={0.8} transparent />
      </mesh>
      
      {/* World Name */}
      <Text
        position={[0, 0.2, 0.01]}
        fontSize={0.12}
        color="#ff8c42"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.ttf"
      >
        {worldName}
      </Text>
      
      {/* User Name */}
      <Text
        position={[0, -0.1, 0.01]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {userName}
      </Text>
      
      {/* Instructions */}
      <Text
        position={[0, -0.3, 0.01]}
        fontSize={0.06}
        color="#999999"
        anchorX="center"
        anchorY="middle"
      >
        Trigger: Teleport • Thumbstick: Move • Menu: Options
      </Text>
    </group>
  );
};

export default VRPanel;