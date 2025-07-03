import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface RPMAnimationControllerProps {
  avatarUrl: string;
  position: [number, number, number];
}

const RPMAnimationController: React.FC<RPMAnimationControllerProps> = ({ avatarUrl, position }) => {
  // Load avatar
  const { scene: avatarScene } = useGLTF(avatarUrl);
  
  // Load animation files
  const idleGLB = useGLTF('/animations/idle-male.glb');
  const walkGLB = useGLTF('/animations/walk-male.glb');
  const runGLB = useGLTF('/animations/run-male.glb');
  
  const avatarRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'walk' | 'run'>('idle');
  
  // Clone the avatar scene to avoid mutations
  const clonedScene = useMemo(() => {
    const clone = avatarScene.clone();
    clone.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const skinnedMesh = child as THREE.SkinnedMesh;
        skinnedMesh.skeleton = skinnedMesh.skeleton.clone();
      }
    });
    return clone;
  }, [avatarScene]);
  
  // Combine all animations
  const allAnimations = useMemo(() => {
    const animations: THREE.AnimationClip[] = [];
    
    if (idleGLB.animations && idleGLB.animations.length > 0) {
      animations.push(...idleGLB.animations.map(clip => {
        const newClip = clip.clone();
        newClip.name = 'idle';
        return newClip;
      }));
    }
    
    if (walkGLB.animations && walkGLB.animations.length > 0) {
      animations.push(...walkGLB.animations.map(clip => {
        const newClip = clip.clone();
        newClip.name = 'walk';
        return newClip;
      }));
    }
    
    if (runGLB.animations && runGLB.animations.length > 0) {
      animations.push(...runGLB.animations.map(clip => {
        const newClip = clip.clone();
        newClip.name = 'run';
        return newClip;
      }));
    }
    
    return animations;
  }, [idleGLB.animations, walkGLB.animations, runGLB.animations]);
  
  // Set up animations
  const { actions } = useAnimations(allAnimations, avatarRef);
  
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
    console.log('RPM Animation Controller loaded');
    console.log('Available actions:', Object.keys(actions));
    
    if (avatarRef.current) {
      avatarRef.current.position.set(...position);
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 1, 0);
    }
    
    // Start with idle animation
    if (actions['idle']) {
      actions['idle'].play();
      console.log('Playing idle animation');
    }
  }, [actions, position, camera]);

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
      // Fade out current animation
      const currentAction = actions[currentAnimation];
      if (currentAction) {
        currentAction.fadeOut(0.2);
      }
      
      // Fade in new animation
      const newAction = actions[targetAnimation];
      if (newAction) {
        newAction.reset().fadeIn(0.2).play();
        console.log(`Switching to ${targetAnimation} animation`);
      }
      
      setCurrentAnimation(targetAnimation);
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
      <primitive object={clonedScene} />
    </group>
  );
};

// Preload all animation files
useGLTF.preload('/animations/idle-male.glb');
useGLTF.preload('/animations/walk-male.glb');
useGLTF.preload('/animations/run-male.glb');

export default RPMAnimationController;