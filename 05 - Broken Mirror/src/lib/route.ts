import { writable } from 'svelte/store';

const DEFAULT_ID = 0;

function parseIdFromPath(): number {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '') || '';
    const segment = path ? path.split('/')[0] : '';
    if (!segment) return DEFAULT_ID;
    const n = parseInt(segment, 10);
    return Number.isNaN(n) ? DEFAULT_ID : n;
}

export const routeId = writable<number>(parseIdFromPath());

function updateFromPath() {
    routeId.set(parseIdFromPath());
}

window.addEventListener('popstate', updateFromPath);

export function navigateToId(value: number): void {
    const path = value === DEFAULT_ID ? '/' : `/${value}`;
    window.history.pushState({}, '', path);
    routeId.set(value);
}

export function getRouteId(): number {
    return parseIdFromPath();
}
