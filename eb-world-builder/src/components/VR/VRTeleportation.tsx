import React, { useRef, useState } from 'react';
import { useXR, useController } from '@react-three/xr';
import { Raycaster, Vector3, Mesh, PlaneGeometry, MeshBasicMaterial, Group } from 'three';
import { useFrame } from '@react-three/fiber';

const VRTeleportation: React.FC = () => {
  const { player } = useXR();
  const rightController = useController('right');
  const [teleportTarget, setTeleportTarget] = useState<Vector3 | null>(null);
  const raycaster = useRef(new Raycaster());
  const teleportMarkerRef = useRef<Group>(null);

  useFrame((state) => {
    if (!rightController?.controller || !player) return;

    const controller = rightController.controller;
    const gamepad = rightController.inputSource?.gamepad;

    if (gamepad) {
      const thumbstickX = gamepad.axes[2]; // Right thumbstick X
      const thumbstickY = gamepad.axes[3]; // Right thumbstick Y
      const triggerButton = gamepad.buttons[0];
      const thumbstickButton = gamepad.buttons[3];

      // Smooth locomotion with thumbstick
      if (Math.abs(thumbstickX) > 0.1 || Math.abs(thumbstickY) > 0.1) {
        const speed = 0.05;
        const forward = new Vector3(0, 0, -1);
        const right = new Vector3(1, 0, 0);
        
        forward.applyQuaternion(player.quaternion);
        right.applyQuaternion(player.quaternion);
        
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();
        
        player.position.add(forward.multiplyScalar(thumbstickY * speed));
        player.position.add(right.multiplyScalar(thumbstickX * speed));
      }

      // Teleportation with trigger
      if (triggerButton.pressed) {
        // Cast ray from controller
        const tempMatrix = controller.matrixWorld;
        raycaster.current.ray.origin.setFromMatrixPosition(tempMatrix);
        
        const forward = new Vector3(0, 0, -1);
        forward.transformDirection(tempMatrix);
        raycaster.current.ray.direction.copy(forward);

        // Check for ground intersection
        const ground = state.scene.getObjectByName('ground');
        if (ground) {
          const intersects = raycaster.current.intersectObject(ground, true);
          if (intersects.length > 0) {
            const point = intersects[0].point;
            setTeleportTarget(point);
            
            // Show teleport marker
            if (teleportMarkerRef.current) {
              teleportMarkerRef.current.position.copy(point);
              teleportMarkerRef.current.visible = true;
            }
          }
        }
      } else if (teleportTarget && !triggerButton.pressed) {
        // Teleport on release
        player.position.x = teleportTarget.x;
        player.position.z = teleportTarget.z;
        setTeleportTarget(null);
        
        // Hide teleport marker
        if (teleportMarkerRef.current) {
          teleportMarkerRef.current.visible = false;
        }
      }

      // Snap turn with thumbstick click
      if (thumbstickButton.pressed && Math.abs(thumbstickX) > 0.5) {
        const snapAngle = Math.PI / 4; // 45 degrees
        player.rotateY(thumbstickX > 0 ? -snapAngle : snapAngle);
      }
    }
  });

  return (
    <group ref={teleportMarkerRef} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color="#ff8c42" opacity={0.8} transparent />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
        <meshBasicMaterial color="#ff8c42" opacity={0.3} transparent />
      </mesh>
    </group>
  );
};

export default VRTeleportation;