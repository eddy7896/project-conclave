'use client';

/**
 * CoordinateAxes — RGB XYZ axis indicator in the scene.
 * Red = X, Green = Y (up in Three.js), Blue = Z
 */

export function CoordinateAxes() {
  const length = 30;
  const offset = -250;

  return (
    <group position={[offset, 10, offset]}>
      {/* X axis — Red */}
      <mesh position={[length / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, length, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[length / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, length, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      {/* X arrow */}
      <mesh position={[length, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[3, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>

      {/* Y axis — Green (up) */}
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[1, 1, length, 8]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
      </mesh>
      {/* Y arrow */}
      <mesh position={[0, length, 0]}>
        <coneGeometry args={[3, 8, 8]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} />
      </mesh>

      {/* Z axis — Blue */}
      <mesh position={[0, 0, length / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, length, 8]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
      </mesh>
      {/* Z arrow */}
      <mesh position={[0, 0, length]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[3, 8, 8]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} />
      </mesh>

      {/* Origin sphere */}
      <mesh>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial color="#f1f5f9" emissive="#f1f5f9" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
