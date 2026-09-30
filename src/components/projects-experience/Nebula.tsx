"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Color, Vector2 } from "three";
import type { ShaderMaterial } from "three";
import { mulberry32 } from "./data";
import { useRig } from "./rig";

// clouds are spread over the whole height the camera travels (y 3 → -17) so every project sits in colour
const CLOUDS: { center: [number, number, number]; spread: [number, number, number]; colors: string[] }[] = [
  { center: [-6.5, 2.2, -9], spread: [3.2, 2.6, 2.5], colors: ["#ff3fb4", "#f472b6", "#8b5cf6"] },
  { center: [6.8, -1.5, -10], spread: [3.4, 2.4, 2.8], colors: ["#06b6d4", "#22c55e", "#8b5cf6"] },
  { center: [-7.2, -5.5, -8], spread: [2.8, 2.6, 2.2], colors: ["#22c55e", "#a3e635", "#06b6d4"] },
  { center: [7.0, -8.5, -9], spread: [3.0, 2.8, 2.6], colors: ["#8b5cf6", "#ff3fb4", "#0071e3"] },
  { center: [-6.0, -11.5, -10], spread: [3.4, 2.6, 2.6], colors: ["#f97316", "#ff3fb4", "#f59e0b"] },
  { center: [6.2, -14.5, -8], spread: [3.0, 2.4, 2.4], colors: ["#06b6d4", "#0071e3", "#a3e635"] },
  { center: [0.5, -6.5, -16], spread: [6.5, 9.0, 3.0], colors: ["#8b5cf6", "#ff3fb4", "#06b6d4"] },
];
const DUST_COLORS = ["#1d1d1f", "#6e6e73", "#0071e3"];

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uWarp;
  uniform float uDrift;
  uniform vec2 uPointer;
  uniform vec2 uCenter;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float t = uTime * 0.18 * uDrift + aSeed * 6.2831;
    p += vec3(sin(t * 1.3), cos(t * 0.9), sin(t * 0.7)) * (0.18 + aSeed * 0.22) * uDrift;
    float depth = clamp(-p.z / 15.0, 0.0, 1.5);
    p.xy += uPointer * (0.25 + depth * 0.45);
    // warp bursts outward around the camera, wherever it is along the robot
    p.xy = uCenter + (p.xy - uCenter) * (1.0 + uWarp * (0.6 + aSeed * 0.8));
    p.z += uWarp * (4.0 + aSeed * 8.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (56.0 / -mv.z);
    vColor = aColor;
    vAlpha = smoothstep(-48.0, -9.0, mv.z) * smoothstep(0.6, 3.5, -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d) * vAlpha * 0.9;
    gl_FragColor = vec4(vColor, a);
  }
`;

function gaussian(rand: () => number) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

export function Nebula({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const rigRef = useRig();
  const materialRef = useRef<ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const rand = mulberry32(7);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const color = new Color();
    const dust = Math.floor(count * 0.18);

    for (let i = 0; i < count; i++) {
      let hex: string;
      if (i < dust) {
        positions[i * 3] = (rand() - 0.5) * 34;
        positions[i * 3 + 1] = 6 - rand() * 28;
        positions[i * 3 + 2] = -2 - rand() * 26;
        hex = DUST_COLORS[Math.floor(rand() * DUST_COLORS.length)];
        sizes[i] = 0.35 + rand() * 0.5;
      } else {
        const cloud = CLOUDS[i % CLOUDS.length];
        for (let axis = 0; axis < 3; axis++) {
          positions[i * 3 + axis] = cloud.center[axis] + gaussian(rand) * cloud.spread[axis] * 0.55;
        }
        hex = cloud.colors[Math.floor(rand() * cloud.colors.length)];
        sizes[i] = 0.5 + rand() * 1.1;
      }
      color.set(hex).multiplyScalar(0.85 + rand() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      seeds[i] = rand();
    }

    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("aColor", new BufferAttribute(colors, 3));
    g.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    g.setAttribute("aSize", new BufferAttribute(sizes, 1));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uWarp: { value: 0 },
      uDrift: { value: 1 },
      uPointer: { value: new Vector2() },
      uCenter: { value: new Vector2() },
    }),
    [],
  );

  useFrame((state) => {
    const material = materialRef.current;
    const r = rigRef.current;
    if (!material || !r) return;
    material.uniforms.uTime.value = r.time;
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    material.uniforms.uWarp.value = r.detail;
    material.uniforms.uDrift.value = reducedMotion ? 0 : 1;
    material.uniforms.uPointer.value.copy(r.pointer);
    material.uniforms.uCenter.value.set(state.camera.position.x, state.camera.position.y);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
