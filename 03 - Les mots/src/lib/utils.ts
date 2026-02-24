export function cn(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

export function clamp01(value: number): number {
    return clamp(value, 0, 1);
}

export function remap(
    value: number,
    [fromMin, fromMax]: [number, number],
    [toMin, toMax]: [number, number]
): number {
    return clamp(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin), toMin, toMax);
}

export function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomArrayElement<T>(array: T[]): T {
    return array[randomInt(0, array.length - 1)];
}

export function inverseLerp(x: number, [a, b]: [number, number]): number {
    return clamp((x - a) / (b - a), 0, 1);
}

export function midPoint(a: number, b: number): number {
    return (a + b) / 2;
}

export function smoothDamp(current: number, target: number, velRef: { value: number }, smoothTime: number, deltaTime: number, maxSpeed = Infinity): number {
    smoothTime = Math.max(0.0001, smoothTime);
    let num = 2 / smoothTime;
    let num2 = num * deltaTime;
    let num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
    let num4 = current - target;
    let num5 = target;
    let num6 = maxSpeed * smoothTime;
    
    num4 = Math.min(Math.max(num4, -num6), num6);
    let num7 = target;
    target = current - num4;
    
    let num8 = (velRef.value + num * num4) * deltaTime;
    velRef.value = (velRef.value - num * num8) * num3;
    let num9 = num5 + (num4 + num8) * num3;
    
    if (num7 - current > 0 === num9 > num7) {
        num9 = num7;
        velRef.value = (num9 - num7) / deltaTime;
    }
    return num9;
  }

export type Point2 = {
    x: number;
    y: number;
};

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function randomPointInRect(rect: Rect): Point2 {
    return {
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
    };
}

export function length(a: number, b: number): number {
    return Math.sqrt(a * a + b * b);
}

export function distance(a: Point2, b: Point2): number {
    return length(a.x - b.x, a.y - b.y);
}

export type KalmanFilterParams = {
    processNoise: number;
    measurementNoise: number;
    initialEstimate: number;
    initialErrorCovariance?: number;
};

export function createKalmanFilter({
    processNoise = 1,
    measurementNoise = 1,
    initialEstimate = 0,
    initialErrorCovariance = 1,
}: Partial<KalmanFilterParams>): (measurement: number) => number {
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
