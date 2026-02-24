import { writable } from 'svelte/store';
import type { vec4 } from './utils';

export type Settings = {
    showWebcam: boolean;
    showDebug: boolean;
    trackingFps: number;
    jumpThreshold: number;
    jumpSpeed: number;
    horizontalSpeed: number;
    holeMinSize: number;
    holeMaxSize: number;
    holeMinWidth: number;
    holeMaxWidth: number;
    playerSize: number;
    playerTrailInterval: number;
    playerTrailFadeTime: number;
    minSpawnTime: number;
    maxSpawnTime: number;
    gravity: number;
    scoreIncreaseRate: number;
    difficultyIncreaseFactor: number;
    backgroundColor: vec4;
    backgroundColor2: vec4;
    foregroundColor: vec4;
    playerColor: vec4;
};

type NumericSettingsKey = { [K in keyof Settings]: Settings[K] extends number ? K : never }[keyof Settings];

export type SettingsRangesMap = Record<NumericSettingsKey, { min: number; max: number }>;

export const SettingsRanges: SettingsRangesMap = {
    trackingFps: { min: 1, max: 60 },
    jumpThreshold: { min: 0, max: 1 },
    jumpSpeed: { min: 0.01, max: 1 },
    horizontalSpeed: { min: 0.01, max: 1 },
    holeMinSize: { min: 0.05, max: 0.5 },
    holeMaxSize: { min: 0.2, max: 0.5 },
    holeMinWidth: { min: 0.1, max: 0.2 },
    holeMaxWidth: { min: 0.1, max: 0.2 },
    playerSize: { min: 0.02, max: 0.2 },
    playerTrailInterval: { min: 20, max: 500 },
    playerTrailFadeTime: { min: 0.2, max: 3 },
    minSpawnTime: { min: 1000, max: 15000 },
    maxSpawnTime: { min: 2000, max: 20000 },
    gravity: { min: 0, max: 1 },
    scoreIncreaseRate: { min: 0.1, max: 5 },
    difficultyIncreaseFactor: { min: 1, max: 2 },
} as const;

const STORAGE_KEY = 'flappy-brows-settings';

const DEFAULT_SETTINGS: Settings = {
    "showWebcam": false,
    "showDebug": false,
    "trackingFps": 10,
    "jumpThreshold": 0.58,
    "jumpSpeed": 0.31,
    "horizontalSpeed": 0.21,
    "holeMinSize": 0.22,
    "holeMaxSize": 0.34,
    "holeMinWidth": 0.13,
    "holeMaxWidth": 0.2,
    "playerSize": 0.035,
    "playerTrailInterval": 180,
    "playerTrailFadeTime": 1.2,
    "minSpawnTime": 2500,
    "maxSpawnTime": 3200,
    "gravity": 0.2,
    "scoreIncreaseRate": 1.6,
    "difficultyIncreaseFactor": 1.1,
    "backgroundColor": [
        0,
        0,
        0,
        1
    ],
    "backgroundColor2": [
        0.10196078431372549,
        0.10196078431372549,
        0.10196078431372549,
        1
    ],
    "foregroundColor": [
        1,
        1,
        1,
        1
    ],
    "playerColor": [
        0.8509803921568627,
        0.8509803921568627,
        0.8509803921568627,
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

    const parsed = JSON.parse(stored) as Partial<Settings> & { foregroundColor2?: vec4; playerTrailSize?: number };
    const { foregroundColor2: _, playerTrailSize: __, ...rest } = parsed;
    return {
        ...DEFAULT_SETTINGS,
        ...rest,
    };
}

export const settings = writable<Settings>(loadInitialSettings());

settings.subscribe((value) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
});
