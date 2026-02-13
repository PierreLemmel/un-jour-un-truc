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

uniform float uBlinkLevel;
uniform vec4 uBlinkColor;
uniform float uBlinkMax;

void main() {
    float r = length((vUv - uLeavingPoint) * uResolution / max(uResolution.x, uResolution.y));

    gl_FragColor = r < 0.015 ? vec4(1., 0., 0., 1.) : vec4(0., 0., 0., 0.);
}