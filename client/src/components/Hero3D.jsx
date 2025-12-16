import React, { Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

function Blob({ color = '#38bdf8', position = [0, 0, 0], scale = 1 }) {
  const geom = useMemo(() => new THREE.IcosahedronGeometry(1, 4), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.22,
        metalness: 0.25,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.08,
      }),
    [color]
  );

  return (
    <mesh geometry={geom} material={mat} position={position} scale={scale} castShadow={false} receiveShadow={false} />
  );
}

function Scene() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.camera.position.x = Math.sin(t * 0.08) * 0.15;
    state.camera.position.y = Math.cos(t * 0.07) * 0.12;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} castShadow />
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.9}>
        <Blob color="#38bdf8" position={[-1.1, 0.2, 0]} scale={1.15} />
      </Float>
      <Float speed={1.0} rotationIntensity={0.55} floatIntensity={0.8}>
        <Blob color="#0ea5e9" position={[1.1, -0.2, -0.3]} scale={0.95} />
      </Float>
      <Float speed={0.9} rotationIntensity={0.5} floatIntensity={0.7}>
        <Blob color="#075985" position={[0.2, 0.95, -0.6]} scale={0.75} />
      </Float>
      <Environment preset="city" />
    </>
  );
}

export default function Hero3D({ className = '' }) {
  const reducedMotion = usePrefersReducedMotion();
  const lowEnd =
    typeof navigator !== 'undefined' &&
    ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4));

  // Keep 3D optional for accessibility/perf.
  if (reducedMotion || lowEnd) return null;

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        shadows={false}
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 5.2], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        performance={{ min: 0.6 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}


