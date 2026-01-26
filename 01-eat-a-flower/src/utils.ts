export function percentage(value: number) {
	return `${(value * 100).toFixed(1)}%`;
}

export function scoreCalculation(jawOpen: number, mouthPucker: number) {
	return clamp((2.5 * jawOpen + (1 - mouthPucker) * 0.2) / 1.5 - 0.2, 0, 1);
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