"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { ChromaticAberrationEffect } from "postprocessing";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { MathUtils, Vector2, Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import type { Project } from "@/types";
import { Tunnel } from "./Backdrop";
import { CARD_W, STEP, slotPosition } from "./data";
import type { NavState } from "./data";
import { Nebula } from "./Nebula";
import { ProjectCard } from "./ProjectCard";
import { createRig, RigContext, useRig } from "./rig";
import { Robot } from "./Robot";

export interface SceneProps {
  projects: Project[];
  slots: Record<string, number>;
  maxSlot: number;
  navRef: RefObject<NavState>;
  pointerRef: RefObject<{ x: number; y: number }>;
  openSlug: string | null;
  reducedMotion: boolean;
  titleAnchorRef: RefObject<HTMLDivElement | null>;
  onFocusChange: (slot: number) => void;
  onSelect: (slug: string, slot: number) => void;
}

const MAX_CONTEXT_RESTARTS = 3;
const BACKDROP = "#f7f7fa";
const CAM_SHIFT = 1.3;
const TAN_HALF_FOV = Math.tan(MathUtils.degToRad(15));

/** Zig-zag offset of the cards; narrow screens stack them in the centre. */
const sideXFor = (aspect: number) => (aspect >= 1.15 ? 2.4 : 0);

/** Keeps the drawing buffer inside a pixel budget so large / HiDPI screens don't exhaust GPU memory. */
function pixelRatioFor(width: number, height: number, deviceRatio: number, lowPower: boolean, open: boolean) {
  const budget = lowPower ? 1.6e6 : 3.6e6;
  const cap = Math.sqrt(budget / Math.max(width * height, 1));
  const ratio = Math.min(deviceRatio, lowPower ? 1.25 : 1.75, cap);
  // while a project is open the DOM video is the focus, so the backdrop can render softer
  return Math.max(0.5, open ? ratio * 0.6 : ratio);
}

export default function Scene(props: SceneProps) {
  const [lowPower] = useState(
    () => window.matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4,
  );
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.devicePixelRatio,
  }));
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight, ratio: window.devicePixelRatio });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => () => void (document.body.style.cursor = ""), []);

  // Passed as the Canvas prop (not set imperatively): R3F re-applies `dpr` on every render.
  const dpr = pixelRatioFor(viewport.width, viewport.height, viewport.ratio, lowPower, props.openSlug !== null);

  return (
    <Canvas
      key={generation}
      dpr={dpr}
      camera={{ position: [0, 0, 9.5], fov: 30, near: 0.1, far: 140 }}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
      onCreated={({ gl }) => {
        // Rebuild the canvas after a GPU reset: render targets like the captured environment map don't
        // survive even a quick restore, and an unrestored context would leave the page blank.
        const rebuild = () => setGeneration((g) => Math.min(g + 1, MAX_CONTEXT_RESTARTS));
        gl.domElement.addEventListener(
          "webglcontextlost",
          () => {
            window.setTimeout(() => {
              if (gl.getContext().isContextLost()) rebuild();
            }, 800);
          },
          { once: true },
        );
        gl.domElement.addEventListener("webglcontextrestored", rebuild, { once: true });
      }}
      aria-hidden="true"
    >
      <SceneContents {...props} lowPower={lowPower} />
    </Canvas>
  );
}

/** Memoised: drei re-captures the cube map whenever Environment's children change identity. */
const StudioEnvironment = memo(function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      {/* light studio so ceramic, chrome and frames read pearly on the white page */}
      <color attach="background" args={["#a7afbf"]} />
      {/* white softboxes do the lighting; colour stays as rim accents so the ceramic reads white */}
      <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 6, 3]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
      <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[0, 0, 8]} scale={[12, 3, 1]} />
      <Lightformer form="rect" intensity={2.2} color="#ff4fd8" position={[-6, 2, 1]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
      <Lightformer form="rect" intensity={2} color="#4fe3ff" position={[6, -1, 1]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
      <Lightformer form="ring" intensity={1.5} color="#7dffb2" position={[0, 6, -3]} rotation-x={Math.PI / 2} scale={3} />
      <Lightformer form="rect" intensity={1} color="#b06bff" position={[0, -5, -4]} rotation-x={-Math.PI / 2} scale={[10, 6, 1]} />
    </Environment>
  );
});

