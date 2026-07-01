'use client';

/**
 * ArmModel — Procedurally generated 3D robotic arm from ArmConfig.
 * Each link is a cylinder, each joint is a sphere.
 * Rotations are applied using DH convention for correct visualization.
 *
 * Uses smooth per-frame interpolation (lerp) so the arm animates between
 * positions instead of snapping, which prevents visual segment overlap.
 */

import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useArmStore } from '@/store/arm-store';
import { getJointTransforms } from '@/engine/kinematics';

/** How quickly the display angles catch up to the target (higher = faster). */
const LERP_SPEED = 8.0;

/** Angle difference (degrees) below which we snap to the target. */
const SNAP_THRESHOLD = 0.05;

export function ArmModel() {
  const config = useArmStore((s) => s.config);
  const jointAngles = useArmStore((s) => s.jointAngles);
  const selectedJoint = useArmStore((s) => s.selectedJoint);
  const selectJoint = useArmStore((s) => s.selectJoint);
  const groupRef = useRef<THREE.Group>(null);

  // ── Smooth interpolation state ──────────────────────────────
  // displayAngles holds the angles currently shown in the 3D scene.
  // They lerp toward jointAngles every frame so the arm moves smoothly.
  const displayAnglesRef = useRef<number[]>([...jointAngles]);

  // A revision counter that we bump whenever displayAngles actually changes,
  // so the useMemo for transforms/segments recomputes.
  const [revision, setRevision] = useState(0);

  // Keep a stable reference to the latest target angles for the useFrame cb
  const targetAnglesRef = useRef<number[]>(jointAngles);
  targetAnglesRef.current = jointAngles;

  // Ensure displayAnglesRef length stays in sync with config changes
  if (displayAnglesRef.current.length !== jointAngles.length) {
    displayAnglesRef.current = [...jointAngles];
  }

  // Per-frame interpolation + floating animation
  useFrame((state, delta) => {
    // Floating bob
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    }

    // Smooth lerp of display angles toward target angles
    const target = targetAnglesRef.current;
    const display = displayAnglesRef.current;
    let changed = false;

    for (let i = 0; i < display.length; i++) {
      const t = target[i] ?? display[i];
      const diff = t - display[i];

      if (Math.abs(diff) < SNAP_THRESHOLD) {
        if (display[i] !== t) {
          display[i] = t;
          changed = true;
        }
      } else {
        // Exponential lerp clamped by delta time
        const step = diff * Math.min(1, LERP_SPEED * delta);
        display[i] += step;
        changed = true;
      }
    }

    if (changed) {
      setRevision((r) => r + 1);
    }
  });

  // Compute joint transforms from FK using the *display* (interpolated) angles
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transforms = useMemo(
    () => getJointTransforms(config, displayAnglesRef.current),
    // revision drives recomputation when displayAngles change in useFrame
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, revision]
  );

  // Build arm geometry from transforms
  const segments = useMemo(() => {
    const segs: {
      start: THREE.Vector3;
      end: THREE.Vector3;
      color: string;
      radius: number;
      jointRadius: number;
      axisIndex: number;
      frameQuaternion: THREE.Quaternion;
    }[] = [];

    for (let i = 0; i < transforms.length - 1; i++) {
      const startPos = new THREE.Vector3(
        transforms[i][0][3],
        transforms[i][2][3],  // Swap Y/Z for Three.js (Y-up)
        transforms[i][1][3]
      );
      const endPos = new THREE.Vector3(
        transforms[i + 1][0][3],
        transforms[i + 1][2][3],
        transforms[i + 1][1][3]
      );

      const axis = config.axes[i];
      
      // Compute correct rotation for the joint frame
      const m = new THREE.Matrix4();
      const T = transforms[i];
      // Map DH Z-up to Three.js Y-up:
      // Three X = DH X
      // Three Y = DH Z
      // Three Z = -DH Y
      m.set(
        T[0][0], T[0][2], -T[0][1], 0,
        T[2][0], T[2][2], -T[2][1], 0,
        T[1][0], T[1][2], -T[1][1], 0,
        0,       0,        0,       1
      );
      const frameQuaternion = new THREE.Quaternion().setFromRotationMatrix(m);

      segs.push({
        start: startPos,
        end: endPos,
        color: axis?.color ?? '#6b7280',
        radius: axis?.linkRadius ?? 10,
        jointRadius: axis?.jointRadius ?? 12,
        axisIndex: i,
        frameQuaternion,
      });
    }

    return segs;
  }, [transforms, config.axes]);

  return (
    <group ref={groupRef}>
      {/* Base pedestal */}
      <group position={[0, config.baseHeight / 2, 0]}>
        {/* Main Base Body */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[config.baseRadius * 0.9, config.baseRadius * 1.2, config.baseHeight, 32]} />
          <meshPhysicalMaterial
            color="#1e293b"
            metalness={0.9}
            roughness={0.2}
            clearcoat={0.5}
            clearcoatRoughness={0.1}
          />
        </mesh>
        {/* Base Detail Grating/Ring */}
        <mesh position={[0, -config.baseHeight / 2 + 2, 0]}>
          <cylinderGeometry args={[config.baseRadius * 1.25, config.baseRadius * 1.25, 4, 32]} />
          <meshPhysicalMaterial color="#0f172a" metalness={1} roughness={0.4} />
        </mesh>
      </group>

      {/* Base ring accent */}
      <mesh position={[0, config.baseHeight, 0]}>
        <torusGeometry args={[config.baseRadius * 0.7, 1.5, 16, 32]} />
        <meshStandardMaterial
          color={config.axes[0]?.color ?? '#3b82f6'}
          emissive={config.axes[0]?.color ?? '#3b82f6'}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Arm segments */}
      {segments.map((seg, i) => {
        const isGripper = config.axes[seg.axisIndex]?.name.includes('Gripper');
        if (isGripper) {
          return (
            <RackAndPinionGripper
              key={i}
              start={seg.start}
              end={seg.end}
              color={seg.color}
              radius={seg.radius}
              jointRadius={seg.jointRadius}
              isSelected={selectedJoint === seg.axisIndex}
              onClick={() => selectJoint(seg.axisIndex)}
              frameQuaternion={seg.frameQuaternion}
            />
          );
        }
        return (
          <LinkSegment
            key={i}
            start={seg.start}
            end={seg.end}
            color={seg.color}
            radius={seg.radius}
            jointRadius={seg.jointRadius}
            isSelected={selectedJoint === seg.axisIndex}
            onClick={() => selectJoint(seg.axisIndex)}
            frameQuaternion={seg.frameQuaternion}
          />
        );
      })}

      {/* End effector indicator */}
      {transforms.length > 1 && (
        <EndEffectorIndicator
          position={new THREE.Vector3(
            transforms[transforms.length - 1][0][3],
            transforms[transforms.length - 1][2][3],
            transforms[transforms.length - 1][1][3]
          )}
        />
      )}
    </group>
  );
}

