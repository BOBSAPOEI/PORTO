"use client";

import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Box3, type Group, Vector3 } from "three";

interface CityModelProps {
  reducedMotion?: boolean;
  interactive?: boolean;
}

export function CityModel({ reducedMotion = false, interactive = true }: CityModelProps) {
  const { scene } = useGLTF("/models/city-within-roman.glb");
  const spinRef = useRef<Group>(null);
  const fitRef = useRef<Group>(null);

  useEffect(() => {
    if (!fitRef.current) return;
    const box = new Box3().setFromObject(fitRef.current);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.3 / maxDim;
    fitRef.current.scale.setScalar(scale);
    fitRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  }, [scene]);

  useFrame((_, delta) => {
    if (spinRef.current && !reducedMotion) {
      spinRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[3, 4, 3]} color="#ffffff" intensity={35} />
      <pointLight position={[-3, -2, -2]} color="#7c3aed" intensity={22} />
      <Environment preset="city" resolution={64} />

      <group ref={spinRef} rotation={[0.15, 0, 0]}>
        <group ref={fitRef}>
          <primitive object={scene} />
        </group>
      </group>

      {interactive && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.6}
          enableDamping={false}
        />
      )}
    </>
  );
}

useGLTF.preload("/models/city-within-roman.glb");
