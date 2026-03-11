<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { settings } from './lib/settings';
    import { cn } from './lib/utils';
    import SettingsPanel from './components/SettingsPanel.svelte';
    import { disposeGraphics, type Point3, resizeGraphics, setupGraphics, updateFaceMeshPoints, setCameraSize } from './lib/graphics';
    import DebugPanel from './components/DebugPanel.svelte';
    import { startTriangle, startQuad } from './lib/devTools';

    let webcamEl: HTMLVideoElement;

    let visionWorker: Worker;

    let visionStarted = false;
    let webcamStarted = false;

    let settingsOpen = false;
    let paused = false;

    $: showSettings = import.meta.env.VITE_SHOW_SETTINGS === 'true';

    let canvasEl: HTMLCanvasElement;
    let containerEl: HTMLDivElement;
    let resizeObserver: ResizeObserver | null = null;

    function resize(): void {
        if (!canvasEl) return;
        const rect = containerEl.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        canvasEl.width = width;
        canvasEl.height = height;
        resizeGraphics(width, height);
    }

    let rvfcHandle: number | null = null;
    let isProcessing = false;
    async function sendFrameToTracking() {
        rvfcHandle = webcamEl.requestVideoFrameCallback(sendFrameToTracking);
        
        if (paused) return;

        if (isProcessing) return;

        isProcessing = true;
        try {
            const image = await createImageBitmap(webcamEl);
            visionWorker.postMessage(
                {
                    type: 'frame',
                    image
                },
                [image]
            );
        }
        catch (error) {
            console.error(error);
        }
    }

    let isFullyInitialized = false;
    $: if (webcamStarted && visionStarted && !isFullyInitialized) {
        isFullyInitialized = true;
        sendFrameToTracking();
    }

    function onVisionResult(values: Point3[]) {
        isProcessing = false;
        updateFaceMeshPoints(values);
        window.dispatchEvent(new CustomEvent('vision-frame'));
    }

    function onNoResult() {
        isProcessing = false;
        window.dispatchEvent(new CustomEvent('vision-frame'));
    }

    onMount(async () => {

        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case ' ':
                    paused = !paused;
                    break;
                case 's':
                    settingsOpen = !settingsOpen;
                    break;
                case 'd':
                    $settings.showDebug = !$settings.showDebug;
                    break;
                case 't':
                    startTriangle();
                    break;
                case 'q':
                    startQuad();
                    break;
            }

        });
        setupGraphics(canvasEl);
        resize();

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamEl.srcObject = stream;
        webcamEl.playsInline = true;
        webcamEl.muted = true;

        webcamEl.addEventListener('loadeddata', () => {
            setCameraSize(webcamEl.videoWidth, webcamEl.videoHeight);
            webcamStarted = true;
        });

        visionWorker = new Worker(
            new URL('./lib/vision.worker.ts', import.meta.url),
            { type: 'module' }
        );
        visionWorker.onmessage = (event) => {
            switch (event.data.type) {
                case 'vision-ready':
                    visionStarted = true;
                    break;
                case 'vision-result':
                    const { values } = event.data;
                    onVisionResult(values);
                    break;
                case 'no-result':
                    onNoResult();
                    break;
            }
        };

        resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(containerEl);
    });

    onDestroy(() => {

        resizeObserver?.disconnect();
        resizeObserver = null;
        disposeGraphics();

        if (rvfcHandle !== null) {
            webcamEl.cancelVideoFrameCallback(rvfcHandle);
            rvfcHandle = null;
        }

        visionWorker.terminate();
    });
</script>

<main class="bg-black w-screen h-screen relative overflow-hidden">
    <div bind:this={containerEl} class="absolute inset-0">
        <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>
    </div>

    {#if !visionStarted || !webcamStarted}
        <div class="absolute inset-0 flex flex-col gap-2 items-center justify-center pointer-events-none select-none">
            <div class="text-white text-4xl md:text-6xl font-semibold tracking-tight mb-4">Face Net</div>
            <div class="text-white text-sm">
                {visionStarted ? 'Vision initialized' : 'Waiting for vision initialization...'}
            </div>
            <div class="text-white text-sm">
                {webcamStarted ? 'Webcam initialized' : 'Waiting for webcam initialization...'}
            </div>
        </div>
    {/if}

    <div class="absolute bottom-4 right-4 z-40 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <button
            class={cn(
                "size-11 rounded-full cursor-pointer",
                paused ? "bg-amber-500/80 hover:bg-amber-500 text-white" : "bg-white/10 hover:bg-white/15 text-white"
            )}
            type="button"
            aria-label={paused ? "Resume tracking" : "Pause tracking"}
            on:click={() => {
                paused = !paused;
                if (!paused && webcamEl && visionStarted && webcamStarted) {
                    sendFrameToTracking();
                }
            }}
        >
            {#if paused}
                <svg viewBox="0 0 24 24" class="size-6 mx-auto" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                </svg>
            {:else}
                <svg viewBox="0 0 24 24" class="size-6 mx-auto" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
            {/if}
        </button>
        {#if showSettings}
            <button
                class={cn(
                    "size-11 rounded-full",
                    "bg-white/10 hover:bg-white/15 text-white",
                    "cursor-pointer"
                )}
                type="button"
                aria-label="Open settings"
                on:click={() => (settingsOpen = true)}
            >
                <svg viewBox="0 0 24 24" class="size-6 mx-auto" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
                    />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            </button>
        {/if}
    </div>

    <SettingsPanel open={settingsOpen} onClose={() => (settingsOpen = false)} />

    <video
        bind:this={webcamEl}
        autoplay
        playsinline
        class={cn(
            "absolute bottom-4 left-4 w-1/4 h-auto object-contain",
            $settings.mirrorCam ? '-scale-x-100' : 'scale-x-100',
            $settings.showWebcam ? 'z-10 opacity-100' : '-z-10 opacity-0'
        )}
    ></video>

    {#if $settings.showDebug}
        <DebugPanel />
    {/if}
</main>
