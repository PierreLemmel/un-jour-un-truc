import { writable } from 'svelte/store';
import type { vec4 } from './utils';

export type Settings = {
    mirrorCam: boolean;
    showWebcam: boolean;
    showDebug: boolean;
    pointSize: number;
    lineWidth: number;
    faceProportion: number;
    faceOffset: number;
    pointSizeNoiseSpeed: number;
    pointSizeNoiseScale: number;
    pointColorNoiseSpeed: number;
    pointColorNoiseScale: number;
    backgroundColor1: vec4;
    backgroundColor2: vec4;
    pointColor1: vec4;
    pointColor2: vec4;
    lineColor1: vec4;
    lineColor2: vec4;
    surfaceColor1: vec4;
    surfaceColor2: vec4;
};

type NumericSettingsKey = { [K in keyof Settings]: Settings[K] extends number ? K : never }[keyof Settings];

export type SettingsRangesMap = Record<NumericSettingsKey, { min: number; max: number }>;

export const SettingsRanges: SettingsRangesMap = {
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
    "pointSize": 11,
    "lineWidth": 0.5,
    "faceProportion": 100,
    "faceOffset": 0.02,
    "pointSizeNoiseSpeed": 1.5,
    "pointSizeNoiseScale": 30,
    "pointColorNoiseSpeed": 1,
    "pointColorNoiseScale": 19.5,
    "backgroundColor1": [
        0,
        0,
        0,
        1
    ],
    "backgroundColor2": [
        0.1,
        0.1,
        0.1,
        1
    ],
    "pointColor1": [
        1,
        1,
        1,
        1
    ],
    "pointColor2": [
        0,
        0.2980392156862745,
        1,
        1
    ],
    "lineColor1": [
        1,
        0,
        0,
        1
    ],
    "lineColor2": [
        0.7,
        0.7,
        0.7,
        1
    ],
    "surfaceColor1": [
        0.2,
        0.2,
        0.2,
        1
    ],
    "surfaceColor2": [
        0.1,
        0.1,
        0.1,
        1
    ],
};

function loadInitialSettings(): Settings {
    if (typeof localStorage === 'undefined') {
        return { ...DEFAULT_SETTINGS };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(stored) as Partial<Settings>;
    return {
        ...DEFAULT_SETTINGS,
        ...parsed,
    };
}

export const settings = writable<Settings>(loadInitialSettings());

settings.subscribe((value) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
});
