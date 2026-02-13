export function remap(value: number, [fromMin, fromMax]: [number, number], [toMin, toMax]: [number, number]) {
    return clamp(toMin + (toMax - toMin) * (value - fromMin) / (fromMax - fromMin), toMin, toMax);
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

export function inverseLerp(x: number, [a, b]: [number, number]) {
    return clamp((x - a) / (b - a), 0, 1);
}

export function clamp01(value: number) {
    return clamp(value, 0, 1);
}

export function midPoint(a: number, b: number) {
    return (a + b) / 2;
}


export function length(a: number, b: number) {
    return Math.sqrt(a * a + b * b);
}

export type Point2 = {
    x: number;
    y: number;
}

export function distance(a: Point2, b: Point2) {
    return length(a.x - b.x, a.y - b.y);
}

export type KalmanFilterParams = {
    /**
     * How much you expect the true value to change between updates.
     * Higher = more responsive (less smoothing). Lower = smoother (more inertia).
     */
    processNoise: number;
    /**
     * How noisy the measurements are.
     * Higher = trusts measurements less (more smoothing). Lower = trusts measurements more.
     */
    measurementNoise: number;
    /**
     * Starting value of the filtered estimate.
     */
    initialEstimate: number;
    /**
     * Initial uncertainty of `initialEstimate`.
     * Higher = adapts faster at the beginning. Lower = adapts more slowly initially.
     */
    initialErrorCovariance?: number;
}

export function createKalmanFilter({
    processNoise = 1,
    measurementNoise = 1,
    initialEstimate = 0,
    initialErrorCovariance = 1
}: Partial<KalmanFilterParams>) {
    let estimate = initialEstimate;
    let errorCovariance = initialErrorCovariance;

    return function filter(measurement: number): number {
        const predictedErrorCovariance = errorCovariance + processNoise;
        const kalmanGain = predictedErrorCovariance / (predictedErrorCovariance + measurementNoise);
        estimate = estimate + kalmanGain * (measurement - estimate);
        errorCovariance = (1 - kalmanGain) * predictedErrorCovariance;
        return estimate;
    };
}