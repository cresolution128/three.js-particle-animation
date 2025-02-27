precision highp float;

uniform float uTime;
uniform float uRotationX;
uniform float uTimeFrequency;

uniform float uDistortionFrequencyWave;
uniform float uDistortionStrengthWave;
uniform float uDisplacementFrequencyWave;
uniform float uDisplacementStrengthWave;

uniform vec2 uResolution;
uniform float uSize;
uniform float uProgress;

uniform vec3 uColorA;
uniform vec3 uColorB;

attribute vec3 aPositionTarget;
attribute float aSize;

varying vec3 vColor;

#define PI 3.1415926535897932384626433832795

#include ../includes/simplexNoise3d.glsl
#include ../includes/perlin3d.glsl

vec3 applyWaveFunction(vec3 position) {
    // Generate Perlin noise based on position and time
    float perlinValue = perlin3d(vec3(position.xz * uDisplacementFrequencyWave, uTime * uTimeFrequency * 0.65));

    // Apply wave height and normalize the wave effect
    vec3 waveDisplacement = vec3(0.0, perlinValue * uDisplacementStrengthWave, 0.0);

    // Apply distortion if needed
    vec3 distortion = vec3(perlin3d(position * uDistortionFrequencyWave + vec3(1.0, 0.0, 0.0)) - 0.5, -perlin3d(position * uDistortionFrequencyWave + vec3(0.0, 1.0, 0.0)) * 0.3 + 0.5, -perlin3d(position * uDistortionFrequencyWave + vec3(0.0, 0.0, 1.0)) - 1.0) * uDistortionStrengthWave;

    // Final displaced position with wave and distortion
    return position + waveDisplacement + distortion;
}

mat3 rotation3dY(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

vec3 rotateY(vec3 v, float angle) {
    return rotation3dY(angle) * v;
}

mat3 rotation3dX(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

vec3 rotateX(vec3 v, float angle) {
    return rotation3dX(angle) * v;
}

float smoothBlend(float edge0, float edge1, float x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float easeInOutCubic(float t) {
    return t < 0.75 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
    float noiseOrigin = simplexNoise3d(position * 0.25);
    float noiseTarget = simplexNoise3d(aPositionTarget * 0.25);
    float noise = mix(noiseOrigin, noiseTarget, uProgress);
    noise = smoothBlend(-1.0, 1.0, noise);
    noise = pow(noise, 2.0);


    float duration = 0.4;
    float delay = (1.0 - duration) * noise;
    float end = delay + duration;
    float progress = smoothstep(delay, end, uProgress);

    vec3 mixedPosition = mix(position, aPositionTarget, progress);
    vec3 displacedPosition;
    
    progress = pow(progress, 3.0);

    if(progress < 0.65){
        displacedPosition.xyz = applyWaveFunction(mixedPosition) * (1.0 - progress) * 0.01;
        displacedPosition *= 150.0;
        displacedPosition.y -= pow(progress * 1.2, 3.0);
    }else{
        displacedPosition.xyz = rotateX(mixedPosition, uRotationX * PI * easeInOutCubic(progress));
        displacedPosition *= pow(progress * 1.1, 2.0);
        displacedPosition.y -= pow(progress * 1.2, 3.0);
    }

    if(progress >= 0.65) displacedPosition.xyz = rotateY(displacedPosition.xyz, uTime * 0.35 * pow(progress, 2.0));
    

    // Final position
    vec4 modelPosition = modelMatrix * vec4(displacedPosition.xyz, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    if(progress > 0.5) gl_PointSize = aSize * uSize * uResolution.y * 8.0 * progress; 
    else gl_PointSize = aSize * uSize * uResolution.y * 25.0 * (1.0 - progress);
    
    gl_PointSize *= (1.0 / -viewPosition.z);

    //varyings
    vColor = mix(uColorB, uColorA, mod(pow(noise, 3.0), 1.0) );
}
