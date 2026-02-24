<script lang="ts">
    import { cn, percentage } from '../lib/utils';

    let browScore = 0;
    
    let skipPerSecond = 0;
    let trackingFps = 0;
    let gameFps = 0;

    let skipFrameCounter = 0;
    let trackingFrameCounter = 0;
    let gameFrameCounter = 0;

    
    window.addEventListener('tracking-result', (event: Event) => {
        const { value } = (event as CustomEvent<{ value: number }>).detail;

        browScore = value;
        trackingFrameCounter++;
    });

    window.addEventListener('game-update', (event: Event) => {
        gameFrameCounter++;
    });

    window.addEventListener('skip-frame', () => {
        skipFrameCounter++;
    });

    setInterval(() => {
        skipPerSecond = skipFrameCounter;
        skipFrameCounter = 0;
        trackingFps = trackingFrameCounter;
        trackingFrameCounter = 0;
        gameFps = gameFrameCounter;
        gameFrameCounter = 0;
    }, 1000)
</script>

<div class={cn(
    "absolute top-0 right-0",
    "text-white bg-black/90 p-4 z-20 text-sm font-mono flex flex-col gap-1",
    "w-1/4"
)}>
    <div>Brow Score: {percentage(browScore)}</div>
    <div>Skip per second: {skipPerSecond}</div>
    <div>Tracking FPS: {trackingFps}</div>
    <div>Game FPS: {gameFps}</div>
</div>