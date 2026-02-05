"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";

/* ---------- Capital / Risk Field ---------- */
function CapitalField() {
    const points = useRef<THREE.Points>(null!);
    const { mouse, viewport } = useThree();
    const [clickBias, setClickBias] = useState(0); // -1 risk, +1 safe

    const { geometry, basePositions } = useMemo(() => {
        const count = 1600;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            const x = (Math.random() - 0.5) * viewport.width * 2.5;
            const y = (Math.random() - 0.5) * viewport.height * 2.5;
            const z = (Math.random() - 0.5) * 12;

            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

            // neutral gray base (will be modulated later)
            colors[i3] = 0.6;
            colors[i3 + 1] = 0.6;
            colors[i3 + 2] = 0.6;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        return { geometry: geo, basePositions: positions };
    }, [viewport.width, viewport.height]);

    useFrame(({ clock }) => {
        if (!points.current) return;

        const pos = geometry.attributes.position as THREE.BufferAttribute;
        const col = geometry.attributes.color as THREE.BufferAttribute;

        // --- Subtle volatility breathing ---
        const pulse = 1 + Math.sin(clock.elapsedTime * 0.6) * 0.03;

        for (let i = 0; i < pos.count; i++) {
            const i3 = i * 3;

            const x = basePositions[i3];
            const y = basePositions[i3 + 1];
            const z = basePositions[i3 + 2] * pulse;

            pos.array[i3] = x;
            pos.array[i3 + 1] = y;
            pos.array[i3 + 2] = z;

            // depth-based fade
            const depth = Math.abs(z);
            const fade = THREE.MathUtils.clamp(1 - depth / 10, 0.15, 1);

            // base gray
            let r = 0.6;
            let g = 0.6;
            let b = 0.6;

            // click bias (risk vs safe)
            if (clickBias !== 0) {
                r += clickBias < 0 ? 0.15 : -0.05;
                g += clickBias > 0 ? 0.15 : -0.05;
            }

            col.array[i3] = r * fade;
            col.array[i3 + 1] = g * fade;
            col.array[i3 + 2] = b * fade;
        }

        pos.needsUpdate = true;
        col.needsUpdate = true;

        // system drift + parallax
        points.current.rotation.y += 0.0004;
        points.current.rotation.x = mouse.y * 0.12;
        points.current.rotation.y += mouse.x * 0.001;
    });

    return (
        <points
            ref={points}
            geometry={geometry}
            onPointerDown={() => {
                // toggle bias
                setClickBias((b) => (b === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0));
            }}
        >
            <pointsMaterial
                size={0.06}                 // heavier presence
                sizeAttenuation             // near = bigger
                vertexColors
                transparent
                opacity={0.95}              // less airy
                depthWrite={false}
            />

        </points>
    );
}

/* ---------- Scene ---------- */
export default function AuthScene() {
    return (
        <Canvas
            camera={{ position: [0, 0, 9], fov: 55 }}
            style={{ background: "#0B0B0F" }}
        >
            <ambientLight intensity={0.4} />
            <CapitalField />
        </Canvas>
    );
}
