uniform vec3 pointColor1;
uniform vec3 pointColor2;
uniform float pointSize;
uniform float time;

varying float vColorNoise;

const float SQRT_2_OVER_2 = 0.70710678118;

void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center) * 2.0;

    vec3 color = mix(pointColor1, pointColor2, vColorNoise);

    if (dist < SQRT_2_OVER_2) {
        gl_FragColor = vec4(color, 1);
    } else {
        discard;
    }

}
