import { writable } from 'svelte/store';
import { settings } from './settings';
import { get } from 'svelte/store';
import { inverseLerp, randomRange, rectIntersects, rgba } from './utils';

let ctx: CanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let animationFrameId: number | null = null;
let lastTime = 0;

let setup = false;
let isPlaying = false;
let paused = true;

export type GameUpdate = {
    deltaTime: number;
};

export function pauseGame(): void {
    paused = true;
}

export function resumeGame(): void {
    paused = false;
}

export function setupGame(canvas: HTMLCanvasElement): void {
    if (setup) return;

    ctx = canvas.getContext('2d');
    if (!ctx) return;

    setup = true;

    function loop(): void {
        if (!paused) {
            updateGame();
        }
        animationFrameId = requestAnimationFrame(loop);
    }

    loop();
}

let x = 0;
let y = 0;
let yVelocity = 0;
let startTime = 0;

let nextSpawnTime = 0;
let nextTrailItemTime = 0;

export const score = writable<number>(0);

const HIGHSCORE_KEY = 'flappy-brows-highscore';

function loadHighscore(): number {
    if (typeof localStorage === 'undefined') return 0;
    const stored = localStorage.getItem(HIGHSCORE_KEY);
    return stored ? Math.max(0, parseInt(stored, 10)) : 0;
}

export const highscore = writable<number>(loadHighscore());

highscore.subscribe((value) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(HIGHSCORE_KEY, String(value));
});

export function startGame(): void {
    if (!setup) {
        throw new Error('Game not setup');
    }

    items.splice(0, items.length)
    
    const {
        minSpawnTime,
        maxSpawnTime,
        playerTrailInterval,
    } = get(settings);

    nextSpawnTime = randomRange(minSpawnTime, maxSpawnTime) / 1000;
    nextTrailItemTime = playerTrailInterval / 1000;

    x = width / 2;
    y = height / 2;

    yVelocity = 0;
    isPlaying = true;
    paused = false;
    score.set(0);
    
    startTime = performance.now();
    lastTime = performance.now();
}

export function resizeGame(w: number, h: number): void {
    width = w;
    height = h;

    x = width / 2;
    y = height / 2;

    yVelocity = 0;
}


const PLAYER_WEIGHT = 5;

export function jump(): void {
    const { jumpSpeed } = get(settings);

    yVelocity = -jumpSpeed;
}

type ItemData = {
    x: number;
    holeSize: number;
    width: number;
    holeY: number;
}

const items: ItemData[] = [];

type TrailItemData = {
    x: number;
    y: number;
    fade: number;
}

const trailItems: TrailItemData[] = [];

const HOLE_MARGIN = 0.18;
const ITEM_SPAWN_MARGIN = 0.2;
const ITEM_RECT_SIZE = 1;
const VELOCITY_MULTIPLIER = 1000;

