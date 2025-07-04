import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import FixedRetargetedAvatar from './FixedRetargetedAvatar';
import FloatingNameTagWithEvents from './FloatingNameTagWithEvents';

interface EnhancedAvatarProps {
  avatarUrl: string;
  position: [number, number, number];
  cameraMode: 'normal' | 'zoom' | 'birdseye';
  userName?: string;
}

const EnhancedAvatar = React.memo<EnhancedAvatarProps>(({ avatarUrl, position, cameraMode, userName }) => {
  const { camera } = useThree();
  const avatarRef = useRef<THREE.Group>(null);
  const innerAvatarRef = useRef<THREE.Group | null>(null);
  const savedCameraState = useRef<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
  }>({
    position: new THREE.Vector3(),
    rotation: new THREE.Euler()
  });

  // Handle camera mode changes
  useEffect(() => {
    if (!avatarRef.current) return;

    switch (cameraMode) {
      case 'zoom':
        // Save current camera state when entering zoom
        savedCameraState.current.position.copy(camera.position);
        savedCameraState.current.rotation.copy(camera.rotation);
        break;
        
      case 'birdseye':
        // Save current camera state when entering birdseye
        savedCameraState.current.position.copy(camera.position);
        savedCameraState.current.rotation.copy(camera.rotation);
        break;
        
      case 'normal':
        // Restore camera position when returning to normal
        if (savedCameraState.current.position.length() > 0) {
          camera.position.copy(savedCameraState.current.position);
          camera.rotation.copy(savedCameraState.current.rotation);
        }
        break;
    }
  }, [cameraMode, camera]);

  useFrame(() => {
    if (!innerAvatarRef.current) return;

    const avatarPosition = innerAvatarRef.current.position;
    const avatarRotation = innerAvatarRef.current.rotation.y;

    switch (cameraMode) {
      case 'zoom':
        // Close-up view of avatar
        const zoomPosition = new THREE.Vector3(
          avatarPosition.x + 2,
          avatarPosition.y + 1.6, // Eye level
          avatarPosition.z + 2
        );
        camera.position.lerp(zoomPosition, 0.1);
        camera.lookAt(
          avatarPosition.x,
          avatarPosition.y + 1.5,
          avatarPosition.z
        );
        // Reset FOV to default for PerspectiveCamera
        if (camera instanceof THREE.PerspectiveCamera && camera.fov !== 75) {
          camera.fov = 75;
          camera.updateProjectionMatrix();
        }
        break;
        
      case 'birdseye':
        // First-person view from avatar's eyes
        const eyeHeight = 1.7; // Average eye height for human avatar
        
        // Look in the direction the avatar is facing
        const lookDirection = new THREE.Vector3(
          Math.sin(avatarRotation),
          0,
          Math.cos(avatarRotation)
        );
        
        // Position camera slightly forward of the avatar's head to avoid seeing body parts
        const forwardOffset = 0.3; // Move camera forward by 0.3 units
        const firstPersonPosition = new THREE.Vector3(
          avatarPosition.x - lookDirection.x * forwardOffset,
          avatarPosition.y + eyeHeight,
          avatarPosition.z - lookDirection.z * forwardOffset
        );
        
        // Update camera position
        camera.position.set(
          firstPersonPosition.x,
          firstPersonPosition.y,
          firstPersonPosition.z
        );
        
        // Look forward in the direction the avatar is facing
        camera.lookAt(
          avatarPosition.x - lookDirection.x * 10,
          avatarPosition.y + eyeHeight,
          avatarPosition.z - lookDirection.z * 10
        );
        
        // Set a narrower field of view for more realistic first-person perspective
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = 60;
          camera.updateProjectionMatrix();
        }
        break;
        
      case 'normal':
        // Normal camera is handled by FixedRetargetedAvatar
        // Reset FOV to default for PerspectiveCamera
        if (camera instanceof THREE.PerspectiveCamera && camera.fov !== 75) {
          camera.fov = 75;
          camera.updateProjectionMatrix();
        }
        break;
    }
  });

  return (
    <group ref={avatarRef}>
      <FixedRetargetedAvatar 
        avatarUrl={avatarUrl} 
        position={position}
        disableCameraControl={cameraMode !== 'normal'}
        onGroupRef={(ref: THREE.Group | null) => {
          if (ref) {
            innerAvatarRef.current = ref;
          }
        }}
        userName={userName}
        showNameTag={cameraMode !== 'birdseye'}
      />
    </group>
  );
});

export default EnhancedAvatar;