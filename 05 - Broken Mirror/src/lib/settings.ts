import * as THREE from 'three';
import { writable } from 'svelte/store';

export type Settings = {
    mirrorCam: boolean;
    showWebcam: boolean;
    showDebug: boolean;
    showMesh: boolean;
    showPoints: boolean;
    showFaceLines: boolean;
    faceMeshMaster: number;
    faceLinesMaster: number;
    facePointsMaster: number;
    pointSize: number;
    lineWidth: number;
    faceProportion: number;
    faceOffset: number;
    pointSizeNoiseSpeed: number;
    pointSizeNoiseScale: number;
    pointColorNoiseSpeed: number;
    pointColorNoiseScale: number;
    backgroundColor1: THREE.Vector3;
    backgroundColor2: THREE.Vector3;
    pointColor1: THREE.Vector3;
    pointColor2: THREE.Vector3;
    lineColor1: THREE.Vector3;
    lineColor2: THREE.Vector3;
    surfaceColor1: THREE.Vector3;
    surfaceColor2: THREE.Vector3;
};

type NumericSettingsKey = { [K in keyof Settings]: Settings[K] extends number ? K : never }[keyof Settings];

export type SettingsRangesMap = Record<NumericSettingsKey, { min: number; max: number }>;

export const SettingsRanges: SettingsRangesMap = {
    faceMeshMaster: { min: 0, max: 1 },
    faceLinesMaster: { min: 0, max: 1 },
    facePointsMaster: { min: 0, max: 1 },
    pointSize: { min: 1, max: 20 },
    lineWidth: { min: 0.5, max: 10 },
    faceProportion: { min: 50, max: 100 },
    faceOffset: { min: -0.05, max: 0.15 },
    pointSizeNoiseSpeed: { min: 0, max: 10 },
    pointSizeNoiseScale: { min: 5, max: 30 },
    pointColorNoiseSpeed: { min: 0, max: 10 },
    pointColorNoiseScale: { min: 5, max: 30 },
} as const;

const STORAGE_KEY = 'face-net-settings';

const DEFAULT_SETTINGS: Settings = {
    "mirrorCam": true,
    "showWebcam": true,
    "showDebug": false,
    "showMesh": true,
    "showPoints": true,
    "showFaceLines": true,
    "faceMeshMaster": 1,
    "faceLinesMaster": 1,
    "facePointsMaster": 1,
    "pointSize": 11,
    "lineWidth": 0.5,
    "faceProportion": 100,
    "faceOffset": 0.02,
    "pointSizeNoiseSpeed": 1.5,
    "pointSizeNoiseScale": 30,
    "pointColorNoiseSpeed": 1,
    "pointColorNoiseScale": 19.5,
    "backgroundColor1": new THREE.Vector3(0, 0, 0),
    "backgroundColor2": new THREE.Vector3(0.1, 0.1, 0.1),
    "pointColor1": new THREE.Vector3(1, 1, 1),
    "pointColor2": new THREE.Vector3(0, 0.2980392156862745, 1),
    "lineColor1": new THREE.Vector3(1, 0, 0),
    "lineColor2": new THREE.Vector3(0.7, 0.7, 0.7),
    "surfaceColor1": new THREE.Vector3(0.2, 0.2, 0.2),
    "surfaceColor2": new THREE.Vector3(0.1, 0.1, 0.1),
};

const COLOR_KEYS = ['backgroundColor1', 'backgroundColor2', 'pointColor1', 'pointColor2', 'lineColor1', 'lineColor2', 'surfaceColor1', 'surfaceColor2'] as const;

function toVector3(val: unknown): THREE.Vector3 {
    if (val instanceof THREE.Vector3) return val;
    if (Array.isArray(val)) return new THREE.Vector3(val[0], val[1], val[2]);
    if (val && typeof val === 'object' && 'x' in val && 'y' in val && 'z' in val) {
        return new THREE.Vector3((val as { x: number }).x, (val as { y: number }).y, (val as { z: number }).z);
    }
    return new THREE.Vector3(0, 0, 0);
}

function loadInitialSettings(): Settings {
    if (typeof localStorage === 'undefined') {
        return { ...DEFAULT_SETTINGS };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(stored) as Partial<Settings>;
    const result = { ...DEFAULT_SETTINGS, ...parsed };
    for (const key of COLOR_KEYS) {
        if (parsed[key] !== undefined) {
            result[key] = toVector3(parsed[key]);
        }
    }
    return result;
}

export const settings = writable<Settings>(loadInitialSettings());

settings.subscribe((value) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
});
