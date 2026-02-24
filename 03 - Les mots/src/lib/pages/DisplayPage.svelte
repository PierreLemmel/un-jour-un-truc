<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type { TrackingResult } from '../tracking';
    import { settings, type Settings } from '../settings';
    import { clamp01, distance, randomInt, randomPointInRect, randomRange, remap, smoothDamp } from '../utils';

    import data from '../../content/texts.json';

    export let tracking: TrackingResult;
    export let trackingStarted: boolean;

    let canvasEl: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let rafId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    let canvasWidth = 1;
    let canvasHeight = 1;
    let dpr = 1;

    function resizeCanvas(): void {
        if (!canvasEl) return;
        const rect = canvasEl.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.floor(rect.width));
        const nextHeight = Math.max(1, Math.floor(rect.height));
        dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

        canvasWidth = nextWidth;
        canvasHeight = nextHeight;

        canvasEl.width = Math.floor(nextWidth * dpr);
        canvasEl.height = Math.floor(nextHeight * dpr);
        canvasEl.style.width = `${nextWidth}px`;
        canvasEl.style.height = `${nextHeight}px`;
    }

    let targetCenter = {
        x: 0.5,
        y: 0.5
    }

    let lastTime = performance.now();
    let alpha = $settings.minAlpha;
    let alphaVelRef = { value: 0 };

    let currentTextIndex = 0;
    let currentChunkIndex = 0;

    function goToNextChunk(): void {

        currentChunkIndex++;
        if (currentChunkIndex >= data[currentTextIndex].length) {
            currentChunkIndex = 0;

            currentTextIndex = (currentTextIndex + randomInt(1, data.length - 1)) % data.length;

            const {
                maxWidth,
                maxHeight
            } = data[currentTextIndex].reduce((max, text) => {
                const { width, height } = measureText(text);
                return {
                    maxWidth: Math.max(max.maxWidth, width / canvasWidth),
                    maxHeight: Math.max(max.maxHeight, height / canvasHeight)
                }
            }, { maxWidth: 0, maxHeight: 0 });

            targetCenter = {
                x: randomRange(maxWidth / 2, 1 - maxWidth / 2),
                y: randomRange(maxHeight / 2, 1 - maxHeight / 2)
            }
        }
    }

    function measureText(text: string): { width: number, height: number } {
        if (!ctx) return { width: 0, height: 0 };

        const metrics = ctx.measureText(text);
        return {
            width: metrics.width,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        };
    }

    function renderFrame(nowMs: number): void {
        if (!ctx) return;

        ctx.font = `${$settings.textSize}px Arial`;

        const dt = nowMs - lastTime;
        lastTime = nowMs;


        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const trackingX = tracking.eyePosition.x * canvasWidth;
        const trackingY = tracking.eyePosition.y * canvasHeight;

        const relDist = distance(tracking.eyePosition, targetCenter);

        const alphaTarget = remap(
            relDist,
            [$settings.displayDistance / 2, $settings.displayDistance],
            [$settings.minAlpha, 1]
        );

        const txt = data[currentTextIndex][currentChunkIndex];
        const txtSize = measureText(txt);

        const radius = 8 + 4 * (0.5 * Math.sin(4 * nowMs / 1000));

        if ($settings.showDebug) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(trackingX, trackingY, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        if ($settings.showDebugText) {
            ctx.fillStyle = 'green';
            ctx.fillRect(
                targetCenter.x * canvasWidth - txtSize.width / 2,
                targetCenter.y * canvasHeight - txtSize.height / 2,
                txtSize.width,
                txtSize.height
            )
        }

        alpha = smoothDamp(alpha, alphaTarget, alphaVelRef, $settings.textSmoothTime, dt, 0.05);
        
        ctx.globalAlpha = alpha;

        ctx.fillStyle = 'white';

        ctx.fillText(txt, targetCenter.x * canvasWidth - txtSize.width / 2, targetCenter.y * canvasHeight + txtSize.height / 2);

        ctx.globalAlpha = 1;
    }

    function startLoop(): void {
        const loop = (nowMs: number) => {
            renderFrame(nowMs);
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
    }

    function startTextLoop(): void {
        const loop = () => {
            goToNextChunk();
            setTimeout(loop, $settings.textDisplayDuration);
        };
        
        loop();
    }

    onMount(() => {
        ctx = canvasEl.getContext('2d');
        resizeCanvas();

        resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(canvasEl);

        startLoop();
        startTextLoop();
    });

    onDestroy(() => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        resizeObserver?.disconnect();
        resizeObserver = null;
        ctx = null;
    });
</script>

<div class="absolute inset-0">
    <canvas bind:this={canvasEl} class="absolute inset-0 w-full h-full"></canvas>

    {#if !trackingStarted}
    <div class="absolute inset-0 flex flex-col gap-2 items-center justify-center pointer-events-none select-none">
        <div class="text-white text-4xl md:text-6xl font-semibold tracking-tight">Les Mots</div>
        <div class="text-white text-sm">
            En attente d'initialisation du tracking...
        </div>
    </div>
    {/if}
</div>

