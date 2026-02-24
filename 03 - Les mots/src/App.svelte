<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { setupTracking, type TrackingResult } from './lib/tracking';
    import { navigate, route } from './lib/router';
    import CalibrationPage from './lib/pages/CalibrationPage.svelte';
    import DisplayPage from './lib/pages/DisplayPage.svelte';
    import SettingsPage from './lib/pages/SettingsPage.svelte';
    import { settings } from './lib/settings';
    import { cn } from './lib/utils';

    let webcamEl: HTMLVideoElement;
    let tracking: TrackingResult = {

        eyePosition: {
            x: 0.5,
            y: 0.5,
        },
    };

    let trackingStarted = false;
    let stopTracking: null | (() => void) = null;
    let trackingError: string | null = null;

    onMount(async () => {
        try {
            stopTracking = await setupTracking(webcamEl, (result) => {
                tracking = result;
                trackingStarted = true;
            });
        } catch (err) {
            trackingError = err instanceof Error ? err.message : String(err);
        }
    });

    onDestroy(() => {
        stopTracking?.();
    });
</script>

<main class="bg-black w-screen h-screen relative overflow-hidden flex flex-col items-center justify-center group">
    <button
        class={cn(
            "absolute bottom-4 right-4 z-40 size-11 rounded-full",
            "bg-white/10 hover:bg-white/15 text-white opacity-0",
            "hover:opacity-100 cursor-pointer transition-opacity")}
        type="button"
        aria-label="Open settings"
        on:click={() => navigate('settings')}
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

    {#if $route === 'settings'}
        <SettingsPage />
    {:else if $route === 'calibration'}
        <CalibrationPage />
    {:else}
        <DisplayPage
            {tracking}
            {trackingStarted}
        />
    {/if}

    {#if $settings.showDebug}
        <div class="absolute top-0 right-0 text-white bg-black/90 p-4 flex flex-col gap-1 z-20 text-sm">
            <div class="font-mono text-xs">X: {tracking.eyePosition.x.toFixed(3)}</div>
            <div class="font-mono text-xs">Y: {tracking.eyePosition.y.toFixed(3)}</div>
            {#if trackingError}
                <div class="font-mono text-xs text-red-300 break-all">Error: {trackingError}</div>
            {/if}
        </div>
    {/if}

    <video
        bind:this={webcamEl}
        autoplay
        playsinline
        class={cn(
            "absolute bottom-10 left-2 w-1/2",
            "md:bottom-4 md:left-4 md:w-1/4 h-auto object-contain -scale-x-100",
            $settings.showWebcam ? 'z-10 opacity-100' : '-z-10 opacity-0'
        )}
    ></video>
</main>
