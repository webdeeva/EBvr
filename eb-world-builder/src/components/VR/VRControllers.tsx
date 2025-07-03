import React, { useRef } from 'react';
import { useXR, useController, XRControllerModelFactory } from '@react-three/xr';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface VRControllersProps {
  onTeleport?: (position: Vector3) => void;
}

const VRControllers: React.FC<VRControllersProps> = ({ onTeleport }) => {
  const leftController = useController('left');
  const rightController = useController('right');
  const { player } = useXR();

  // Teleportation ray
  const rayRef = useRef<Group>(null);

  useFrame(() => {
    // Handle teleportation with right controller trigger
    if (rightController?.inputSource?.gamepad) {
      const gamepad = rightController.inputSource.gamepad;
      const triggerButton = gamepad.buttons[0]; // Trigger button
      
      if (triggerButton.pressed) {
        // Show teleportation ray
        if (rayRef.current) {
          rayRef.current.visible = true;
        }
      } else if (triggerButton.touched) {
        // Hide ray when released
        if (rayRef.current) {
          rayRef.current.visible = false;
        }
      }
    }
  });

  return (
    <>
      {/* Left Controller */}
      {leftController && (
        <group>
          <primitive object={leftController.controller} />
          <primitive object={leftController.grip} />
          {leftController.hand && <primitive object={leftController.hand} />}
        </group>
      )}

      {/* Right Controller */}
      {rightController && (
        <group>
          <primitive object={rightController.controller} />
          <primitive object={rightController.grip} />
          {rightController.hand && <primitive object={rightController.hand} />}
          
          {/* Teleportation Ray */}
          <group ref={rayRef} visible={false}>
            <mesh position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 2]} />
              <meshBasicMaterial color="#ff8c42" opacity={0.6} transparent />
            </mesh>
            <mesh position={[0, 0, -2]}>
              <sphereGeometry args={[0.05]} />
              <meshBasicMaterial color="#ff8c42" />
            </mesh>
          </group>
        </group>
      )}
    </>
  );
};

export default VRControllers;