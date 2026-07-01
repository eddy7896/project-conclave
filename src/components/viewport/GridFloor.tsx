'use client';

/**
 * GridFloor — Ground plane with measurement grid and workspace envelope.
 */

import { useArmStore } from '@/store/arm-store';
import { getWorkspaceRadius } from '@/engine/kinematics';
import { useMemo } from 'react';
import * as THREE from 'three';

export function GridFloor() {
  const config = useArmStore((s) => s.config);
  const workspaceRadius = useMemo(() => getWorkspaceRadius(config), [config]);

  return (
    <group>
      {/* Main grid */}
      <gridHelper
        args={[600, 30, '#94a3b8', '#cbd5e1']}
        position={[0, 0, 0]}
      />

      {/* Fine grid */}
      <gridHelper
        args={[600, 120, '#e2e8f0', '#e2e8f0']}
        position={[0, 0.1, 0]}
      />

      {/* Ground plane (for shadows) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial
          color="#f8fafc"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Workspace envelope circle */}
      <WorkspaceCircle radius={workspaceRadius} />
    </group>
  );
}

function WorkspaceCircle({ radius }: { radius: number }) {
  const lineObj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          0.5,
          Math.sin(angle) * radius
        )
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineBasicMaterial({
      color: '#3b82f6',
      transparent: true,
      opacity: 0.2,
    });
    return new THREE.Line(geometry, material);
  }, [radius]);

  return <primitive object={lineObj} />;
}
