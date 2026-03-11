<script lang="ts">
    import { cn } from '../lib/utils';
    
    let visionFps = 0;
    let renderFps = 0;

    let visionFrameCounter = 0;
    let renderFrameCounter = 0;

    let pointHoverIndex: number | null = null;
    let zoomValue: number = 1;
    
    window.addEventListener('vision-frame', () => {
        visionFrameCounter++;
    });

    window.addEventListener('render-frame', () => {
        renderFrameCounter++;
    });

    window.addEventListener('point-hover', (e) => {
        const { index } = (e as CustomEvent<{ index: number }>).detail;
        pointHoverIndex = index;
    });

    window.addEventListener('zoom-changed', (e) => {
        const { zoom } = (e as CustomEvent<{ zoom: number }>).detail;
        zoomValue = zoom;
    });

    setInterval(() => {
        visionFps = visionFrameCounter;
        visionFrameCounter = 0;
        renderFps = renderFrameCounter;
        renderFrameCounter = 0;
    }, 1000)
</script>

<div class={cn(
    "absolute top-0 right-0",
    "text-white bg-black/90 p-4 z-20 text-sm font-mono flex flex-col items-end gap-1",
    "w-1/4"
)}>
    <div>Vision FPS: {visionFps}</div>
    <div>Render FPS: {renderFps}</div>
    <div>Point Hover Index: {pointHoverIndex ?? 'None'}</div>
    <div>Zoom: {zoomValue.toFixed(2)}</div>
</div>