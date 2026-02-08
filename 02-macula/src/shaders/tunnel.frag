#include <shapes>
#include <utils>

uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec2 uLeavingPoint;
uniform float uWidth;

uniform float uSpeed;

uniform float uSmoothIn;
uniform float uSmoothOut;

uniform float uBalance;

uniform int uSegments;
uniform float uOffsetAngle;

uniform float uDepth;

uniform float uFadeRadius;
uniform float uFadeStrength;


void main() {

    float d = polygonSDF(vUv, uLeavingPoint, uResolution, uTime, uSpeed, uWidth, uSegments, uOffsetAngle, uDepth);
    

    float f = fract(d);
    float smoothCoord;

    float b1 = uBalance;
    float b2 = 1.0 - uBalance;
    if (f < b1) {
        float t = f / b1;
        float edge0 = b1 - uSmoothIn * b1 * 0.5;
        float edge1 = b1 + uSmoothIn * b1 * 0.5;
        smoothCoord = smoothstep(edge0, edge1, t);
    } else {
        float t = (f - b2) / b2;
        float edge0 = b2 - uSmoothOut * b2 * 0.5;
        float edge1 = b2 + uSmoothOut * b2 * 0.5;
        smoothCoord = 1.0 - smoothstep(edge0, edge1, t);
    }

    float x = inverseLerp(
        uFadeRadius,
        uFadeRadius * 0.06,
        length((vUv - uLeavingPoint) * uResolution) / max(uResolution.x, uResolution.y)
    );

    float alpha = (1. - uFadeStrength * x);

    gl_FragColor = mix(
        vec4(0., 0., 0., 1.),
        mix(uColor1, uColor2, smoothCoord),
        alpha
    );
}