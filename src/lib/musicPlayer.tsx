"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export const MUSIC_PLAYER_EL_ID = "yt-audio-player";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
}

export const PLAYLIST: MusicTrack[] = [
  { id: "T3yFXpKaHGw", title: "Reckless (Live)", artist: "Madison Beer" },
  { id: "4NRXx6U8ABQ", title: "Blinding Lights", artist: "The Weeknd" },
  { id: "H5v3kku4y6Q", title: "As It Was", artist: "Harry Styles" },
  { id: "TUVcZfQe-Kw", title: "Levitating", artist: "Dua Lipa" },
  { id: "2Vv-BfVoq4g", title: "Perfect", artist: "Ed Sheeran" },
];

export function trackThumbnail(track: MusicTrack) {
  return `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
}

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (
    elementId: string,
    options: {
      videoId: string;
      playerVars?: Record<string, number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface MusicPlayerState {
  ready: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  track: MusicTrack;
  trackIndex: number;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  selectTrack: (index: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerState | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);
  const trackIndexRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);

  function loadTrack(index: number, autoplay: boolean) {
    const p = playerRef.current;
    if (!p) return;
    trackIndexRef.current = index;
    setTrackIndex(index);
    setCurrentTime(0);
    if (autoplay) p.loadVideoById(PLAYLIST[index].id);
    else p.cueVideoById(PLAYLIST[index].id);
    window.setTimeout(() => {
      const cur = playerRef.current;
      if (cur && typeof cur.getDuration === "function") setDuration(cur.getDuration());
    }, 400);
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Created imperatively (outside JSX) so the YouTube IFrame API can freely
    // replace this node with an <iframe> without React's reconciler ever
    // seeing or touching it — avoids DOM-mismatch crashes when sibling
    // layout content (pages, AnimatePresence) re-renders around it.
    const mount = document.createElement("div");
    mount.id = MUSIC_PLAYER_EL_ID;
    mount.style.position = "fixed";
    mount.style.left = "0";
    mount.style.top = "0";
    mount.style.width = "1px";
    mount.style.height = "1px";
    mount.style.opacity = "0";
    mount.style.pointerEvents = "none";
    document.body.appendChild(mount);

    function createPlayer() {
      playerRef.current = new window.YT!.Player(MUSIC_PLAYER_EL_ID, {
        videoId: PLAYLIST[trackIndexRef.current].id,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => {
            const YT = window.YT!;
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
            else if (e.data === YT.PlayerState.ENDED) {
              loadTrack((trackIndexRef.current + 1) % PLAYLIST.length, true);
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        createPlayer();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (playing) {
      pollRef.current = setInterval(() => {
        const p = playerRef.current;
        if (!p || typeof p.getCurrentTime !== "function") return;
        setCurrentTime(p.getCurrentTime());
        setDuration(p.getDuration());
      }, 400);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [playing]);

  function toggle() {
    if (!ready || !playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }

  function next() {
    if (!ready || !playerRef.current) return;
    loadTrack((trackIndex + 1) % PLAYLIST.length, playing);
  }

  function prev() {
    if (!ready || !playerRef.current) return;
    loadTrack((trackIndex - 1 + PLAYLIST.length) % PLAYLIST.length, playing);
  }

  function selectTrack(index: number) {
    if (!ready || !playerRef.current || index === trackIndex) return;
    loadTrack(index, true);
  }

  return (
    <MusicPlayerContext.Provider
      value={{
        ready,
        playing,
        currentTime,
        duration,
        track: PLAYLIST[trackIndex],
        trackIndex,
        toggle,
        next,
        prev,
        selectTrack,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  return ctx;
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
