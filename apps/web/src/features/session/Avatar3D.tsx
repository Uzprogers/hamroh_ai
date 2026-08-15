import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  uniform float uTime;
  uniform float uLevel;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDisplace;

  float wave(vec3 p, float freq, float speed) {
    return sin(p.x * freq + uTime * speed)
         * sin(p.y * freq * 1.3 - uTime * speed * 0.8)
         * sin(p.z * freq * 0.7 + uTime * speed * 1.1);
  }

  void main() {
    float breathe = wave(position, 1.7, 0.55) * 0.05;
    float voice = wave(position, 4.6, 2.6) * uLevel * 0.3;
    vDisplace = breathe + voice;

    vec3 shifted = position + normal * vDisplace;
    vec4 viewPosition = modelViewMatrix * vec4(shifted, 1.0);

    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPosition.xyz);

    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  uniform float uLevel;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDisplace;

  void main() {
    vec3 teal = vec3(0.165, 0.835, 0.765);
    vec3 azure = vec3(0.333, 0.525, 0.992);
    vec3 deep = vec3(0.02, 0.05, 0.12);

    float facing = clamp(dot(vNormal, vView), 0.0, 1.0);
    float rim = pow(1.0 - facing, 3.0);
    float sheen = pow(clamp(dot(vNormal, normalize(vec3(-0.4, 0.8, 0.6))), 0.0, 1.0), 6.0);

    vec3 tint = mix(azure, teal, clamp(vDisplace * 6.0 + 0.45, 0.0, 1.0));
    vec3 color = deep + tint * (rim * (1.1 + uLevel * 1.4) + sheen * 0.5) + tint * facing * 0.06;

    float alpha = 0.25 + rim * 0.75;
    gl_FragColor = vec4(color, alpha);
  }
`;

function Core({ level, state }: { level: number; state: string }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const smoothed = useRef(0);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uLevel: { value: 0 } }), []);

  useFrame((_, delta) => {
    const target =
      state === "SPEAKING" ? Math.max(level, 0.25) : state === "THINKING" ? 0.14 : 0.05;
    smoothed.current += (target - smoothed.current) * Math.min(1, delta * 8);

    uniforms.uTime.value += delta * (state === "THINKING" ? 2.1 : 1);
    uniforms.uLevel.value = smoothed.current;

    if (group.current) {
      group.current.rotation.y += delta * 0.18;
      group.current.rotation.x = Math.sin(uniforms.uTime.value * 0.25) * 0.1;
      group.current.scale.setScalar(1 + smoothed.current * 0.07);
    }
    if (shell.current) {
      shell.current.rotation.y -= delta * 0.34;
      shell.current.rotation.z += delta * 0.12;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1, 24]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={shell} scale={1.28}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#2AD5C3" wireframe transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

function Ring({ level, tilt, radius, speed }: { level: number; tilt: number; radius: number; speed: number }) {
  const ring = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ring.current) return;
    ring.current.rotation.z += delta * speed;
    ring.current.scale.setScalar(1 + level * 0.16);
  });

  return (
    <mesh ref={ring} rotation={[tilt, 0.3, 0]}>
      <torusGeometry args={[radius, 0.004, 8, 200]} />
      <meshBasicMaterial color="#5586FD" transparent opacity={0.4} />
    </mesh>
  );
}

function Dust() {
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 2.1 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.5;
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return buffer;
  }, []);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.05;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial color="#8FB4FF" size={0.018} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

export function Avatar3D({ level, state }: { level: number; state: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 5.2], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <Core level={level} state={state} />
      <Ring level={level} tilt={Math.PI / 2.4} radius={1.7} speed={0.32} />
      <Ring level={level} tilt={Math.PI / 1.7} radius={2.05} speed={-0.19} />
      <Dust />
    </Canvas>
  );
}
