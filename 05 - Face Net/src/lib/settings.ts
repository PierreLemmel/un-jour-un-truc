import { writable } from 'svelte/store';

export type Settings = {
    showWebcam: boolean;
    showDebug: boolean;
};

const STORAGE_KEY = 'face-net-settings';

const DEFAULT_SETTINGS: Settings = {
    showWebcam: false,
    showDebug: false,
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
