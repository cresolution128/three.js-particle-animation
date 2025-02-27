import { useAspect, useGLTF, useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import particlesFragmentShader from './shaders/particles/fragment.glsl';
import particlesVertexShader from './shaders/particles/vertex.glsl';

const Sphere = () => {
    const pointsRef = useRef();
    let particles = {};
    const model = useGLTF('./model.glb');
    const positions = model.scene.children.map((child) => {
        return child.geometry.attributes.position;
    });
    particles.maxCount = 0;
    for (const position of positions) {
        if (position.count > particles.maxCount) {
            particles.maxCount = position.count;
        }
    }
    particles.positions = [];
    for (const position of positions) {
        const originalArray = position.array;

        const newArray = new Float32Array(particles.maxCount * 3);

        for (let i = 0; i < particles.maxCount; i++) {
            const i3 = i * 3;
            if (position.count < 22900) {
                if (i3 < originalArray.length) {
                    newArray[i3] = originalArray[i3] * 0.05;
                    newArray[i3 + 1] = originalArray[i3 + 1] * 0.05;
                    newArray[i3 + 2] = originalArray[i3 + 2] * 0.05;
                } else {
                    const ramdomIndex =
                        Math.floor(position.count * Math.random()) * 3;
                    newArray[i3] = originalArray[ramdomIndex] * 0.05;
                    newArray[i3 + 1] = originalArray[ramdomIndex + 1] * 0.05;
                    newArray[i3 + 2] = originalArray[ramdomIndex + 2] * 0.05;
                }
            } else {
                if (i3 < originalArray.length) {
                    newArray[i3] = originalArray[i3] * 20.0;
                    newArray[i3 + 1] = originalArray[i3 + 1] * 2.0 + 3.0;
                    newArray[i3 + 2] = originalArray[i3 + 2] * 15.0;
                } else {
                    const ramdomIndex =
                        Math.floor(position.count * Math.random()) * 3;
                    newArray[i3] = originalArray[ramdomIndex] * 20.0;
                    newArray[i3 + 1] =
                        originalArray[ramdomIndex + 1] * 2.0 + 3.0;
                    newArray[i3 + 2] = originalArray[ramdomIndex + 2] * 15.0;
                }
            }
        }
        particles.positions.push(new THREE.Float32BufferAttribute(newArray, 3));
    }

    const sizesArray = new Float32Array(particles.maxCount);

    for (let i = 0; i < particles.maxCount; i++) {
        sizesArray[i] = Math.random();
    }

    particles.geometry = new THREE.BufferGeometry();
    particles.geometry.setAttribute('position', particles.positions[1]);
    particles.geometry.setIndex(null);
    particles.geometry.setAttribute('aPositionTarget', particles.positions[0]);
    particles.geometry.setAttribute(
        'aSize',
        new THREE.BufferAttribute(sizesArray, 1)
    );

    const particleControls = useControls('Particles', {
        uSize: { value: 1.0, min: 0.1, max: 10, step: 0.1 },
        progress: { value: 0, min: 0, max: 1, step: 0.001 },
        RotateX: { value: 1.5, min: -10.0, max: 10.0, step: 0.01 },
        TimeFrequency: { value: 0.25, min: 0.0, max: 1.0, step: 0.01 },
        DistortionFrequencyWave: {
            value: 0.08,
            min: 0.0,
            max: 1.0,
            step: 0.01
        },
        DistortionStrengthWave: {
            value: 3.5,
            min: 0.0,
            max: 10.0,
            step: 0.01
        },
        DisplacementFrequencyWave: {
            value: 0.15,
            min: 0.0,
            max: 1.0,
            step: 0.01
        },
        DisplacementStrengthWave: { value: 1.5, min: 0.0, max: 5.0, step: 0.1 }
    });

    const particleColorControls = useControls('Particles Colors', {
        colorA: '#3018eb',
        colorB: '#ff6f00'
    });

    // Sizes
    const [width, height, pixelRatio] = useAspect(
        window.innerWidth,
        window.innerHeight,
        Math.min(2, window.devicePixelRatio)
    );

    particles.colorA = particleColorControls.colorA;
    particles.colorB = particleColorControls.colorB;

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uSize: { value: particleControls.uSize },
            uResolution: {
                value: new THREE.Vector2(
                    width * pixelRatio,
                    height * pixelRatio
                )
            },
            uProgress: { value: particleControls.progress },
            uRotationX: { value: particleControls.RotateX },
            uTimeFrequency: { value: particleControls.TimeFrequency },
            uColorA: { value: new THREE.Color(particles.colorA) },
            uColorB: { value: new THREE.Color(particles.colorB) },
            uDistortionFrequencyWave: {
                value: particleControls.DistortionFrequencyWave
            },
            uDistortionStrengthWave: {
                value: particleControls.DistortionStrengthWave
            },
            uDisplacementFrequencyWave: {
                value: particleControls.DisplacementFrequencyWave
            },
            uDisplacementStrengthWave: {
                value: particleControls.DisplacementStrengthWave
            }
        }),
        [
            width,
            height,
            pixelRatio,
            particleControls,
            particles.colorA,
            particles.colorB
        ]
    );

    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader: particlesVertexShader,
                fragmentShader: particlesFragmentShader,
                uniforms: uniforms,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                transparent: true
            }),
        [uniforms]
    );

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime + 50;
    });

    useEffect(() => {
        // Update uniforms on resize
        uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
    }, [width, height, pixelRatio, uniforms]);

    const scroll = useScroll();

    useFrame(() => {
        uniforms.uProgress.value = scroll.offset;
    });

    return <points ref={pointsRef} args={[particles.geometry, material]} />;
};

useGLTF.preload('./model.glb');
export default Sphere;
