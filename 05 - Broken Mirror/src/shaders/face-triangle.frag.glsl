uniform vec3 color;
uniform float master;

void main() {
    gl_FragColor = vec4(color, master);
}