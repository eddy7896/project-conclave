'use client';

/**
 * 3D Scene — R3F Canvas with camera, lighting, and post-processing.
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import { ArmModel } from './ArmModel';
import { GridFloor } from './GridFloor';
import { CoordinateAxes } from './CoordinateAxes';

export function Scene() {
  return (
    <Canvas
      camera={{
        position: [300, 250, 300],
        fov: 45,
        near: 1,
        far: 5000,
      }}
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'transparent' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[200, 400, 200]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={1000}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
      />
      <pointLight position={[-200, 300, -100]} intensity={0.4} color="#8b5cf6" />
      <pointLight position={[100, 200, 300]} intensity={0.3} color="#3b82f6" />

      {/* Environment for reflections */}
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      {/* Ground */}
      <GridFloor />
      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.4}
        scale={500}
        blur={2}
        far={400}
      />

      {/* Coordinate axes indicator */}
      <CoordinateAxes />

      {/* Arm model */}
      <Suspense fallback={null}>
        <ArmModel />
      </Suspense>

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={100}
        maxDistance={1000}
        maxPolarAngle={Math.PI / 2 + 0.3}
        target={[0, 100, 0]}
      />
    </Canvas>
  );
}
