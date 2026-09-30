"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BackSide, Color, MathUtils } from "three";
import type { Mesh, ShaderMaterial } from "three";
import { useRig } from "./rig";

const tunnelVertex = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const tunnelFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAmount;
  uniform vec3 uAccent;
  varying vec3 vPos;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    // streaks run along the tunnel depth, banded across the walls
    float band = floor(vPos.y * 5.0) * 17.0 + floor(vPos.x * 5.0) * 7.0;
    float speed = 1.0 + hash(band) * 3.0;
    float cell = floor(vPos.z * 0.9 + uTime * speed);
    float streak = step(0.52, hash(band + cell * 1.3));
    float grain = hash(band * 3.1 + floor(vPos.z * 6.0 + uTime * speed * 4.0));
    vec3 base = vec3(0.965, 0.968, 0.98);
    vec3 col = mix(base, uAccent, 0.06 + 0.4 * streak * grain) - vec3(0.03) * grain;
    float depth = smoothstep(-42.0, 2.0, vPos.z);
    gl_FragColor = vec4(mix(base, col, depth), uAmount);
  }
`;

/** Streaky glitch room that fades in around an opened project. */
export function Tunnel({ openSlug, reducedMotion }: { openSlug: string | null; reducedMotion: boolean }) {
  const rigRef = useRig();
  const materialRef = useRef<ShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAmount: { value: 0 }, uAccent: { value: new Color("#0071e3") } }),
    [],
  );

  useFrame((state, delta) => {
    const r = rigRef.current;
    const material = materialRef.current;
    const mesh = meshRef.current;
    if (!r || !material || !mesh) return;
    // the camera travels vertically, so the room travels with it
    mesh.position.y = state.camera.position.y;
    const amount = MathUtils.smoothstep(r.detail, 0.15, 0.9);
    mesh.visible = amount > 0.001;
    material.uniforms.uAmount.value = amount;
    // frozen streaks under reduced motion
    material.uniforms.uTime.value = reducedMotion ? 0 : r.time;
    const accent = openSlug ? r.accents.get(openSlug) : undefined;
    if (accent) material.uniforms.uAccent.value.lerp(accent, 1 - Math.exp(-delta * 4));
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -12]} renderOrder={-1}>
      <boxGeometry args={[34, 20, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={tunnelVertex}
        fragmentShader={tunnelFragment}
        side={BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
