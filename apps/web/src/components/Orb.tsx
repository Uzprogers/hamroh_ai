import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "../lib/theme";

const ribbonVertex = `
  uniform float uTime;
  uniform float uLevel;
  uniform float uPhase;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 p = position;

    float wave = sin(p.x * 1.35 + uTime * 0.85 + uPhase) * 0.42
               + sin(p.x * 2.9 - uTime * 1.25 + uPhase * 1.7) * 0.16
               + sin(p.x * 0.6 + uTime * 0.38) * 0.3;

    p.y += wave * (0.55 + uLevel * 1.5);
    p.z += cos(p.x * 0.95 + uTime * 0.55 + uPhase) * 0.55;

    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const ribbonFragment = `
  uniform float uLight;
  uniform float uLevel;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vec3 teal = mix(vec3(0.165, 0.835, 0.765), vec3(0.031, 0.553, 0.502), uLight);
    vec3 azure = mix(vec3(0.333, 0.525, 0.992), vec3(0.129, 0.310, 0.780), uLight);

    vec3 color = mix(teal, azure, clamp(vUv.x * 1.15 - 0.05, 0.0, 1.0));
    color += vWave * 0.08;

    float d = abs(vUv.y - 0.5);
    float core = smoothstep(0.09, 0.0, d);
    float glow = smoothstep(0.46, 0.0, d) * 0.22;
    float ends = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
    float alpha = (core * 0.9 + glow) * ends * mix(0.85, 0.95, uLight) * (0.6 + uLevel * 0.7);

    gl_FragColor = vec4(color, alpha);
  }
`;

interface RibbonProps {
  level: number;
  light: boolean;
  phase: number;
  tilt: number;
  offset: number;
  scale: number;
  speed: number;
}

function Ribbon({ level, light, phase, tilt, offset, scale, speed }: RibbonProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: phase * 2 },
      uLevel: { value: 0 },
      uLight: { value: 0 },
      uPhase: { value: phase },
    }),
    [phase],
  );

  uniforms.uLight.value = light ? 1 : 0;

  useFrame((_, delta) => {
    uniforms.uTime.value += delta * speed;
    uniforms.uLevel.value += (level - uniforms.uLevel.value) * Math.min(1, delta * 5);
  });

  return (
    <mesh ref={mesh} rotation={[0, 0, tilt]} position={[0, offset, 0]} scale={scale}>
      <planeGeometry args={[7.4, 1.1, 260, 2]} />
      <shaderMaterial
        vertexShader={ribbonVertex}
        fragmentShader={ribbonFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={light ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Motes({ level, light }: { level: number; light: boolean }) {
  const points = useRef<THREE.Points>(null);
  const time = useRef(0);

  const geometry = useMemo(() => {
    const count = 260;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 8.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return buffer;
  }, []);

  useFrame((_, delta) => {
    if (!points.current) return;
    time.current += delta;
    points.current.rotation.y = Math.sin(time.current * 0.12) * 0.25;
    points.current.position.y = Math.sin(time.current * 0.3) * 0.12 + level * 0.2;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color={light ? "#4A78C8" : "#9EC6FF"}
        size={0.02}
        transparent
        opacity={light ? 0.35 : 0.5}
        sizeAttenuation
      />
    </points>
  );
}

function Presence({ level, state, light }: { level: number; state: string; light: boolean }) {
  const group = useRef<THREE.Group>(null);
  const smoothed = useRef(0);
  const { pointer } = useThree();
  const time = useRef(0);

  useFrame((_, delta) => {
    const target =
      state === "SPEAKING" ? Math.max(level, 0.3) : state === "THINKING" ? 0.18 : 0.06;
    smoothed.current += (target - smoothed.current) * Math.min(1, delta * 5);
    time.current += delta;

    if (!group.current) return;
    const leanX = -pointer.y * 0.16;
    const leanY = pointer.x * 0.22;

    group.current.rotation.x += (leanX - group.current.rotation.x) * 0.045;
    group.current.rotation.y += (leanY - group.current.rotation.y) * 0.045;
    group.current.position.y = Math.sin(time.current * 0.5) * 0.08;
  });

  const ribbons: RibbonProps[] = [
    { phase: 0, tilt: 0.16, offset: 0.28, scale: 1, speed: 0.85, level: smoothed.current, light },
    { phase: 1.9, tilt: -0.12, offset: -0.1, scale: 0.92, speed: 1.05, level: smoothed.current, light },
    { phase: 3.6, tilt: 0.3, offset: -0.5, scale: 0.78, speed: 0.7, level: smoothed.current, light },
    { phase: 5.1, tilt: -0.26, offset: 0.62, scale: 0.66, speed: 1.2, level: smoothed.current, light },
  ];

  return (
    <group ref={group}>
      {ribbons.map((ribbon) => (
        <Ribbon key={ribbon.phase} {...ribbon} />
      ))}
      <Motes level={smoothed.current} light={light} />
    </group>
  );
}

export function Orb({
  level,
  state,
  distance = 5.2,
}: {
  level: number;
  state: string;
  distance?: number;
}) {
  const { theme } = useTheme();
  const light = theme === "light";

  return (
    <Canvas
      camera={{ position: [0, 0, distance], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Presence level={level} state={state} light={light} />
    </Canvas>
  );
}
