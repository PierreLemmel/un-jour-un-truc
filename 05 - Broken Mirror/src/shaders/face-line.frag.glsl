uniform vec3 lineColor;
uniform float master;

void main() {
    gl_FragColor = vec4(lineColor, master);
}
