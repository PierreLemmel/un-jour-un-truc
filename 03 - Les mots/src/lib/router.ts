import { readable } from 'svelte/store';

export type RouteName = '' | 'settings' | 'calibration';

function parseHashRoute(): RouteName {
    const path = window.location.pathname || '';
    const normalized = path.replace(/^\/+/, '').toLowerCase();

    if (normalized === 'settings') return 'settings';
    if (normalized === 'calibration') return 'calibration';
    return '';
}

export const route = readable<RouteName>(parseHashRoute(), (set) => {
    const update = () => set(parseHashRoute());
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    return () => {
        window.removeEventListener('hashchange', update);
        window.removeEventListener('popstate', update);
    };
});

export function navigate(to: RouteName): void {
    const nextLocation = to === '' ? '/' : `/${to}`;
    if (window.location.hash === nextLocation) return;
    window.location.replace(nextLocation);
}

