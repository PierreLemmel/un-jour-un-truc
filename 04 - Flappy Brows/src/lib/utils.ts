export function cn(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

export function clamp01(value: number): number {
    return clamp(value, 0, 1);
}

export type vec4 = [number, number, number, number];

export function vec4(x: number, y: number, z: number, w: number): vec4 {
    return [x, y, z, w];
}

export function vec4ToHex(v: vec4): string {
    const r = Math.round(v[0] * 255).toString(16).padStart(2, '0');
    const g = Math.round(v[1] * 255).toString(16).padStart(2, '0');
    const b = Math.round(v[2] * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

export function hexToVec4(hex: string): vec4 {
    return [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
        hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1,
    ];
}

export function rgba(vec4: vec4) {
    return `rgba(${vec4[0] * 255}, ${vec4[1] * 255}, ${vec4[2] * 255}, ${vec4[3]})`;
}

export function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function percentage(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
}

export function rectIntersects(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

export function inverseLerp(value: number, a: number, b: number): number {
    return clamp((value - a) / (b - a), 0, 1);
}