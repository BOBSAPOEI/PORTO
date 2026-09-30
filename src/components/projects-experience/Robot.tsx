"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Ref, RefObject } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LatheGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  Shape,
  ShapeUtils,
  Vector2,
  Vector3,
} from "three";
import type { Group, Material, Texture, WebGLRenderer } from "three";
import { STEP } from "./data";
import { useRig } from "./rig";

/**
 * Authored ~1.95 units tall (feet at y=0). It acts as a guide: framed head-to-knees, it glides down with
 * the camera and stands on the side opposite the focused card, turning to present it.
 */
const SCALE = 3.7;
const CHEST_Y = 1.42;
const GUIDE_X = 1.9;
const BASE_Z = -3.2;

// ---------------------------------------------------------------- hard-surface armour panels
type Outline = [number, number][];

/** Full outline from its right half, drawn from the top centre down to the bottom centre. */
const symmetric = (half: Outline): Outline => [
  ...half,
  ...half
    .slice(1, -1)
    .reverse()
    .map(([x, y]): [number, number] => [-x, y]),
];
const mirrored = (outline: Outline): Outline => outline.map(([x, y]) => [-x, y]);

interface PlateGeometry {
  geometry: BufferGeometry;
  /** distance from the axis the plate wraps around (its horizontal bend radius) */
  radius: number;
}

const BEVEL_SEGMENTS = 3;

/**
 * Hard-surface armour panel: a front-view silhouette with a rounded bevel all round, wrapped onto the
 * body — x/y are arc lengths bent around a vertical axis `bendX` and a horizontal axis `bendY` behind
 * the plate. Normals are analytic (flat panel normals carried through the bend) and the caps are
 * triangulated over an interior grid, so the chrome reflections stay perfectly smooth.
 */
function armorPlate(outline: Outline, bendX: number, bendY = 0, thickness = 0.013, bevel = 0.003): PlateGeometry {
  const step = MathUtils.clamp(Math.min(bendX || 1, bendY || 1) * 0.1, 0.0025, 0.007);
  const corners = outline.map(([x, y]) => new Vector2(x, y));
  if (ShapeUtils.isClockWise(corners)) corners.reverse();
  const contour: Vector2[] = [];
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % corners.length];
    const segments = Math.max(1, Math.ceil(a.distanceTo(b) / step));
    for (let k = 0; k < segments; k++) contour.push(a.clone().lerp(b, k / segments));
  });
  const count = contour.length;
  // outward (miter) normal per contour point; counter-clockwise, so outward is to the right
  const outward = contour.map((point, i) => {
    const incoming = point.clone().sub(contour[(i + count - 1) % count]).normalize();
    const outgoing = contour[(i + 1) % count].clone().sub(point).normalize();
    const n1 = new Vector2(incoming.y, -incoming.x);
    const n = n1.clone().add(new Vector2(outgoing.y, -outgoing.x)).normalize();
    return { n, miter: 1 / Math.max(n.dot(n1), 0.5) };
  });

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const vertex = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    const length = Math.hypot(nx, ny, nz) || 1;
    positions.push(x, y, z);
    normals.push(nx / length, ny / length, nz / length);
    return positions.length / 3 - 1;
  };
  // wound so the face agrees with its vertex normals
  const triangle = (a: number, b: number, c: number) => {
    const [ax, ay, az] = positions.slice(a * 3, a * 3 + 3);
    const [bx, by, bz] = positions.slice(b * 3, b * 3 + 3);
    const [cx, cy, cz] = positions.slice(c * 3, c * 3 + 3);
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const facing =
      (uy * vz - uz * vy) * (normals[a * 3] + normals[b * 3] + normals[c * 3]) +
      (uz * vx - ux * vz) * (normals[a * 3 + 1] + normals[b * 3 + 1] + normals[c * 3 + 1]) +
      (ux * vy - uy * vx) * (normals[a * 3 + 2] + normals[b * 3 + 2] + normals[c * 3 + 2]);
    if (facing < 0) indices.push(a, c, b);
    else indices.push(a, b, c);
  };

  // rim: rounded front edge, straight side wall, rounded back edge
  const rings: { inset: number; z: number; nr: number; nz: number }[] = [];
  for (let k = 0; k <= BEVEL_SEGMENTS; k++) {
    const t = (k / BEVEL_SEGMENTS) * (Math.PI / 2);
    rings.push({ inset: bevel * (1 - Math.sin(t)), z: thickness - bevel + bevel * Math.cos(t), nr: Math.sin(t), nz: Math.cos(t) });
  }
  for (let k = BEVEL_SEGMENTS; k >= 0; k--) {
    const t = (k / BEVEL_SEGMENTS) * (Math.PI / 2);
    rings.push({ inset: bevel * (1 - Math.sin(t)), z: bevel - bevel * Math.cos(t), nr: Math.sin(t), nz: -Math.cos(t) });
  }
  const ringStarts = rings.map((ring) => {
    const start = positions.length / 3;
    contour.forEach((point, i) => {
      const { n, miter } = outward[i];
      const d = ring.inset * miter;
      vertex(point.x - n.x * d, point.y - n.y * d, ring.z, n.x * ring.nr, n.y * ring.nr, ring.nz);
    });
    return start;
  });
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const a = ringStarts[r] + i;
      const b = ringStarts[r] + j;
      const c = ringStarts[r + 1] + j;
      const d = ringStarts[r + 1] + i;
      triangle(a, b, c);
      triangle(a, c, d);
    }
  }

  // caps: rings from the centre out to the inset outline (every outline is star-shaped about its
  // centroid), giving the bend interior vertices to follow without slivers or T-junctions
  const inset = contour.map((point, i) => point.clone().addScaledVector(outward[i].n, -bevel * outward[i].miter));
  let area = 0;
  const centre = new Vector2();
  inset.forEach((a, i) => {
    const b = inset[(i + 1) % count];
    const cross = a.x * b.y - b.x * a.y;
    area += cross;
    centre.x += (a.x + b.x) * cross;
    centre.y += (a.y + b.y) * cross;
  });
  centre.divideScalar(3 * area);
  const steps = Math.max(1, Math.ceil(Math.max(...inset.map((point) => point.distanceTo(centre))) / step));
  for (const [z, nz] of [
    [thickness, 1],
    [0, -1],
  ]) {
    const middle = vertex(centre.x, centre.y, z, 0, 0, nz);
    const start = positions.length / 3;
    for (let k = 1; k <= steps; k++) {
      inset.forEach((point) => {
        const q = centre.clone().lerp(point, k / steps);
        vertex(q.x, q.y, z, 0, 0, nz);
      });
    }
    const at = (k: number, i: number) => start + (k - 1) * count + (i % count);
    for (let i = 0; i < count; i++) {
      triangle(middle, at(1, i), at(1, i + 1));
      for (let k = 1; k < steps; k++) {
        triangle(at(k, i), at(k, i + 1), at(k + 1, i + 1));
        triangle(at(k, i), at(k + 1, i + 1), at(k + 1, i));
      }
    }
  }

  // wrap: positions onto the bend, normals rotated with the surface they sit on
  for (let i = 0; i < positions.length; i += 3) {
    let x = positions[i];
    let y = positions[i + 1];
    let z = positions[i + 2];
    let nx = normals[i];
    let ny = normals[i + 1];
    let nz = normals[i + 2];
    if (bendX > 0) {
      const a = x / bendX;
      const r = bendX + z;
      x = r * Math.sin(a);
      z = r * Math.cos(a) - bendX;
      [nx, nz] = [nx * Math.cos(a) + nz * Math.sin(a), -nx * Math.sin(a) + nz * Math.cos(a)];
    }
    if (bendY > 0) {
      const b = y / bendY;
      const r = bendY + z;
      y = r * Math.sin(b);
      z = r * Math.cos(b) - bendY;
      [ny, nz] = [ny * Math.cos(b) + nz * Math.sin(b), -ny * Math.sin(b) + nz * Math.cos(b)];
    }
    positions[i] = x;
    positions[i + 1] = y;
    positions[i + 2] = z;
    normals[i] = nx;
    normals[i + 1] = ny;
    normals[i + 2] = nz;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return { geometry, radius: bendX };
}

