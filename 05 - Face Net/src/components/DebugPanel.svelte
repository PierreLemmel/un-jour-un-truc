<script lang="ts">
    import { cn } from '../lib/utils';
    
    let skipPerSecond = 0;
    let visionFps = 0;
    let renderFps = 0;

    let skipFrameCounter = 0;
    let visionFrameCounter = 0;
    let renderFrameCounter = 0;

    
    window.addEventListener('vision-frame', () => {
        visionFrameCounter++;
    });

    window.addEventListener('render-frame', () => {
        renderFrameCounter++;
    });

    window.addEventListener('skip-frame', () => {
        skipFrameCounter++;
    });

    setInterval(() => {
        skipPerSecond = skipFrameCounter;
        skipFrameCounter = 0;
        visionFps = visionFrameCounter;
        visionFrameCounter = 0;
        renderFps = renderFrameCounter;
        renderFrameCounter = 0;
    }, 1000)
</script>

<div class={cn(
    "absolute top-0 right-0",
    "text-white bg-black/90 p-4 z-20 text-sm font-mono flex flex-col gap-1",
    "w-1/4"
)}>
    <div>Skip per second: {skipPerSecond}</div>
    <div>Vision FPS: {visionFps}</div>
    <div>Render FPS: {renderFps}</div>
</div>