float remap(float value, float inMin, float inMax, float outMin, float outMax) {
    return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

float inverseLerp(float a, float b, float x) {
    return clamp((x - a) / (b - a), 0.0, 1.0);
}