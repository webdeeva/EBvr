import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
import FloatingNameTagWithEvents from './FloatingNameTagWithEvents';

interface FixedRetargetedAvatarProps {
  avatarUrl: string;
  position: [number, number, number];
  disableCameraControl?: boolean;
  onGroupRef?: (ref: THREE.Group | null) => void;
  userName?: string;
  showNameTag?: boolean;
}

const FixedRetargetedAvatar: React.FC<FixedRetargetedAvatarProps> = ({ avatarUrl, position, disableCameraControl = false, onGroupRef, userName, showNameTag = true }) => {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Load models
  const avatar = useGLTF(avatarUrl);
  const idleModel = useGLTF('/animations/idle-male.glb');
  const walkModel = useGLTF('/animations/walk-male.glb');
  const runModel = useGLTF('/animations/run-male.glb');
  
  // Clone avatar to avoid mutations
  const clonedAvatar = useMemo(() => clone(avatar.scene), [avatar.scene]);
  
  // Get all animations
  const animations = useMemo(() => {
    const anims: THREE.AnimationClip[] = [];
    
    // Add animations with descriptive names
    if (idleModel.animations.length > 0) {
      const idleClip = idleModel.animations[0].clone();
      idleClip.name = 'idle';
      anims.push(idleClip);
    }
    
    if (walkModel.animations.length > 0) {
      const walkClip = walkModel.animations[0].clone();
      walkClip.name = 'walk';
      anims.push(walkClip);
    }
    
    if (runModel.animations.length > 0) {
      const runClip = runModel.animations[0].clone();
      runClip.name = 'run';
      anims.push(runClip);
    }
    
    return anims;
  }, [idleModel.animations, walkModel.animations, runModel.animations]);
  
  // Set up animations on the cloned avatar
  const { actions, mixer } = useAnimations(animations, clonedAvatar);
  
  // Animation state
  const currentAnimation = useRef('idle');
  
  // Movement state
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });
  
  // Camera controls
  const cameraDistance = useRef(10);
  const cameraAngle = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);

  // Initialize animations
  useEffect(() => {
    if (actions.idle && mixer) {
      console.log('Initializing animations');
      console.log('Available actions:', Object.keys(actions));
      
      // Stop all current actions
      Object.values(actions).forEach(action => {
        if (action) action.stop();
      });
      
      // Play idle animation
      actions.idle.reset().play();
      currentAnimation.current = 'idle';
    }
  }, [actions, mixer]);

  // Initialize position
  useEffect(() => {
    if (group.current) {
      group.current.position.set(...position);
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 1, 0);
      
      // Call the ref callback if provided
      if (onGroupRef) {
        onGroupRef(group.current);
      }
    }
  }, [position, camera, onGroupRef]);

  // Keyboard and mouse controls
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
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        isMouseDown.current = true;
        e.preventDefault();
      }
    };
    
    const handleMouseUp = () => {
      isMouseDown.current = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDown.current) {
        cameraAngle.current.x -= e.movementX * 0.01;
        cameraAngle.current.y = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraAngle.current.y - e.movementY * 0.01));
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance.current = Math.max(5, Math.min(20, cameraDistance.current + e.deltaY * 0.01));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Update loop
  useFrame((state, delta) => {
    if (!group.current || !mixer) return;

    // Update animation mixer
    mixer.update(delta);

    const speed = keys.current.shift ? 10 : 5;
    const isMoving = keys.current.w || keys.current.s || keys.current.a || keys.current.d;
    const isRunning = isMoving && keys.current.shift;
    
    // Determine target animation
    let targetAnimation = 'idle';
    if (isRunning && actions.run) {
      targetAnimation = 'run';
    } else if (isMoving && actions.walk) {
      targetAnimation = 'walk';
    }
    
    // Switch animations with crossfade
    if (targetAnimation !== currentAnimation.current) {
      const fadeOutAction = actions[currentAnimation.current];
      const fadeInAction = actions[targetAnimation];
      
      if (fadeOutAction && fadeInAction) {
        fadeOutAction.fadeOut(0.2);
        fadeInAction.reset().fadeIn(0.2).play();
        console.log(`Switching from ${currentAnimation.current} to ${targetAnimation}`);
        
        currentAnimation.current = targetAnimation;
      }
    }
    
    // Movement (camera-relative)
    const forward = new THREE.Vector3(0, 0, 0);
    const right = new THREE.Vector3(0, 0, 0);
    
    if (keys.current.w) forward.z = -1;
    if (keys.current.s) forward.z = 1;
    if (keys.current.a) right.x = -1;
    if (keys.current.d) right.x = 1;
    
    // Rotate movement based on camera angle
    const moveAngle = cameraAngle.current.x;
    direction.current.set(
      forward.z * Math.sin(moveAngle) + right.x * Math.cos(moveAngle),
      0,
      forward.z * Math.cos(moveAngle) - right.x * Math.sin(moveAngle)
    );
    
    direction.current.normalize();
    
    if (direction.current.length() > 0) {
      velocity.current.add(direction.current.multiplyScalar(speed * delta));
      
      // Face direction of movement
      const angle = Math.atan2(direction.current.x, direction.current.z);
      group.current.rotation.y = angle;
    }
    
    // Apply damping
    velocity.current.multiplyScalar(0.9);
    
    // Update position
    group.current.position.x += velocity.current.x;
    group.current.position.z += velocity.current.z;
    group.current.position.y = position[1];
    
    // Camera follow with mouse orbit controls (only if not disabled)
    if (!disableCameraControl) {
      const cameraOffset = new THREE.Vector3(
        Math.sin(cameraAngle.current.x) * cameraDistance.current,
        5 + Math.sin(cameraAngle.current.y) * cameraDistance.current * 0.5,
        Math.cos(cameraAngle.current.x) * cameraDistance.current
      );
      
      const desiredCameraPosition = new THREE.Vector3(
        group.current.position.x + cameraOffset.x,
        group.current.position.y + cameraOffset.y,
        group.current.position.z + cameraOffset.z
      );
      
      camera.position.lerp(desiredCameraPosition, 0.1);
      
      // Look at avatar with slight offset upward
      const lookTarget = new THREE.Vector3(
        group.current.position.x,
        group.current.position.y + 1.5,
        group.current.position.z
      );
      camera.lookAt(lookTarget);
    }
  });

  return (
    <group ref={group}>
      <primitive object={clonedAvatar} />
      {/* Name tag attached to the avatar */}
      {userName && showNameTag && (
        <FloatingNameTagWithEvents 
          name={userName} 
          position={[0, 0, 0]}
        />
      )}
    </group>
  );
};

// Preload all models
useGLTF.preload('/animations/idle-male.glb');
useGLTF.preload('/animations/walk-male.glb');
useGLTF.preload('/animations/run-male.glb');

export default FixedRetargetedAvatar;