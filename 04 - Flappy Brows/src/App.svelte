<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { settings } from './lib/settings';
    import { cn } from './lib/utils';
    import SettingsPanel from './components/SettingsPanel.svelte';
    import DebugPanel from './components/DebugPanel.svelte';
    import { disposeGame, highscore, jump, pauseGame, resizeGame, resumeGame, setupGame, startGame, score } from './lib/game';

    let webcamEl: HTMLVideoElement;

    let trackingWorker: Worker;

    let trackingStarted = false;
    let webcamStarted = false;

    let settingsOpen = false;
    let gameOver = true;
    let paused = false;

    $: showSettings = import.meta.env.VITE_SHOW_SETTINGS === 'true';

    function togglePause(): void {
        paused = !paused;
        paused ? pauseGame() : resumeGame();
    }


    function restartGame(): void {
        gameOver = false;
        paused = false;

        startGame();
    }

    let canvasEl: HTMLCanvasElement;
    let containerEl: HTMLDivElement;
    let resizeObserver: ResizeObserver | null = null;
    let gameOverTime = 0;
    function onGameOver(): void {
        gameOver = true;
        gameOverTime = performance.now();
    }

    function resize(): void {
        if (!canvasEl) return;
        const rect = containerEl.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        canvasEl.width = width;
        canvasEl.height = height;
        resizeGame(width, height);
    }

    const { jumpThreshold } = $settings;

    function onTrackingResult(value: number) {

        if (!gameOver) {
            if (value > jumpThreshold) {
                jump();
            }

            window.dispatchEvent(new CustomEvent('tracking-result', {
                detail: {
                    value
                }
            }));
        }
        else {
            if (value > 0.75 && performance.now() - gameOverTime > 1000) {
                restartGame();
            }
        }
    }

    function onSkipFrame() {
        window.dispatchEvent(new CustomEvent('skip-frame'));
    }

    onMount(async () => {
        setupGame(canvasEl);
        resize();
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamEl.srcObject = stream;
        webcamEl.playsInline = true;
        webcamEl.muted = true;
        
        webcamEl.addEventListener('loadeddata', () => {
            webcamStarted = true;
        });

        trackingWorker = new Worker(
            new URL('./lib/tracking.worker.ts', import.meta.url),
            { type: 'module' }
        );
        trackingWorker.onmessage = (event) => {
            switch (event.data.type) {
                case 'tracking-ready':
                    trackingStarted = true;
                    break;
                case 'tracking-result':
                    const { value } = event.data;
                    onTrackingResult(value);
                    break;
                case 'skip-frame':
                    onSkipFrame();
                    break;
            }
        };

        window.addEventListener('game-over', onGameOver);

        window.addEventListener('keydown', (event) => {
            if (event.key === ' ') {
                jump();
            }
        }); 

        resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(containerEl);
    });

    

    let rvfcHandle: number | null = null;
    async function sendFrameToTracking() {
        rvfcHandle = webcamEl.requestVideoFrameCallback(sendFrameToTracking);

        const image = await createImageBitmap(webcamEl);
        trackingWorker.postMessage(
            {
                type: 'frame',
                image
            },
            [image]
        );
    }

    let isFullyInitialized = false;
    $: if (webcamStarted && trackingStarted && !isFullyInitialized) {
        isFullyInitialized = true;
        sendFrameToTracking();
    }

    onDestroy(() => {
        window.removeEventListener('game-over', onGameOver);
        resizeObserver?.disconnect();
        resizeObserver = null;
        disposeGame();

        if (rvfcHandle !== null) {
            webcamEl.cancelVideoFrameCallback(rvfcHandle);
            rvfcHandle = null;
        }
    });
</script>

<main class="bg-black w-screen h-screen relative overflow-hidden">
    <div bind:this={containerEl} class="absolute inset-0">
        <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>
    </div>

    {#if !gameOver}
        <div class={cn(
            "absolute top-4 left-4 z-40 text-4xl select-none",
            $score <= $highscore ? "text-white font-semibold" : "text-yellow-500 font-bold",
            "flex items-center gap-2"
        )}>
            {Math.floor($score)}
        </div>
    {/if}

    {#if !trackingStarted || !webcamStarted}
        <div class="absolute inset-0 flex flex-col gap-2 items-center justify-center pointer-events-none select-none">
            <div class="text-white text-4xl md:text-6xl font-semibold tracking-tight mb-4">Flappy Brows</div>
            <div class="text-white text-sm">
                {trackingStarted ? 'Tracking initialisé' : 'En attente d\'initialisation du tracking...'}
            </div>
            <div class="text-white text-sm">
                {webcamStarted ? 'Webcam initialisée' : 'En attente d\'initialisation de la webcam...'}
            </div>
        </div>
    {:else if gameOver}
        <div
            class="absolute inset-0 z-30 flex flex-col gap-6 items-center justify-center bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-label="Game Over"
        >
            <div class="text-white text-4xl md:text-6xl font-semibold tracking-tight">Flappy Brows</div>
            <div class="text-white text-xl opacity-90">Raise your eyebrows to start a game</div>
            {#if $score > 0}
                <div class="text-white text-3xl font-semibold">Your score: {Math.floor($score)}</div>
                <div class="text-white text-xl opacity-90">Best score: {$highscore}</div>
            {/if}
            <button
                class="px-8 py-4 text-lg bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-100 cursor-pointer font-medium"
                type="button"
                on:click={restartGame}
            >
                Play
            </button>
        </div>
    {/if}

    {#if showSettings}
        <div class="absolute bottom-4 right-4 z-40 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
            <button
                class={cn(
                    "size-11 rounded-full",
                    "bg-white/10 hover:bg-white/15 text-white",
                    "cursor-pointer"
                )}
                type="button"
                aria-label={paused ? 'Resume' : 'Pause'}
                on:click={togglePause}
            >
                {#if paused}
                    <svg viewBox="0 0 24 24" class="size-6 mx-auto" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                {:else}
                    <svg viewBox="0 0 24 24" class="size-6 mx-auto" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                {/if}
            </button>
            <button
                class={cn(
                    "size-11 rounded-full",
                    "bg-white/10 hover:bg-white/15 text-white",
                    "cursor-pointer"
                )}
                type="button"
                aria-label="Ouvrir les paramètres"
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
        </div>
    {/if}

    <SettingsPanel open={settingsOpen} onClose={() => (settingsOpen = false)} />

    <video
        bind:this={webcamEl}
        autoplay
        playsinline
        class={cn(
            "absolute bottom-4 left-4 w-1/4 h-auto object-contain -scale-x-100",
            $settings.showWebcam ? 'z-10 opacity-100' : '-z-10 opacity-0'
        )}
    ></video>

    {#if $settings.showDebug}
        <DebugPanel />
    {/if}
</main>
