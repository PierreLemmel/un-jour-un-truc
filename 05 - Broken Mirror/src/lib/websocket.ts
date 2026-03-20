import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { settings } from './settings';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export const wsStatus = writable<WebSocketStatus>('disconnected');
export const ws = writable<WebSocket | null>(null);

const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

function toWsUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) return trimmed;
    if (trimmed.startsWith('http://')) return 'ws://' + trimmed.slice(7);
    if (trimmed.startsWith('https://')) return 'wss://' + trimmed.slice(8);
    return 'ws://' + trimmed;
}

let socket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = RECONNECT_DELAY_MS;
let currentUrl = '';
let intentionalClose = false;

function clearReconnectTimeout() {
    if (reconnectTimeout !== null) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
}

function connect(url: string, reconnecting = false) {
    const wsUrl = toWsUrl(url);
    if (!wsUrl) {
        wsStatus.set('disconnected');
        ws.set(null);
        return;
    }

    if (reconnecting) {
        console.log('[WS] Reconnecting to', wsUrl);
    } else {
        console.log('[WS] Connecting to', wsUrl);
    }

    intentionalClose = false;
    currentUrl = url;
    wsStatus.set('connecting');

    try {
        socket = new WebSocket(wsUrl);
        ws.set(socket);

        socket.onopen = () => {
            reconnectDelay = RECONNECT_DELAY_MS;
            wsStatus.set('connected');
            console.log('[WS] Connected');
        };

        socket.onclose = () => {
            ws.set(null);
            socket = null;

            if (intentionalClose) {
                wsStatus.set('disconnected');
                console.log('[WS] Disconnected');
                return;
            }
            else {
                console.log('[WS] Connection failed');
            }

            console.log('[WS] Reconnecting in', reconnectDelay, 'ms');
            wsStatus.set('disconnected');
            clearReconnectTimeout();
            reconnectTimeout = setTimeout(() => {
                reconnectTimeout = null;
                const latestUrl = get(settings).wsUrl;
                if (latestUrl === currentUrl) {
                    connect(latestUrl, true);
                }
                reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
            }, reconnectDelay);
        };

        socket.onerror = (err) => {
            wsStatus.set('error');
        };
    } catch (err) {
        wsStatus.set('error');
        ws.set(null);
        console.log('[WS] Reconnecting in', reconnectDelay, 'ms');
        clearReconnectTimeout();
        reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connect(get(settings).wsUrl, true);
        }, reconnectDelay);
    }
}

function disconnect() {
    intentionalClose = true;
    clearReconnectTimeout();
    if (socket) {
        socket.close();
        socket = null;
        ws.set(null);
    }
    wsStatus.set('disconnected');
}

let unsubscribe: (() => void) | null = null;

export function initWebSocket() {
    if (unsubscribe) return;

    const s = get(settings);
    connect(s.wsUrl);

    unsubscribe = settings.subscribe((s) => {
        const url = s.wsUrl;
        if (url !== currentUrl) {
            disconnect();
            connect(url);
        }
    });
}

export function disposeWebSocket() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    disconnect();
}
