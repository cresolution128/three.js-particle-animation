import { ScrollControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { DepthOfField, EffectComposer } from '@react-three/postprocessing';
import { Leva, useControls } from 'leva';
import { Perf } from 'r3f-perf';

import Sphere from './Sphere';

const Experience = () => {
    const controls = useControls('experience', {
        focalLength: { value: 6, min: 0, max: 100, step: 0.001 },
        focusDistance:  { value: 0.2, min: 0, max: 40, step: 0.001 },
    });
    

    return (
        <>
            <Leva flat oneLineLabels collapsed />
            <Canvas
                camera={{
                    fov: 35,
                    position: [0.0, 0.0, 22]
                }}
                className="canvas"
            >
                <Perf position={'bottom-left'} />
                {/* <OrbitControls enabled={true} enableZoom={false} /> */}
                <ScrollControls pages={2} damping={0.65} distance={0.85}>
                    <group position={[0, -0.5, 0]}>
                        <Sphere />
                    </group>
                </ScrollControls>

                <EffectComposer>
                    <DepthOfField focusDistance={controls.focusDistance} focalLength={controls.focalLength} bokehScale={12} />
                </EffectComposer>
            </Canvas>
        </>
    );
};

export default Experience;