/** Individual link segment (cylinder between two joints) */
function LinkSegment({
  start,
  end,
  color,
  radius,
  jointRadius,
  isSelected,
  onClick,
  frameQuaternion,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  radius: number;
  jointRadius: number;
  isSelected: boolean;
  onClick: () => void;
  frameQuaternion: THREE.Quaternion;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const jointRef = useRef<THREE.Mesh>(null);

  // Compute cylinder position and orientation
  const { position, quaternion, length } = useMemo(() => {
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    const direction = new THREE.Vector3().subVectors(end, start);
    const len = direction.length();

    const quat = new THREE.Quaternion();
    if (len > 0.01) {
      const up = new THREE.Vector3(0, 1, 0);
      quat.setFromUnitVectors(up, direction.clone().normalize());
    }

    return { position: mid, quaternion: quat, length: len };
  }, [start, end]);

  // Pulse animation for selected joint
  useFrame((state) => {
    if (jointRef.current && isSelected) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      jointRef.current.scale.setScalar(scale);
    } else if (jointRef.current) {
      jointRef.current.scale.setScalar(1);
    }
  });

  return (
    <group>
      {/* Link cylinder / beam */}
      {length > 1 && (
        <mesh
          ref={meshRef}
          position={position}
          quaternion={quaternion}
          castShadow
          receiveShadow
        >
          {/* Use 6 segments for a hex-beam tech look */}
          <cylinderGeometry args={[radius * 0.8, radius * 0.9, length, 6]} />
          <meshPhysicalMaterial
            color="#334155"
            metalness={0.8}
            roughness={0.3}
            clearcoat={0.3}
            clearcoatRoughness={0.2}
            flatShading
          />
        </mesh>
      )}

      {/* Joint Hub */}
      <group
        ref={jointRef}
        position={start}
        quaternion={frameQuaternion}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {/* Inner core */}
        <mesh castShadow>
          <sphereGeometry args={[jointRadius * 0.8, 32, 32]} />
          <meshPhysicalMaterial
            color="#0f172a"
            metalness={1.0}
            roughness={0.2}
            clearcoat={1.0}
          />
        </mesh>
        {/* Outer glowing rings */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[jointRadius, 1.5, 16, 32]} />
          <meshStandardMaterial
            color={isSelected ? '#ffffff' : color}
            emissive={isSelected ? '#ffffff' : color}
            emissiveIntensity={isSelected ? 2.0 : 0.8}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[jointRadius, 1.5, 16, 32]} />
          <meshStandardMaterial
            color={isSelected ? '#ffffff' : color}
            emissive={isSelected ? '#ffffff' : color}
            emissiveIntensity={isSelected ? 2.0 : 0.8}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/** End effector crosshair indicator */
function EndEffectorIndicator({ position }: { position: THREE.Vector3 }) {
  const coreRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      coreRef.current.rotation.z = state.clock.elapsedTime * 0.3;
      coreRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 1.5;
    }
  });

  return (
    <group position={position}>
      <group ref={coreRef}>
        {/* Central Core */}
        <mesh>
          <octahedronGeometry args={[3, 0]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0ea5e9"
            emissiveIntensity={2.0}
            wireframe
            toneMapped={false}
          />
        </mesh>
        {/* Inner rotating ring */}
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[6, 0.3, 8, 32]} />
          <meshStandardMaterial
            color="#7dd3fc"
            emissive="#7dd3fc"
            emissiveIntensity={1.5}
            transparent
            opacity={0.6}
            toneMapped={false}
          />
        </mesh>
        {/* Outer rotating segmented ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[10, 0.5, 8, 32, Math.PI * 1.5]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={1.0}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Rack and Pinion Gripper (Two opposite sliding jaws driven by a central gear) */
function RackAndPinionGripper({
  start,
  end,
  color,
  radius,
  jointRadius,
  isSelected,
  onClick,
  frameQuaternion,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  radius: number;
  jointRadius: number;
  isSelected: boolean;
  onClick: () => void;
  frameQuaternion: THREE.Quaternion;
}) {
  const jointRef = useRef<THREE.Group>(null);
  const gearRef = useRef<THREE.Mesh>(null);

  // Compute length for gear rotation and jaw offset
  const length = useMemo(() => {
    return new THREE.Vector3().subVectors(end, start).length();
  }, [start, end]);

  // Pulse animation for selected joint and gear rotation
  useFrame((state) => {
    if (jointRef.current && isSelected) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      jointRef.current.scale.setScalar(scale);
    } else if (jointRef.current) {
      jointRef.current.scale.setScalar(1);
    }

    if (gearRef.current) {
      // Rotate gear proportional to the extension length
      gearRef.current.rotation.y = length * 0.2;
    }
  });

  // Each jaw moves half of the total length outwards from the center.
  // The 'length' is along the local Y axis. Racks spread along local X.
  const jawOffset = length / 2;

  return (
    <group>
      {/* Central mechanism at the start joint */}
      <group
        ref={jointRef}
        position={start}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        quaternion={frameQuaternion} // Align with the exact joint frame
      >
        <group rotation={[0, Math.PI / 2, 0]}>
          {/* Base Hub / Servo Casing */}
          <mesh castShadow position={[0, -5, 0]}>
            <boxGeometry args={[jointRadius * 2.5, 10, jointRadius * 1.5]} />
            <meshPhysicalMaterial
              color="#0f172a"
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
          
          {/* Central Pinion Gear */}
          <mesh ref={gearRef} castShadow position={[0, 2, 0]}>
            <cylinderGeometry args={[radius * 1.2, radius * 1.2, 4, 12]} />
            <meshPhysicalMaterial
              color={isSelected ? '#ffffff' : color}
              emissive={isSelected ? '#ffffff' : color}
              emissiveIntensity={isSelected ? 1.0 : 0.4}
              metalness={1.0}
              roughness={0.2}
            />
          </mesh>

          {/* Left Rack & Jaw */}
          <group position={[-jawOffset - jointRadius * 0.5, 2, 0]}>
            {/* Rack beam (sliding part) */}
            <mesh castShadow position={[jawOffset / 2, 0, 0]}>
              <boxGeometry args={[jawOffset + jointRadius, 2, 4]} />
              <meshPhysicalMaterial color="#334155" metalness={0.8} roughness={0.4} />
            </mesh>
            {/* Jaw finger */}
            <mesh castShadow position={[-jointRadius * 0.5, 15, 0]}>
              <boxGeometry args={[4, 30, 4]} />
              <meshPhysicalMaterial color="#94a3b8" metalness={0.6} roughness={0.5} />
            </mesh>
          </group>

          {/* Right Rack & Jaw */}
          <group position={[jawOffset + jointRadius * 0.5, -2, 0]}>
            {/* Rack beam (sliding part) */}
            <mesh castShadow position={[-jawOffset / 2, 0, 0]}>
              <boxGeometry args={[jawOffset + jointRadius, 2, 4]} />
              <meshPhysicalMaterial color="#334155" metalness={0.8} roughness={0.4} />
            </mesh>
            {/* Jaw finger */}
            <mesh castShadow position={[jointRadius * 0.5, 15, 0]}>
              <boxGeometry args={[4, 30, 4]} />
              <meshPhysicalMaterial color="#94a3b8" metalness={0.6} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