export function updateGame(): void {
    if (!ctx || width <= 0 || height <= 0) return;

    if (!isPlaying) return;
    if (paused) return;

    const now = performance.now();
    const deltaTime = lastTime > 0 ? (now - lastTime) / 1000 : 0;
    
    lastTime = now;
    const time = (now - startTime) / 1000;

    const s = get(settings);

    const {
        backgroundColor,
        backgroundColor2,
        foregroundColor,
        playerColor,
        playerSize: relativePlayerSize,
        gravity,
        scoreIncreaseRate,
        horizontalSpeed,
        playerTrailFadeTime,
        playerTrailInterval,
    } = s;

    const difficultyProgress = Math.min(1, time / 60);
    const difficultyMultiplier = 1 + (s.difficultyIncreaseFactor - 1) * difficultyProgress;

    yVelocity += PLAYER_WEIGHT * gravity * deltaTime;
    y += yVelocity * deltaTime * VELOCITY_MULTIPLIER;

    if (time > nextSpawnTime) {
        const {
            holeMinSize,
            holeMaxSize,
            holeMinWidth,
            holeMaxWidth,
            minSpawnTime,
            maxSpawnTime,
        } = s;

        const holeWidth = randomRange(holeMinWidth, holeMaxWidth);
        const holeSize = randomRange(holeMinSize, holeMaxSize);
        const holeY = randomRange(HOLE_MARGIN + holeSize / 2, 1 - holeSize / 2 - HOLE_MARGIN);

        items.push({
            x: 1 + ITEM_SPAWN_MARGIN,
            holeSize,
            width: holeWidth,
            holeY,
        });

        const spawnInterval = randomRange(minSpawnTime, maxSpawnTime) / 1000 / difficultyMultiplier;
        nextSpawnTime = time + spawnInterval;
    }

    if (time > nextTrailItemTime) {
        const newItem = {
            x: 0.5,
            y: y / height,
            fade: 1,
        };
        trailItems.push(newItem);
        nextTrailItemTime = time + playerTrailInterval / 1000 / difficultyMultiplier;
    }
    

    const bgGradient = ctx.createLinearGradient(0, height, 0, 0);
    bgGradient.addColorStop(1, rgba(backgroundColor));
    bgGradient.addColorStop(0, rgba(backgroundColor2));
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    
    const playerRgba = rgba(playerColor);
    const playerSize = relativePlayerSize * Math.max(width, height);
    ctx.fillStyle = playerRgba;

    const px = x - playerSize / 2;
    const py = y - playerSize / 2;

    ctx.fillRect(px, py, playerSize, playerSize);

    let lost = false;

    const fgRgba = rgba(foregroundColor);

    const itemToRemove: number[] = [];
    let i = 0;
    for (const item of items) {
        item.x -= horizontalSpeed * difficultyMultiplier * deltaTime;
        const itemX = (item.x - item.width / 2) * width;

        const itemW = item.width * width;
        const itemH = ITEM_RECT_SIZE * height;

        const r1y = (item.holeY - item.holeSize / 2 - ITEM_RECT_SIZE) * height;
        const r2y = (item.holeY + item.holeSize / 2) * height;

        lost ||= rectIntersects(px, py, playerSize, playerSize, itemX, r1y, itemW, itemH);
        lost ||= rectIntersects(px, py, playerSize, playerSize, itemX, r2y, itemW, itemH);

        ctx.fillStyle = fgRgba;
        ctx.fillRect(itemX, r1y, itemW, itemH);
        ctx.fillRect(itemX, r2y, itemW, itemH);

        if (item.x < -ITEM_SPAWN_MARGIN) {
            // console.log('pushing item to remove', i);
            // console.log('items', items);
            itemToRemove.push(i);
        }
        
        i++;
    }

    for (const index of itemToRemove) {
        // console.log('items', items);
        // console.log('removing item', index);
        items.splice(index, 1);
    }

    const trailItemToRemove: number[] = [];
    let j = 0;
    for (const trailItem of trailItems) {
        trailItem.x -= horizontalSpeed * difficultyMultiplier * deltaTime;
        trailItem.fade -= deltaTime / playerTrailFadeTime;
        if (trailItem.fade < 0) {
            trailItemToRemove.push(j);
        }

        ctx.globalAlpha = Math.max(0, trailItem.fade);
        ctx.fillStyle = playerRgba;

        const trailSize = playerSize * inverseLerp(Math.max(0, trailItem.fade), 0.25, 1);

        ctx.fillRect(trailItem.x * width - trailSize / 2, trailItem.y * height - trailSize / 2, trailSize, trailSize);
        j++;
    }
    for (const index of trailItemToRemove) {
        trailItems.splice(index, 1);
    }

    ctx.globalAlpha = 1;
    
    lost ||= y > height || y < 0;

    if (lost) {
        isPlaying = false;
        const currentScore = get(score);
        highscore.update((h) => (currentScore > h ? Math.floor(currentScore) : h));
        window.dispatchEvent(new CustomEvent('game-over'));
    } else {
        score.update((s: number) => s + scoreIncreaseRate * deltaTime);
        window.dispatchEvent(new CustomEvent<GameUpdate>('game-update', {
            detail: { deltaTime },
        }));
    }
}

export function disposeGame(): void {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    ctx = null;
    isPlaying = false;
}
