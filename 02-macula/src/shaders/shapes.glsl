const float PI = 3.14159265358979323846;

float polygonSDF(vec2 uv, vec2 leavingPoint, vec2 resolution, float time, float speed, float width, int segments, float offsetAngle, float depth) {
    vec2 p = (uv - 0.5) * resolution;

    float rawDist = length(uv - 0.5);
    

    float shiftStrength = 1. / (1. + length(leavingPoint - 0.5) * depth);
    p -= (leavingPoint - 0.5) * shiftStrength * resolution;

    float angle = atan(p.y, p.x) + offsetAngle;
    float slice = (2.0 * PI) / float(segments);
    float localAngle = mod(angle, slice) - (slice / 2.0);
    
    float d0 = length(p) * cos(localAngle);
    float dTime = speed * time;
    float d = (d0 + dTime) / width;

    return d;
}