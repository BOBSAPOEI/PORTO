"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { Color, SRGBColorSpace, TextureLoader, Vector2, VideoTexture } from "three";
import type { Texture } from "three";

/** Per-frame values shared by everything inside the Canvas. Mutated only inside useFrame. */
export interface Rig {
  /** Damped carousel slot. */
  current: number;
  /** 0 = gallery, 1 = project opened. */
  detail: number;
  /** Decaying 0..1 burst used for glitch / chromatic aberration. */
  glitch: number;
  /** Damped pointer in -1..1. */
  pointer: Vector2;
  time: number;
  /** Damped horizontal camera offset toward the focused card's side. */
  camX: number;
  /** -1 / 1 when the focused card sits left / right of the robot, 0 when stacked. */
  focusSide: number;
  /** Accent colour sampled from each poster, keyed by slug. */
  accents: Map<string, Color>;
}

export function createRig(): Rig {
  return {
    current: 0,
    detail: 0,
    glitch: 0,
    pointer: new Vector2(),
    time: 0,
    camX: 0,
    focusSide: 0,
    accents: new Map(),
  };
}

export const RigContext = createContext<RefObject<Rig> | null>(null);

export function useRig() {
  const rig = useContext(RigContext);
  if (!rig) throw new Error("useRig must be used inside the projects scene");
  return rig;
}

/** Average colour weighted by saturation, pushed to a vivid glow-friendly tone. */
function extractAccent(image: CanvasImageSource) {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let r = 0;
  let g = 0;
  let b = 0;
  let weight = 0;
  for (let i = 0; i < data.length; i += 4) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    const w = (max - min) / 255 + 0.02;
    r += data[i] * w;
    g += data[i + 1] * w;
    b += data[i + 2] * w;
    weight += w;
  }
  const color = new Color().setRGB(r / weight / 255, g / weight / 255, b / weight / 255, SRGBColorSpace);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  return color.setHSL(hsl.h, Math.max(hsl.s, 0.6), Math.min(Math.max(hsl.l, 0.52), 0.66));
}

export function usePosterTexture(url: string) {
  const [state, setState] = useState<{ texture: Texture; accent: Color | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loaded: Texture | null = null;
    new TextureLoader().load(
      url,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = 8;
        loaded = texture;
        setState({ texture, accent: extractAccent(texture.image as CanvasImageSource) });
      },
      undefined,
      () => {
        // missing poster: the card shader falls back to an accent gradient
      },
    );
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [url]);

  return state;
}

/**
 * Lazily streams a looping muted video into a texture. The element is created up front with
 * preload="none" so nothing downloads until the card becomes active.
 */
export function useCardVideo(src: string, active: boolean) {
  const [texture, setTexture] = useState<VideoTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<VideoTexture | null>(null);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.crossOrigin = "anonymous";
    videoRef.current = video;
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      textureRef.current?.dispose();
      textureRef.current = null;
      videoRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!active) {
      video.pause();
      return;
    }
    const onPlaying = () => {
      if (textureRef.current) return;
      const tex = new VideoTexture(video);
      tex.colorSpace = SRGBColorSpace;
      textureRef.current = tex;
      setTexture(tex);
    };
    video.addEventListener("playing", onPlaying);
    video.play().catch(() => {
      // autoplay refused or file missing: the poster stays visible
    });
    return () => video.removeEventListener("playing", onPlaying);
  }, [active, src]);

  return texture;
}