/** Surface of revolution from [radius, y] pairs. */
const lathe = (profile: Outline, segments = 48) =>
  new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r, y)),
    segments,
  );

// torso, drawn around each plate's own centre
const PEC: Outline = [
  [0.016, 0.085], [0.06, 0.102], [0.1, 0.098], [0.132, 0.068], [0.15, 0.015], [0.14, -0.035], [0.105, -0.075],
  [0.058, -0.095], [0.026, -0.088], [0.016, -0.05], [0.03, -0.028], [0.03, 0.022], [0.016, 0.038],
];
const RIB_UPPER: Outline = [[0.03, 0.003], [0.095, 0.018], [0.13, 0.036], [0.132, 0.02], [0.1, 0.0], [0.035, -0.015]];
const RIB_LOWER: Outline = [[0.035, 0.008], [0.09, 0.02], [0.12, 0.034], [0.12, 0.018], [0.093, 0.002], [0.04, -0.01]];
const LAT = symmetric([[0, 0.075], [0.035, 0.065], [0.045, 0.0], [0.03, -0.065], [0, -0.08]]);
const BACK = symmetric([[0, 0.1], [0.07, 0.095], [0.115, 0.06], [0.125, -0.02], [0.085, -0.1], [0, -0.115]]);
const OBLIQUE = symmetric([[0, 0.07], [0.028, 0.062], [0.034, -0.01], [0.024, -0.07], [0, -0.078]]);
const GROIN = symmetric([[0, 0.02], [0.07, 0.016], [0.082, -0.012], [0.045, -0.06], [0.016, -0.094], [0, -0.1]]);
const HIP = symmetric([[0, 0.035], [0.045, 0.028], [0.05, -0.04], [0.032, -0.095], [0, -0.1]]);
// head: mask + details laid onto it
const FACE = symmetric([
  [0, 0.055], [0.042, 0.052], [0.07, 0.03], [0.078, -0.005], [0.066, -0.04], [0.044, -0.068], [0.02, -0.09], [0, -0.094],
]);
const EYE_SOCKET: Outline = [[0.008, 0.018], [0.05, 0.032], [0.07, 0.026], [0.064, 0.006], [0.012, 0.0]];
const EYE_GLOW: Outline = [[0.015, 0.015], [0.048, 0.027], [0.062, 0.023], [0.058, 0.01], [0.017, 0.006]];
const CHEEK_SEAM: Outline = [[0.055, -0.005], [0.06, -0.008], [0.042, -0.058], [0.037, -0.055]];
const GRILL = [0.022, 0.018, 0.013].map((w, i): Outline => {
  const y = -0.048 - i * 0.01;
  return symmetric([[0, y + 0.0028], [w, y + 0.0028], [w - 0.002, y - 0.0028], [0, y - 0.0028]]);
});
// crest running from the brow back over the crown (y = arc length around the helmet)
const CREST = symmetric([[0, 0.25], [0.006, 0.245], [0.01, 0.07], [0.005, 0.045], [0, 0.042]]);
const HELMET_R = 0.097;
const FACE_Y = 0.108;
const FACE_Z = 0.098;
const FACE_RX = 0.07;
const FACE_RY = 0.16;
const DECAL = 0.011;
// shoulder, arm and leg
const PAULDRON = symmetric([[0, 0.1], [0.045, 0.094], [0.074, 0.055], [0.08, 0.0], [0.064, -0.035], [0, -0.042]]);
const LAME_UPPER = symmetric([[0, -0.028], [0.066, -0.026], [0.068, -0.05], [0, -0.054]]);
const LAME_LOWER = symmetric([[0, -0.048], [0.06, -0.046], [0.062, -0.068], [0, -0.072]]);
const ARM_GUARD = symmetric([[0, 0.055], [0.026, 0.05], [0.03, -0.045], [0, -0.06]]);
const FOREARM_GUARD = symmetric([[0, 0.07], [0.03, 0.058], [0.034, -0.05], [0.02, -0.075], [0, -0.08]]);
const GLOW_LINE = symmetric([[0, 0.048], [0.0022, 0.048], [0.0022, -0.048], [0, -0.048]]);
const THIGH_PLATE = symmetric([[0, 0.09], [0.042, 0.08], [0.046, -0.07], [0.03, -0.12], [0, -0.13]]);
const KNEE_CAP = symmetric([[0, 0.04], [0.03, 0.032], [0.034, -0.015], [0.018, -0.04], [0, -0.044]]);
const GREAVE = symmetric([[0, 0.12], [0.036, 0.105], [0.034, -0.08], [0.02, -0.13], [0, -0.14]]);

