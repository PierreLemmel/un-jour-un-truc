#include ./noise.glsl

uniform float pointSize;
uniform float lineWidth;
uniform float time;

uniform float pointSizeNoiseSpeed;
uniform float pointSizeNoiseScale;

uniform float pointColorNoiseSpeed;
uniform float pointColorNoiseScale;


varying float vColorNoise;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float pointScale = pnoise2(pointSizeNoiseScale * position.xy + vec2(1.0) * time * pointSizeNoiseSpeed);
    vColorNoise = pnoise2(pointColorNoiseScale * position.xy + vec2(1.0) * time * pointColorNoiseSpeed);

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = pointSize * (1.0 + pointScale) * 0.5;
}
