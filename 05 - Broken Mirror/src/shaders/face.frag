uniform vec3 pointColor1;
uniform vec3 pointColor2;
uniform float pointSize;

void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center) * 2.0;
    float alpha = 1.0 - smoothstep(0.2, 1.0, dist);
    vec3 color = mix(pointColor2, pointColor1, alpha);

    if (dist < pointSize) {
        gl_FragColor = vec4(color, 1);
    } else {
        discard;
    }

}