// foot drawn side-on: x = forward, y = up; extruded across its width
const FOOT = new Shape(
  (
    [
      [-0.05, 0],
      [0.13, 0],
      [0.152, 0.024],
      [0.05, 0.058],
      [-0.042, 0.07],
    ] as Outline
  ).map(([x, y]) => new Vector2(x, y)),
);
const EXTRUDE_FOOT = { depth: 0.07, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 3, curveSegments: 1 };

function createGeometries() {
  const face = (outline: Outline, lift: number, thickness: number, bevel: number) =>
    armorPlate(outline, FACE_RX + lift, FACE_RY + lift, thickness, bevel);
  const plates = {
    pecR: armorPlate(PEC, 0.127, 0.34, 0.016, 0.0038),
    pecL: armorPlate(mirrored(PEC), 0.127, 0.34, 0.016, 0.0038),
    ribUpperR: armorPlate(RIB_UPPER, 0.114, 0.3),
    ribUpperL: armorPlate(mirrored(RIB_UPPER), 0.114, 0.3),
    ribLowerR: armorPlate(RIB_LOWER, 0.104, 0.3),
    ribLowerL: armorPlate(mirrored(RIB_LOWER), 0.104, 0.3),
    lat: armorPlate(LAT, 0.12, 0.45),
    back: armorPlate(BACK, 0.126, 0.4),
    oblique: armorPlate(OBLIQUE, 0.09, 0.5),
    groin: armorPlate(GROIN, 0.125, 0.25, 0.016, 0.0038),
    hip: armorPlate(HIP, 0.128, 0.35),
    face: armorPlate(FACE, FACE_RX, FACE_RY, 0.012, 0.003),
    crest: armorPlate(CREST, 0, HELMET_R, 0.012, 0.003),
    socketR: face(EYE_SOCKET, DECAL, 0.0024, 0.0007),
    socketL: face(mirrored(EYE_SOCKET), DECAL, 0.0024, 0.0007),
    eyeR: face(EYE_GLOW, DECAL + 0.0021, 0.0016, 0.0005),
    eyeL: face(mirrored(EYE_GLOW), DECAL + 0.0021, 0.0016, 0.0005),
    cheekR: face(CHEEK_SEAM, DECAL, 0.0016, 0.0005),
    cheekL: face(mirrored(CHEEK_SEAM), DECAL, 0.0016, 0.0005),
    grill0: face(GRILL[0], DECAL, 0.0016, 0.0005),
    grill1: face(GRILL[1], DECAL, 0.0016, 0.0005),
    grill2: face(GRILL[2], DECAL, 0.0016, 0.0005),
    pauldron: armorPlate(PAULDRON, 0.072, 0.072, 0.015, 0.0038),
    lameUpper: armorPlate(LAME_UPPER, 0.066, 0.066, 0.012, 0.003),
    lameLower: armorPlate(LAME_LOWER, 0.06, 0.06, 0.012, 0.003),
    armGuard: armorPlate(ARM_GUARD, 0.045, 0.6, 0.012, 0.003),
    forearmGuard: armorPlate(FOREARM_GUARD, 0.043, 0.7, 0.012, 0.003),
    forearmGlow: armorPlate(GLOW_LINE, 0.043 + 0.0115, 0.7 + 0.0115, 0.0015, 0.0004),
    thighPlate: armorPlate(THIGH_PLATE, 0.068, 0.8),
    kneeCap: armorPlate(KNEE_CAP, 0.046, 0.046),
    greave: armorPlate(GREAVE, 0.052, 1.0),
    greaveGlow: armorPlate(GLOW_LINE, 0.052 + 0.0125, 1.0 + 0.0125, 0.0015, 0.0004),
  };
  const lathes = {
    torso: lathe([
      [0.02, -0.165], [0.078, -0.16], [0.1, -0.13], [0.118, -0.07], [0.13, 0], [0.137, 0.07], [0.13, 0.12],
      [0.105, 0.158], [0.06, 0.18], [0.025, 0.188],
    ]),
    // flared mantle bridging the neck and the shoulders
    yoke: lathe([[0.058, 0.2], [0.09, 0.19], [0.124, 0.166], [0.146, 0.132], [0.143, 0.116]]),
    pelvis: lathe([[0.05, 0.075], [0.1, 0.06], [0.126, 0.02], [0.124, -0.03], [0.1, -0.075], [0.05, -0.1], [0.01, -0.105]]),
    sleeve: lathe([[0.03, -0.045], [0.041, -0.06], [0.043, -0.12], [0.039, -0.19], [0.032, -0.21]], 36),
    forearm: lathe([[0.028, -0.03], [0.038, -0.055], [0.041, -0.1], [0.034, -0.19], [0.027, -0.215]], 36),
    thigh: lathe([[0.045, -0.04], [0.062, -0.07], [0.066, -0.15], [0.056, -0.33], [0.046, -0.38]], 40),
    shin: lathe([[0.04, -0.035], [0.05, -0.08], [0.048, -0.22], [0.036, -0.37], [0.03, -0.4]], 40),
  };
  return { plates, lathes };
}

