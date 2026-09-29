"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CityModel } from "@/components/shared/CityModel";
import { cn } from "@/lib/utils";

interface Scene3DProps {
  className?: string;
  reducedMotion?: boolean;
  interactive?: boolean;
}

export function Scene3D({ className, reducedMotion, interactive = true }: Scene3DProps) {
  return (
    <div className={cn(interactive ? "pointer-events-auto" : "pointer-events-none", className)}>
      <Canvas
        camera={{ position: [0, 0, 3.6], fov: 45 }}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
        performance={{ min: 0.3 }}
        style={{ background: "transparent", pointerEvents: interactive ? "auto" : "none" }}
      >
        <Suspense fallback={null}>
          <CityModel reducedMotion={reducedMotion} interactive={interactive} />
        </Suspense>
      </Canvas>
    </div>
  );
}
