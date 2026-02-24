import { writable } from 'svelte/store';

export type Settings = {
    showWebcam: boolean;
    showDebug: boolean;
    showDebugText: boolean;

    /**
     * Minimum alpha value for the text (0 to 1)
     */
    minAlpha: number;

    /**
     * Distance at which text disappears, relative to screen size (0 to 1.5)
     */
    displayDistance: number;

    /**
     * text smooth time in ms (0 to 500)
     */
    textSmoothTime: number;

    /**
     * text size in pixels (20 to 120)
     */
    textSize: number;

    /**
     * text display duration in ms (500 to 3000)
     */
    textDisplayDuration: number;
};

const STORAGE_KEY = 'les-mots-settings';

const DEFAULT_SETTINGS: Settings = {
    showWebcam: false,
    showDebug: false,
    showDebugText: false,
    minAlpha: 0.05,
    displayDistance: 0.5,
    textSmoothTime: 200,
    textSize: 20,
    textDisplayDuration: 1500,
};

function getQueryParam(name: string): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) === 'true';
}

function loadInitialSettings(): Settings {
    if (typeof localStorage === 'undefined') {
        return {
            ...DEFAULT_SETTINGS,
            showWebcam: getQueryParam('webcam'),
            showDebug: getQueryParam('debug'),
        };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return {
            ...DEFAULT_SETTINGS,
            showWebcam: getQueryParam('webcam'),
            showDebug: getQueryParam('debug'),
        };
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