type Geometries = ReturnType<typeof createGeometries>;
type Plates = Geometries["plates"];
type Lathes = Geometries["lathes"];

// neck and abdomen cabling
const NECK_CABLES = [
  new CatmullRomCurve3([new Vector3(0.03, -0.02, -0.02), new Vector3(0.048, 0.04, -0.035), new Vector3(0.03, 0.085, -0.01)]),
  new CatmullRomCurve3([new Vector3(-0.03, -0.02, -0.02), new Vector3(-0.048, 0.04, -0.035), new Vector3(-0.03, 0.085, -0.01)]),
];
const ABDOMEN_CABLES = [0.035, -0.035, 0.06, -0.06].map(
  (x) =>
    new CatmullRomCurve3([
      new Vector3(x * 0.9, 0.12, 0.03),
      new Vector3(x * 1.35, 0.03, 0.055),
      new Vector3(x, -0.08, 0.035),
    ]),
);
// pistons fanning up toward the chest like exposed ribs: [x, z, lean]
const PISTONS: [number, number, number][] = [
  [0.018, 0.052, 0.05],
  [-0.018, 0.052, -0.05],
  [0.048, 0.044, 0.14],
  [-0.048, 0.044, -0.14],
];

// ---------------------------------------------------------------- materials + a neon environment just for the robot
function createNeonEnvironment(gl: WebGLRenderer) {
  const scene = new Scene();
  scene.background = new Color("#07080d");
  const panels: [string, number, [number, number], [number, number, number]][] = [
    ["#ff3fa4", 4, [4, 8], [-5, 1, 2]],
    ["#35d7ff", 4, [4, 8], [5, 0, 2]],
    ["#ffffff", 3, [8, 1.2], [0, 5, 2]],
    ["#7a5cff", 2, [6, 3], [0, -1, -5]],
    ["#35d7ff", 1.6, [3, 1], [-2, -4, 3]],
    ["#ff3fa4", 1.6, [2, 1], [3, 3, -3]],
    ["#ffffff", 1.2, [6, 2], [0, 1, 6]],
  ];
  for (const [color, strength, [w, h], position] of panels) {
    const mesh = new Mesh(
      new PlaneGeometry(w, h),
      new MeshBasicMaterial({ color: new Color(color).multiplyScalar(strength), side: DoubleSide }),
    );
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
  }
  const pmrem = new PMREMGenerator(gl);
  const target = pmrem.fromScene(scene, 0.03);
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      (o.material as MeshBasicMaterial).dispose();
    }
  });
  return target;
}