function SceneContents(props: SceneProps & { lowPower: boolean }) {
  const { projects, slots, openSlug, reducedMotion, lowPower, onSelect } = props;
  const rigRef = useRef(createRig());
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const sideX = sideXFor(width / Math.max(height, 1));

  return (
    <RigContext.Provider value={rigRef}>
      <color attach="background" args={[BACKDROP]} />
      <fog attach="fog" args={[BACKDROP, 18, 52]} />
      <Director {...props} />

      <StudioEnvironment />
      <directionalLight position={[3, 4, 6]} intensity={0.95} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#cfe0ff" />

      <Nebula count={lowPower ? 5000 : 14000} reducedMotion={reducedMotion} />
      <Robot reducedMotion={reducedMotion} />
      <Tunnel openSlug={openSlug} reducedMotion={reducedMotion} />

      {projects.map((project, index) => (
        <ProjectCard
          key={project.slug}
          project={project}
          slot={slots[project.slug] ?? -1}
          index={index}
          open={openSlug === project.slug}
          sideX={sideX}
          reducedMotion={reducedMotion}
          videoRange={lowPower ? 0.5 : 1.2}
          onSelect={onSelect}
        />
      ))}

      <Effects reducedMotion={reducedMotion} lowPower={lowPower} />
    </RigContext.Provider>
  );
}

function Director({
  navRef,
  pointerRef,
  openSlug,
  reducedMotion,
  maxSlot,
  titleAnchorRef,
  onFocusChange,
}: SceneProps) {
  const rigRef = useRig();
  const lastFocus = useRef(-1);
  const lastOpen = useRef<string | null>(null);
  const anchor = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const r = rigRef.current;
    const n = navRef.current;
    const p = pointerRef.current;
    if (!r || !n || !p) return;
    const dt = Math.min(delta, 1 / 20);
    const fast = reducedMotion ? 60 : 1;

    r.time += dt;
    r.current = MathUtils.damp(r.current, n.target, 5 * fast, dt);
    n.current = r.current;
    r.detail = MathUtils.damp(r.detail, openSlug ? 1 : 0, 3.2 * fast, dt);
    r.pointer.x = MathUtils.damp(r.pointer.x, reducedMotion ? 0 : p.x, 3, dt);
    r.pointer.y = MathUtils.damp(r.pointer.y, reducedMotion ? 0 : p.y, 3, dt);

    if (openSlug !== lastOpen.current) {
      lastOpen.current = openSlug;
      if (!reducedMotion) r.glitch = 1;
    }
    const focus = MathUtils.clamp(Math.round(r.current), 0, Math.max(maxSlot, 0));
    if (focus !== lastFocus.current) {
      const initial = lastFocus.current < 0;
      lastFocus.current = focus;
      onFocusChange(focus);
      if (!reducedMotion && !initial) r.glitch = Math.max(r.glitch, 0.45);
    }
    r.glitch = Math.max(0, r.glitch - dt * 2.4);

    // the camera rides down the robot, leaning toward the side the focused card is on
    const aspect = state.size.width / Math.max(state.size.height, 1);
    const sideX = sideXFor(aspect);
    const home = slotPosition(focus, sideX);
    r.focusSide = sideX > 0 ? home.side : 0;
    r.camX = MathUtils.damp(r.camX, r.focusSide * CAM_SHIFT, 2.5 * fast, dt);
    const halfWidth = sideX > 0 ? sideX + CARD_W / 2 - CAM_SHIFT + 0.6 : CARD_W / 0.86 / 2;
    const fitZ = (2 * halfWidth) / aspect / (2 * TAN_HALF_FOV);
    const camY = -r.current * STEP;

    const camera = state.camera as PerspectiveCamera;
    camera.position.set(r.camX + r.pointer.x * 0.35, camY + r.pointer.y * 0.22, Math.max(9.5, fitZ));
    camera.lookAt(r.camX, camY, -2);
    camera.updateMatrixWorld();

    const el = titleAnchorRef.current;
    if (el) {
      anchor.set(home.x, home.y, 0).project(camera);
      const x = (anchor.x * 0.5 + 0.5) * state.size.width;
      const y = (-anchor.y * 0.5 + 0.5) * state.size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
  }, -1);

  return null;
}

function Effects({ reducedMotion, lowPower }: { reducedMotion: boolean; lowPower: boolean }) {
  const rigRef = useRig();
  const aberration = useRef<ChromaticAberrationEffect>(null);
  const initialOffset = useMemo(() => new Vector2(0.0007, 0.0005), []);

  useFrame(() => {
    const r = rigRef.current;
    const effect = aberration.current;
    if (!r || !effect) return;
    const k = reducedMotion ? 0 : 0.0006 + r.glitch * 0.0045;
    effect.offset.set(k, k * 0.6);
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* threshold at 1: the white page never blooms, only HDR highlights (robot glow, chrome) do */}
      <Bloom mipmapBlur intensity={lowPower ? 0.4 : 0.55} luminanceThreshold={1} luminanceSmoothing={0.1} />
      <ChromaticAberration ref={aberration} offset={initialOffset} radialModulation modulationOffset={0.3} />
      <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={reducedMotion ? 0 : 0.1} />
      <Vignette offset={0.3} darkness={0.25} />
    </EffectComposer>
  );
}
