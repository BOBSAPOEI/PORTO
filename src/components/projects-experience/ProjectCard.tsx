"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, MathUtils, Vector2 } from "three";
import type { Group, MeshPhysicalMaterial, ShaderMaterial } from "three";
import type { Project } from "@/types";
import { CARD_H, CARD_W, projectMedia, slotPosition } from "./data";
import { useCardVideo, usePosterTexture, useRig } from "./rig";

const vertexShader = /* glsl */ `
  uniform float uHover;
  uniform float uTime;
  uniform float uGlitch;
  uniform vec2 uPointer;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    float d = distance(uv, uPointer);
    // displacement only ever pushes toward the camera, never back into the frame behind the screen
    p.z += uHover * 0.09 * (1.0 - smoothstep(0.0, 0.55, d));
    p.z += (uHover * 0.015 + uGlitch * 0.05) * (0.5 + 0.5 * sin(uv.x * 12.0 + uTime * 4.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uPoster;
  uniform sampler2D uVideo;
  uniform float uHasPoster;
  uniform float uVideoMix;
  uniform float uHover;
  uniform float uTime;
  uniform float uFocus;
  uniform float uOpacity;
  uniform float uGlitch;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform vec3 uAccent;
  varying vec2 vUv;

  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  vec3 media(vec2 uv) {
    uv = clamp(uv, 0.001, 0.999);
    vec3 fallback = mix(vec3(0.93, 0.94, 0.96), uAccent * 0.4 + 0.55, uv.y * 0.8 + 0.1 * sin(uv.x * 6.0 + uTime));
    vec3 base = mix(fallback, texture2D(uPoster, uv).rgb, uHasPoster);
    // VideoTextures aren't sRGB-decoded for custom shaders (only built-ins get DECODE_VIDEO_TEXTURE)
    return mix(base, sRGBTransferEOTF(texture2D(uVideo, uv)).rgb, uVideoMix);
  }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = roundedBox(p, uSize * 0.5, uRadius);
    float aa = fwidth(d);
    float mask = 1.0 - smoothstep(-aa, aa, d);

    // horizontal glitch slices + hover ripple
    float slice = floor(vUv.y * 24.0);
    float jitter = (hash(slice + floor(uTime * 18.0)) - 0.5) * 0.06 * uGlitch * step(0.6, hash(slice * 1.7));
    float wave = sin(vUv.y * 38.0 + uTime * 5.0) * 0.002 * uHover;
    float split = 0.0035 * uHover + 0.018 * uGlitch;
    vec2 uv = vUv + vec2(jitter + wave, 0.0);

    vec3 col;
    col.r = media(uv + vec2(split, 0.0)).r;
    col.g = media(uv).g;
    col.b = media(uv - vec2(split, 0.0)).b;

    col *= 0.96 + 0.04 * sin(vUv.y * uSize.y * 220.0);

    // side cards fade toward the white backdrop, like distance haze
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 muted = mix(vec3(lum), vec3(0.97, 0.97, 0.98), 0.55);
    col = mix(muted, col, 0.25 + 0.75 * uFocus);

    float edge = 1.0 - smoothstep(0.0, 0.07, -d);
    col = mix(col, uAccent, edge * (0.3 + 0.5 * uHover) * (0.4 + 0.6 * uFocus));
    col *= mix(0.9, 1.0, smoothstep(0.95, 0.25, length(vUv - 0.5) * 1.25));

    gl_FragColor = vec4(col, mask * uOpacity);
    #include <colorspace_fragment>
  }
`;

// Soft blurred drop shadow so cards read as floating above the white backdrop.
const shadowFragment = /* glsl */ `
  uniform vec2 uSize;
  uniform float uOpacity;
  varying vec2 vUv;

  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = roundedBox(p, uSize * 0.5 - 0.45, 0.3);
    float a = 1.0 - smoothstep(-0.1, 0.45, d);
    gl_FragColor = vec4(0.06, 0.08, 0.16, a * 0.2 * uOpacity);
  }
`;

const shadowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface ProjectCardProps {
  project: Project;
  /** Position in the filtered carousel, or -1 when filtered out. */
  slot: number;
  index: number;
  open: boolean;
  /** Horizontal offset of the zig-zag (0 = cards stacked in the centre). */
  sideX: number;
  reducedMotion: boolean;
  /** Cards within this many slots of focus stream their video (smaller on phones). */
  videoRange: number;
  onSelect: (slug: string, slot: number) => void;
}

export function ProjectCard({
  project,
  slot,
  index,
  open,
  sideX,
  reducedMotion,
  videoRange,
  onSelect,
}: ProjectCardProps) {
  const rigRef = useRig();
  const groupRef = useRef<Group>(null);
  const screenRef = useRef<ShaderMaterial>(null);
  const frameRef = useRef<MeshPhysicalMaterial>(null);
  const shadowRef = useRef<ShaderMaterial>(null);
  const lastSlot = useRef(Math.max(slot, 0));
  const placed = useRef<{ x: number; y: number } | null>(null);
  const visibility = useRef(0);
  const hover = useRef({ active: false, amount: 0, uv: new Vector2(0.5, 0.5) });
  const videoMix = useRef(0);
  const [videoActive, setVideoActive] = useState(false);

  const media = projectMedia(project.slug);
  const poster = usePosterTexture(media.poster);
  const video = useCardVideo(media.card, videoActive);

  useEffect(() => {
    const r = rigRef.current;
    if (poster?.accent && r) r.accents.set(project.slug, poster.accent);
  }, [poster, project.slug, rigRef]);

  const uniforms = useMemo(
    () => ({
      uPoster: { value: null },
      uVideo: { value: null },
      uHasPoster: { value: 0 },
      uVideoMix: { value: 0 },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uFocus: { value: 1 },
      uOpacity: { value: 0 },
      uGlitch: { value: 0 },
      uSize: { value: new Vector2(CARD_W, CARD_H) },
      uRadius: { value: 0.16 },
      uAccent: { value: new Color("#7fe8ff") },
      uPointer: { value: new Vector2(0.5, 0.5) },
    }),
    [],
  );
  const shadowUniforms = useMemo(
    () => ({ uSize: { value: new Vector2(CARD_W + 0.9, CARD_H + 0.9) }, uOpacity: { value: 0 } }),
    [],
  );

  useFrame((state, delta) => {
    const r = rigRef.current;
    const group = groupRef.current;
    const screen = screenRef.current;
    const frame = frameRef.current;
    const shadow = shadowRef.current;
    if (!r || !group || !screen || !frame || !shadow) return;
    const dt = Math.min(delta, 1 / 20);
    const fast = reducedMotion ? 60 : 1;

    if (slot >= 0) lastSlot.current = slot;
    visibility.current = MathUtils.damp(visibility.current, slot >= 0 ? 1 : 0, 4 * fast, dt);
    const vis = visibility.current;

    // glide to the new slot when filters or pins re-order the list
    const home = slotPosition(lastSlot.current, sideX);
    const p = (placed.current ??= { x: home.x, y: home.y });
    p.x = MathUtils.damp(p.x, home.x, 5 * fast, dt);
    p.y = MathUtils.damp(p.y, home.y, 5 * fast, dt);

    const a = Math.abs(lastSlot.current - r.current);
    const focus = 1 - Math.min(a, 1);
    const drift = reducedMotion ? 0 : 1;

    let x = p.x;
    let y = p.y + Math.sin(r.time * 0.6 + index * 1.7) * 0.06 * drift - (1 - vis) * 1.5;
    let z = -Math.min(a, 2) * 1.2 - (1 - vis) * 6;
    // angled in toward the robot, turning further away when out of focus
    let rotY = sideX > 0 ? -home.side * 0.32 * (1 + Math.min(a, 1) * 0.35) : 0;

    const dp = r.detail;
    const eased = dp * dp * (3 - 2 * dp);
    if (open) {
      const cam = state.camera.position;
      x = MathUtils.lerp(x, cam.x + (sideX > 0 ? 0.5 : 0), eased);
      y = MathUtils.lerp(y, cam.y, eased);
      z = MathUtils.lerp(z, 4.4, eased);
      rotY = MathUtils.lerp(rotY, 0, eased);
    } else {
      x += home.side * eased * 6;
      z -= eased * 5;
    }

    const tilt = focus * (1 - dp) * drift;
    group.position.set(x, y, z);
    group.rotation.set(-r.pointer.y * 0.12 * tilt, rotY + r.pointer.x * 0.16 * tilt, 0);
    group.scale.setScalar(1 - Math.min(a, 2) * 0.05);

    const fadeOut = open ? 1 - MathUtils.smoothstep(dp, 0.72, 0.98) : 1 - dp;
    const opacity = vis * fadeOut * (1 - MathUtils.smoothstep(a, 2.2, 3.2));
    group.visible = opacity > 0.002;
    frame.opacity = opacity;
    // a fading frame must not keep writing depth, or it punches card-shaped holes in the particles
    frame.depthWrite = opacity > 0.99;
    shadow.uniforms.uOpacity.value = opacity * (1 - dp);

    const h = hover.current;
    h.amount = MathUtils.damp(h.amount, h.active && !reducedMotion ? 1 : 0, 6, dt);

    const u = screen.uniforms;
    u.uOpacity.value = opacity;
    u.uFocus.value = focus;
    u.uTime.value = r.time;
    u.uHover.value = h.amount;
    u.uPointer.value.copy(h.uv);
    u.uGlitch.value = reducedMotion ? 0 : r.glitch * (0.3 + 0.7 * focus);
    u.uPoster.value = poster?.texture ?? null;
    u.uHasPoster.value = poster ? 1 : 0;
    u.uVideo.value = video;
    videoMix.current = MathUtils.damp(videoMix.current, video ? 1 : 0, 3, dt);
    u.uVideoMix.value = videoMix.current;
    const accent = r.accents.get(project.slug);
    if (accent) u.uAccent.value.copy(accent);

    if ((open || !group.visible) && hover.current.active) {
      hover.current.active = false;
      document.body.style.cursor = "";
    }

    const shouldPlay = !reducedMotion && vis > 0.5 && a < videoRange && dp < 0.6;
    if (shouldPlay !== videoActive) setVideoActive(shouldPlay);
  });

  const selectable = slot >= 0;

  return (
    <group
      ref={groupRef}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!selectable || !groupRef.current?.visible) return;
        e.stopPropagation();
        onSelect(project.slug, slot);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (!selectable || !groupRef.current?.visible) return;
        e.stopPropagation();
        hover.current.active = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hover.current.active = false;
        document.body.style.cursor = "";
      }}
    >
      <mesh position={[0, -0.22, -0.5]} raycast={() => null}>
        <planeGeometry args={[CARD_W + 0.9, CARD_H + 0.9]} />
        <shaderMaterial
          ref={shadowRef}
          uniforms={shadowUniforms}
          vertexShader={shadowVertex}
          fragmentShader={shadowFragment}
          transparent
          depthWrite={false}
        />
      </mesh>
      {/* a glass slab: depth must be >= 2x radius or RoundedBox folds its extrusion inside-out */}
      <RoundedBox args={[CARD_W + 0.16, CARD_H + 0.16, 0.4]} radius={0.2} smoothness={5} position={[0, 0, -0.21]}>
        <meshPhysicalMaterial
          ref={frameRef}
          color="#eef0f5"
          metalness={0.25}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.08}
          iridescence={1}
          iridescenceIOR={1.6}
          iridescenceThicknessRange={[120, 780]}
          envMapIntensity={1.3}
          transparent
          opacity={0}
        />
      </RoundedBox>
      <mesh
        position={[0, 0, 0.015]}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (e.uv) hover.current.uv.copy(e.uv);
        }}
      >
        <planeGeometry args={[CARD_W, CARD_H, 48, 27]} />
        <shaderMaterial
          ref={screenRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