function createMaterials(env: Texture) {
  const glow = (color: string) =>
    new MeshStandardMaterial({ color: "#000000", emissive: new Color(color), emissiveIntensity: 0, toneMapped: false });
  return {
    // gunmetal armour with neon reflections
    steel: new MeshPhysicalMaterial({
      color: "#7d8aa2",
      metalness: 1,
      roughness: 0.3,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMap: env,
      envMapIntensity: 1.35,
    }),
    dark: new MeshPhysicalMaterial({ color: "#2a2f3a", metalness: 0.9, roughness: 0.36, envMap: env, envMapIntensity: 0.9 }),
    chrome: new MeshPhysicalMaterial({ color: "#dde2ec", metalness: 1, roughness: 0.08, envMap: env, envMapIntensity: 1.5 }),
    rubber: new MeshPhysicalMaterial({ color: "#15171c", metalness: 0.2, roughness: 0.6, envMap: env, envMapIntensity: 0.5 }),
    // #5fe8ff ~0.67 luminance / unit and #ff3d7a ~0.26 — intensities are set per frame to clear the bloom threshold
    eyes: glow("#5fe8ff"),
    accent: glow("#ff3d7a"),
    lines: glow("#5fe8ff"),
  };
}

type Materials = ReturnType<typeof createMaterials>;

/** Lays a wrapped plate on its axis: rotated `angle` around it, `y` along it, `tilt` about its own centre. */
function Plate({
  plate,
  material,
  angle = 0,
  y = 0,
  tilt = 0,
  meshRef,
}: {
  plate: PlateGeometry;
  material: Material;
  angle?: number;
  y?: number;
  tilt?: number;
  meshRef?: Ref<Mesh>;
}) {
  return (
    <group rotation-y={angle} position-y={y}>
      <mesh ref={meshRef} geometry={plate.geometry} material={material} position-z={plate.radius} rotation-x={tilt} />
    </group>
  );
}

/** Mechanical joint: dark hub, chrome rim and concentric glowing rings, facing outward along x. */
function JointRings({ m, radius, side }: { m: Materials; radius: number; side: number }) {
  return (
    <group>
      <mesh material={m.dark} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[radius, radius, radius * 0.8, 36]} />
      </mesh>
      <group position={[side * radius * 0.42, 0, 0]} rotation-y={(side * Math.PI) / 2}>
        <mesh material={m.chrome}>
          <torusGeometry args={[radius * 0.92, radius * 0.1, 10, 48]} />
        </mesh>
        <mesh material={m.accent}>
          <torusGeometry args={[radius * 0.62, radius * 0.05, 8, 40]} />
        </mesh>
        <mesh material={m.accent}>
          <torusGeometry args={[radius * 0.34, radius * 0.045, 8, 32]} />
        </mesh>
      </group>
    </group>
  );
}

interface ArmProps {
  side: 1 | -1;
  m: Materials;
  p: Plates;
  l: Lathes;
  shoulderRef: RefObject<Group | null>;
  elbowRef: RefObject<Group | null>;
  wristRef: RefObject<Group | null>;
  glowRef?: Ref<Mesh>;
}

