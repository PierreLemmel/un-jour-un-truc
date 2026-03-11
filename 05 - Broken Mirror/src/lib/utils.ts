import * as THREE from 'three';

export function cn(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
}

export function vector3ToHex(v: THREE.Vector3): string {
    const r = Math.round(v.x * 255).toString(16).padStart(2, '0');
    const g = Math.round(v.y * 255).toString(16).padStart(2, '0');
    const b = Math.round(v.z * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

export function hexToVector3(hex: string): THREE.Vector3 {
    return new THREE.Vector3(
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255
    );
}

export function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(value, max));
}

export function moveTowards(current: number, target: number, maxDelta: number) {
	return current + Math.sign(target - current) * Math.min(Math.abs(target - current), maxDelta);
}

export function quadraticInterpolation(a: number, min: number, max: number) {
	return min + (max - min) * a * a;
}

export function linearInterpolation(a: number, min: number, max: number) {
	return min + (max - min) * a;
}

export function remap(value: number, [fromMin, fromMax]: [number, number], [toMin, toMax]: [number, number]) {
	return toMin + (toMax - toMin) * (value - fromMin) / (fromMax - fromMin);
}