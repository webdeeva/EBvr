import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Avatar } from '@readyplayerme/visage';
import * as THREE from 'three';

interface VisageAvatarProps {
  avatarUrl: string;
  position: [number, number, number];
}

const VisageAvatar: React.FC<VisageAvatarProps> = ({ avatarUrl, position }) => {
  const avatarRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [currentAnimation, setCurrentAnimation] = useState<string>('/animations/idle-male.glb');
  
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });

  useEffect(() => {
    console.log('Visage Avatar loaded:', avatarUrl);
    
    if (avatarRef.current) {
      avatarRef.current.position.set(...position);
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 1, 0);
    }
  }, [avatarUrl, position, camera]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!avatarRef.current) return;

    const speed = keys.current.shift ? 10 : 5;
    const isMoving = keys.current.w || keys.current.s || keys.current.a || keys.current.d;
    const isRunning = isMoving && keys.current.shift;
    
    // Determine which animation to play
    let targetAnimation = '/animations/idle-male.glb';
    if (isRunning) {
      targetAnimation = '/animations/run-male.glb';
    } else if (isMoving) {
      targetAnimation = '/animations/walk-male.glb';
    }
    
    // Update animation if changed
    if (targetAnimation !== currentAnimation) {
      setCurrentAnimation(targetAnimation);
      console.log('Switching animation to:', targetAnimation);
    }
    
    // Movement logic
    direction.current.set(0, 0, 0);
    
    if (keys.current.w) direction.current.z -= 1;
    if (keys.current.s) direction.current.z += 1;
    if (keys.current.a) direction.current.x -= 1;
    if (keys.current.d) direction.current.x += 1;
    
    direction.current.normalize();
    
    if (direction.current.length() > 0) {
      velocity.current.add(direction.current.multiplyScalar(speed * delta));
    }
    
    velocity.current.multiplyScalar(0.9);
    
    avatarRef.current.position.x += velocity.current.x;
    avatarRef.current.position.z += velocity.current.z;
    avatarRef.current.position.y = position[1];
    
    if (direction.current.length() > 0) {
      const angle = Math.atan2(direction.current.x, direction.current.z);
      avatarRef.current.rotation.y = angle;
    }
    
    // Camera follow
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    cameraOffset.applyQuaternion(avatarRef.current.quaternion);
    camera.position.lerp(
      new THREE.Vector3(
        avatarRef.current.position.x + cameraOffset.x,
        avatarRef.current.position.y + cameraOffset.y,
        avatarRef.current.position.z + cameraOffset.z
      ),
      0.1
    );
    camera.lookAt(avatarRef.current.position);
  });

  return (
    <group ref={avatarRef}>
      <Avatar 
        modelSrc={avatarUrl}
        animationSrc={currentAnimation}
        shadows
        onLoaded={() => {
          console.log('Avatar model loaded');
        }}
        onAnimationEnd={(action) => {
          console.log('Animation ended:', action);
          // Restart the animation to loop it
          action.reset().play();
        }}
      />
    </group>
  );
};

export default VisageAvatar;