function Arm({ side, m, p, l, shoulderRef, elbowRef, wristRef, glowRef }: ArmProps) {
  return (
    <group ref={shoulderRef} position={[side * 0.185, 0.115, -0.005]}>
      <JointRings m={m} radius={0.045} side={side} />
      {/* layered pauldron: a domed shell over the joint with two lames tucked beneath */}
      <group rotation-z={side * 0.45}>
        <group rotation-y={(side * Math.PI) / 2}>
          <Plate plate={p.lameLower} material={m.steel} />
          <Plate plate={p.lameUpper} material={m.steel} />
          <Plate plate={p.pauldron} material={m.steel} />
        </group>
      </group>

      <mesh material={m.dark} position={[0, -0.15, 0]}>
        <capsuleGeometry args={[0.028, 0.2, 8, 24]} />
      </mesh>
      <mesh material={m.steel} geometry={l.sleeve} />
      <Plate plate={p.armGuard} material={m.steel} angle={(side * Math.PI) / 2} y={-0.125} />

      <group ref={elbowRef} position={[0, -0.28, 0]}>
        <JointRings m={m} radius={0.034} side={side} />
        <mesh material={m.steel} geometry={l.forearm} />
        <Plate plate={p.forearmGuard} material={m.steel} angle={side * 1.2} y={-0.1} />
        <Plate plate={p.forearmGlow} material={m.lines} angle={side * 1.2} y={-0.1} meshRef={glowRef} />

        <group ref={wristRef} position={[0, -0.25, 0]} scale={1.25}>
          <mesh material={m.dark}>
            <sphereGeometry args={[0.022, 20, 16]} />
          </mesh>
          <RoundedBox args={[0.028, 0.07, 0.06]} radius={0.01} smoothness={3} position={[0, -0.048, 0]} material={m.dark} />
          <RoundedBox
            args={[0.008, 0.056, 0.056]}
            radius={0.003}
            smoothness={2}
            position={[side * 0.016, -0.045, 0]}
            material={m.steel}
          />
          {[-0.022, -0.007, 0.008, 0.023].map((z) => (
            <group key={z} position={[side * -0.002, -0.086, z]} rotation-z={side * 0.18}>
              <mesh material={m.dark} position={[0, -0.012, 0]}>
                <capsuleGeometry args={[0.0068, 0.02, 4, 10]} />
              </mesh>
              <mesh material={m.steel} position={[side * -0.003, -0.036, 0]} rotation-z={side * 0.35}>
                <capsuleGeometry args={[0.0062, 0.018, 4, 10]} />
              </mesh>
            </group>
          ))}
          <mesh material={m.steel} position={[side * -0.01, -0.05, 0.036]} rotation-x={-0.6}>
            <capsuleGeometry args={[0.0075, 0.028, 4, 10]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Leg({ x, m, p, l }: { x: number; m: Materials; p: Plates; l: Lathes }) {
  const side = Math.sign(x);
  return (
    <group position={[x, -0.04, 0]} rotation-z={side * 0.03}>
      <JointRings m={m} radius={0.05} side={side} />
      <mesh material={m.dark} position={[0, -0.22, 0]}>
        <capsuleGeometry args={[0.04, 0.34, 8, 24]} />
      </mesh>
      <mesh material={m.steel} geometry={l.thigh} />
      <Plate plate={p.thighPlate} material={m.steel} angle={side * 0.25} y={-0.2} />

      <group position={[0, -0.44, 0]}>
        <JointRings m={m} radius={0.042} side={side} />
        <Plate plate={p.kneeCap} material={m.chrome} />
        <mesh material={m.steel} geometry={l.shin} />
        <Plate plate={p.greave} material={m.steel} y={-0.19} />
        <Plate plate={p.greaveGlow} material={m.lines} y={-0.19} />

        <group position={[0, -0.43, 0]}>
          <mesh material={m.dark}>
            <sphereGeometry args={[0.03, 20, 16]} />
          </mesh>
          <mesh material={m.steel} position={[0.035, -0.09, 0]} rotation-y={-Math.PI / 2}>
            <extrudeGeometry args={[FOOT, EXTRUDE_FOOT]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Procedural chrome android — the "spine" the gallery orbits, fully animated. */
export function Robot({ reducedMotion }: { reducedMotion: boolean }) {
  const rigRef = useRig();
  const gl = useThree((state) => state.gl);
  const kit = useMemo(() => {
    const envTarget = createNeonEnvironment(gl);
    return { envTarget, m: createMaterials(envTarget.texture) };
  }, [gl]);
  const geometries = useMemo(() => createGeometries(), []);
  useEffect(
    () => () => {
      kit.envTarget.dispose();
      Object.values(kit.m).forEach((material) => material.dispose());
    },
    [kit],
  );
  useEffect(
    () => () => {
      Object.values(geometries.plates).forEach((plate) => plate.geometry.dispose());
      Object.values(geometries.lathes).forEach((geometry) => geometry.dispose());
    },
    [geometries],
  );
  const m = kit.m;
  const p = geometries.plates;
  const l = geometries.lathes;

  const rootRef = useRef<Group>(null);
  const pelvisRef = useRef<Group>(null);
  const legsRef = useRef<Group>(null);
  const chestRef = useRef<Group>(null);
  const abdomenRef = useRef<Group>(null);
  const neckRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const eyeRef = useRef<Mesh>(null);
  const accentRef = useRef<Mesh>(null);
  const linesRef = useRef<Mesh>(null);
  const plusShoulderRef = useRef<Group>(null);
  const plusElbowRef = useRef<Group>(null);
  const plusWristRef = useRef<Group>(null);
  const minusShoulderRef = useRef<Group>(null);
  const minusElbowRef = useRef<Group>(null);
  const minusWristRef = useRef<Group>(null);
  const motionRef = useRef({ yaw: 0, pitch: 0, gesturePlus: 0, gestureMinus: 0, x: 0, y: 0, vx: 0, turn: 0 });

  useFrame((_, delta) => {
    const r = rigRef.current;
    const root = rootRef.current;
    const pelvis = pelvisRef.current;
    const legs = legsRef.current;
    const chest = chestRef.current;
    const abdomen = abdomenRef.current;
    const neck = neckRef.current;
    const head = headRef.current;
    const eye = eyeRef.current;
    const accent = accentRef.current;
    const lines = linesRef.current;
    const motion = motionRef.current;
    if (!r || !root || !pelvis || !legs || !chest || !abdomen || !neck || !head || !eye || !accent || !lines) return;
    const dt = Math.min(delta, 1 / 20);
    const t = r.time;
    const idle = reducedMotion ? 0 : 1;
    const snap = reducedMotion ? 60 : 1;
    const intro = reducedMotion ? 1 : MathUtils.smoothstep(t, 0.4, 2.6);

    // glides with the camera to the side opposite the focused card (drops in from above on load); on
    // narrow screens the cards are centred, so it stands behind the focused one and peeks over its top
    const narrow = r.focusSide === 0;
    const targetX = -r.focusSide * GUIDE_X;
    const targetY = -r.current * STEP - CHEST_Y * SCALE + (narrow ? 0.8 : 0.35);
    const prevX = motion.x;
    motion.x = MathUtils.damp(motion.x, targetX, 2.2 * snap, dt);
    motion.y = MathUtils.damp(motion.y, targetY, 2.6 * snap, dt);
    motion.vx = MathUtils.damp(motion.vx, (motion.x - prevX) / Math.max(dt, 1e-3), 6, dt);
    root.position.set(
      motion.x,
      motion.y + Math.sin(t * 0.9) * 0.06 * idle + (1 - intro) * 4,
      BASE_Z - r.detail * 9, // steps back into the fog while a project is open
    );
    root.visible = r.detail < 0.97;
    // behind a centred card the legs would dangle into the gap below it
    legs.visible = !narrow;
    // turns its body toward the card it presents and leans into sideways glides
    motion.turn = MathUtils.damp(motion.turn, r.focusSide * 0.55, 2.5 * snap, dt);
    root.rotation.set(0, motion.turn + Math.sin(t * 0.35) * 0.05 * idle, -motion.vx * 0.05 * idle);
    pelvis.rotation.z = Math.sin(t * 0.5) * 0.012 * idle;

    // breathing: chest swells, the exposed pistons stretch with it
    const breath = Math.sin(t * 1.25) * idle;
    chest.scale.set(1 + breath * 0.008, 1 + breath * 0.01, 1 + breath * 0.018);
    abdomen.scale.y = 1 + breath * 0.025;

    // looks at the cursor and toward the project currently in focus
    motion.yaw = MathUtils.damp(motion.yaw, r.pointer.x * 0.45 + r.focusSide * 0.3, 3.5 * snap, dt);
    motion.pitch = MathUtils.damp(motion.pitch, -r.pointer.y * 0.22 + (narrow ? 0.14 : 0.04), 3.5 * snap, dt);
    head.rotation.set(motion.pitch + Math.sin(t * 0.7) * 0.02 * idle, motion.yaw * 0.7, Math.sin(t * 0.5) * 0.03 * idle);
    neck.rotation.set(motion.pitch * 0.4, motion.yaw * 0.3, 0);
    chest.rotation.y = motion.yaw * 0.18;

    // raises the arm on the focused card's side as if presenting it
    const reach = reducedMotion ? 0 : 1 - r.detail;
    motion.gesturePlus = MathUtils.damp(motion.gesturePlus, r.focusSide > 0 ? reach : 0, 2.5 * snap, dt);
    motion.gestureMinus = MathUtils.damp(motion.gestureMinus, r.focusSide < 0 ? reach : 0, 2.5 * snap, dt);
    const arms = [
      [plusShoulderRef.current, plusElbowRef.current, plusWristRef.current, 1, motion.gesturePlus, 0],
      [minusShoulderRef.current, minusElbowRef.current, minusWristRef.current, -1, motion.gestureMinus, 1.7],
    ] as const;
    for (const [shoulder, elbow, wrist, side, g, phase] of arms) {
      if (!shoulder || !elbow || !wrist) continue;
      const sway = Math.sin(t * 0.9 + phase) * 0.04 * idle;
      // presenting: arm swings forward and out toward the card, forearm opening
      shoulder.rotation.set(-g * 0.95 + sway, side * g * 0.2, side * (0.16 + g * 0.26));
      elbow.rotation.set(-0.22 - g * 0.45, 0, 0);
      wrist.rotation.set(0, 0, side * g * 0.3);
    }

    // power-on intro, pulsing joints, eyes flash when a project opens
    (eye.material as MeshStandardMaterial).emissiveIntensity =
      intro * (2.6 + Math.sin(t * 3.1) * 0.35 * idle) + r.glitch * 4;
    (accent.material as MeshStandardMaterial).emissiveIntensity = intro * (4.2 + Math.sin(t * 1.8) * 1.2 * idle);
    (lines.material as MeshStandardMaterial).emissiveIntensity = intro * 2.2;
  });

  return (
    <group ref={rootRef} position={[0, -CHEST_Y * SCALE, BASE_Z]} scale={SCALE}>
      <group ref={pelvisRef} position={[0, 1.0, 0]}>
        {/* pelvis: core, belt and armour (squashed front-to-back like a real hip) */}
        <group scale-z={0.75}>
          <mesh material={m.dark} geometry={l.pelvis} />
          <mesh material={m.chrome} position={[0, 0.045, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.122, 0.009, 10, 64]} />
          </mesh>
          <Plate plate={p.groin} material={m.steel} />
          <Plate plate={p.hip} material={m.steel} angle={1.35} />
          <Plate plate={p.hip} material={m.steel} angle={-1.35} />
        </group>
        <group ref={legsRef}>
          <Leg x={0.095} m={m} p={p} l={l} />
          <Leg x={-0.095} m={m} p={p} l={l} />
        </group>

        {/* exposed mechanical abdomen */}
        <group ref={abdomenRef} position={[0, 0.16, 0]}>
          <mesh material={m.dark} position={[0, 0.02, -0.02]}>
            <cylinderGeometry args={[0.032, 0.036, 0.24, 24]} />
          </mesh>
          {[-0.07, -0.035, 0, 0.035, 0.07, 0.105].map((y) => (
            <mesh key={y} material={m.chrome} position={[0, y, -0.02]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.04, 0.006, 8, 32]} />
            </mesh>
          ))}
          {PISTONS.map(([x, z, lean], i) => (
            <group key={x} position={[x, 0.02, z]} rotation-z={-lean}>
              <mesh material={m.chrome}>
                <cylinderGeometry args={[0.0055, 0.0055, 0.2, 12]} />
              </mesh>
              <mesh material={m.dark} position={[0, -0.05, 0]}>
                <cylinderGeometry args={[0.009, 0.009, 0.07, 12]} />
              </mesh>
              <mesh ref={i === 0 ? accentRef : undefined} material={m.accent} position={[0, 0.03, 0.008]}>
                <sphereGeometry args={[0.0045, 10, 8]} />
              </mesh>
            </group>
          ))}
          {ABDOMEN_CABLES.map((curve, i) => (
            <mesh key={i} material={m.rubber}>
              <tubeGeometry args={[curve, 24, 0.007, 8, false]} />
            </mesh>
          ))}
          <group scale-z={0.8}>
            <Plate plate={p.oblique} material={m.steel} angle={1.25} y={0.02} />
            <Plate plate={p.oblique} material={m.steel} angle={-1.25} y={0.02} />
          </group>
        </group>

        {/* chest */}
        <group ref={chestRef} position={[0, 0.38, 0]}>
          <group scale-z={0.74}>
            <mesh material={m.dark} geometry={l.torso} />
            <Plate plate={p.pecR} material={m.steel} y={0.02} />
            <Plate plate={p.pecL} material={m.steel} y={0.02} />
            <Plate plate={p.ribUpperR} material={m.steel} y={-0.088} tilt={0.2} />
            <Plate plate={p.ribUpperL} material={m.steel} y={-0.088} tilt={0.2} />
            <Plate plate={p.ribLowerR} material={m.steel} y={-0.12} tilt={0.3} />
            <Plate plate={p.ribLowerL} material={m.steel} y={-0.12} tilt={0.3} />
            <Plate plate={p.lat} material={m.steel} angle={1.5} y={-0.01} />
            <Plate plate={p.lat} material={m.steel} angle={-1.5} y={-0.01} />
            <Plate plate={p.back} material={m.steel} angle={Math.PI} y={0.02} />
            {/* recessed power core between the pectorals */}
            <group position={[0, 0.017, 0.132]} rotation-x={Math.PI / 2}>
              <mesh material={m.chrome}>
                <cylinderGeometry args={[0.025, 0.025, 0.012, 6]} />
              </mesh>
              <mesh ref={linesRef} material={m.lines} position-y={0.001}>
                <cylinderGeometry args={[0.017, 0.017, 0.012, 6]} />
              </mesh>
            </group>
            <mesh material={m.steel} geometry={l.yoke} />
            <mesh material={m.chrome} position={[0, 0.198, -0.004]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.052, 0.009, 12, 40]} />
            </mesh>
          </group>

          <Arm side={1} m={m} p={p} l={l} shoulderRef={plusShoulderRef} elbowRef={plusElbowRef} wristRef={plusWristRef} />
          <Arm side={-1} m={m} p={p} l={l} shoulderRef={minusShoulderRef} elbowRef={minusElbowRef} wristRef={minusWristRef} />

          {/* exposed neck: column, chrome rods and cables */}
          <group ref={neckRef} position={[0, 0.18, -0.005]}>
            <mesh material={m.dark} position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.026, 0.03, 0.09, 20]} />
            </mesh>
            {(
              [
                [0.022, 0.012],
                [-0.022, 0.012],
                [0.016, -0.018],
                [-0.016, -0.018],
              ] as const
            ).map(([x, z]) => (
              <mesh key={`${x}${z}`} material={m.chrome} position={[x * 1.2, 0.04, z * 1.2]}>
                <cylinderGeometry args={[0.004, 0.004, 0.09, 8]} />
              </mesh>
            ))}
            {NECK_CABLES.map((curve, i) => (
              <mesh key={i} material={m.rubber}>
                <tubeGeometry args={[curve, 16, 0.006, 8, false]} />
              </mesh>
            ))}

            <group ref={headRef} position={[0, 0.065, 0]}>
              {/* helmet, dark under-face and the chrome mask laid over it */}
              <mesh material={m.steel} position={[0, 0.12, -0.014]} scale={[0.084, 0.1, 0.098]}>
                <sphereGeometry args={[1, 64, 48]} />
              </mesh>
              <mesh material={m.dark} position={[0, 0.09, 0.008]} scale={[0.07, 0.088, 0.086]}>
                <sphereGeometry args={[1, 48, 32]} />
              </mesh>
              <group position={[0, FACE_Y, FACE_Z - FACE_RX]}>
                <Plate plate={p.face} material={m.chrome} />
                <Plate plate={p.socketR} material={m.dark} />
                <Plate plate={p.socketL} material={m.dark} />
                <Plate plate={p.eyeR} material={m.eyes} meshRef={eyeRef} />
                <Plate plate={p.eyeL} material={m.eyes} />
                <Plate plate={p.cheekR} material={m.dark} />
                <Plate plate={p.cheekL} material={m.dark} />
                <Plate plate={p.grill0} material={m.dark} />
                <Plate plate={p.grill1} material={m.dark} />
                <Plate plate={p.grill2} material={m.dark} />
              </group>
              <mesh material={m.chrome} geometry={p.crest.geometry} position={[0, 0.12, -0.014 + HELMET_R]} />
              {/* ear discs */}
              {[1, -1].map((s) => (
                <group key={`ear${s}`} position={[s * 0.082, 0.115, -0.012]}>
                  <JointRings m={m} radius={0.028} side={s} />
                </group>
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
