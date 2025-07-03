import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface AnimatedAvatarControllerProps {
  avatarUrl: string;
  position: [number, number, number];
}

// Local animation files (using GLB format)
const ANIMATIONS = {
  idle: '/animations/idle-male.glb',
  walk: '/animations/walk-male.glb',
  run: '/animations/run-male.glb'
};

const AnimatedAvatarController: React.FC<AnimatedAvatarControllerProps> = ({ avatarUrl, position }) => {
  const { scene } = useGLTF(avatarUrl);
  const avatarRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'walk' | 'run'>('idle');
  
  // Load animations from GLB files
  const { animations: idleAnimation } = useGLTF(ANIMATIONS.idle);
  const { animations: walkAnimation } = useGLTF(ANIMATIONS.walk);
  const { animations: runAnimation } = useGLTF(ANIMATIONS.run);
  
  // Set up animations
  const { actions } = useAnimations(
    [...idleAnimation, ...walkAnimation, ...runAnimation],
    avatarRef
  );
  
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false
  });

  useEffect(() => {
    console.log('Avatar loaded from URL:', avatarUrl);
    console.log('Avatar scene:', scene);
    console.log('Available animations:', actions);
    window.focus();
    
    if (avatarRef.current) {
      avatarRef.current.position.set(position[0], position[1], position[2]);
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 1, 0);
    }
    
    // Start with idle animation
    if (actions && idleAnimation.length > 0) {
      const idleAction = actions[idleAnimation[0].name];
      if (idleAction) {
        idleAction.play();
      }
    }
  }, [avatarUrl, scene, position, camera, actions, idleAnimation]);

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
    
    // Determine target animation
    let targetAnimation: 'idle' | 'walk' | 'run' = 'idle';
    if (isRunning) targetAnimation = 'run';
    else if (isMoving) targetAnimation = 'walk';
    
    // Switch animations if needed
    if (targetAnimation !== currentAnimation && actions) {
      // Stop current animation
      if (currentAnimation === 'idle' && idleAnimation[0]) {
        actions[idleAnimation[0].name]?.stop();
      } else if (currentAnimation === 'walk' && walkAnimation[0]) {
        actions[walkAnimation[0].name]?.stop();
      } else if (currentAnimation === 'run' && runAnimation[0]) {
        actions[runAnimation[0].name]?.stop();
      }
      
      // Play new animation
      if (targetAnimation === 'idle' && idleAnimation[0]) {
        actions[idleAnimation[0].name]?.play();
      } else if (targetAnimation === 'walk' && walkAnimation[0]) {
        actions[walkAnimation[0].name]?.play();
      } else if (targetAnimation === 'run' && runAnimation[0]) {
        actions[runAnimation[0].name]?.play();
      }
      
      setCurrentAnimation(targetAnimation);
    }
    
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
    avatarRef.current.position.y = position[1]; // Keep at ground level
    
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
    <group ref={avatarRef} position={position}>
      <primitive object={scene} scale={1} position={[0, 0, 0]} />
    </group>
  );
};

export default AnimatedAvatarController;