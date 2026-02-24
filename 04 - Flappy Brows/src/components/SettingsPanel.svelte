<script lang="ts">
    import { settings, SettingsRanges } from '../lib/settings';
    import BooleanField from './BooleanField.svelte';
    import FloatField from './FloatField.svelte';
    import ColorField from './ColorField.svelte';

    export let open = false;
    export let onClose: () => void = () => {};
</script>

{#if open}
    <div
        class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
        role="dialog"
        aria-label="Paramètres"
    >
        <div class="w-full max-h-[90vh] overflow-y-auto p-6 grid grid-cols-2 gap-6 text-white">
            <div class="col-span-2 flex items-center justify-between mb-6">
                <div class="text-4xl font-semibold">Paramètres</div>
                <button
                    class="size-11 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-100 cursor-pointer"
                    type="button"
                    aria-label="Fermer"
                    onclick={onClose}
                >
                    <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <BooleanField
                label="Afficher la caméra"
                checked={$settings.showWebcam}
                onchange={(v) => settings.update((s) => ({ ...s, showWebcam: v }))}
            />

            <BooleanField
                label="Mode debug"
                checked={$settings.showDebug}
                onchange={(v) => settings.update((s) => ({ ...s, showDebug: v }))}
            />

            <FloatField
                label="Tracking FPS"
                min={SettingsRanges.trackingFps.min}
                max={SettingsRanges.trackingFps.max}
                value={$settings.trackingFps}
                step={1}
                decimals={0}
                oninput={(v) => settings.update((s) => ({ ...s, trackingFps: v }))}
            />

            <FloatField
                label="Jump threshold"
                min={SettingsRanges.jumpThreshold.min}
                max={SettingsRanges.jumpThreshold.max}
                value={$settings.jumpThreshold}
                oninput={(v) => settings.update((s) => ({ ...s, jumpThreshold: v }))}
            />

            <FloatField
                label="Jump speed"
                min={SettingsRanges.jumpSpeed.min}
                max={SettingsRanges.jumpSpeed.max}
                value={$settings.jumpSpeed}
                oninput={(v) => settings.update((s) => ({ ...s, jumpSpeed: v }))}
            />

            <FloatField
                label="Horizontal speed"
                min={SettingsRanges.horizontalSpeed.min}
                max={SettingsRanges.horizontalSpeed.max}
                value={$settings.horizontalSpeed}
                oninput={(v) => settings.update((s) => ({ ...s, horizontalSpeed: v }))}
            />

            <FloatField
                label="Hole min size"
                min={SettingsRanges.holeMinSize.min}
                max={SettingsRanges.holeMinSize.max}
                value={$settings.holeMinSize}
                oninput={(v) => settings.update((s) => ({ ...s, holeMinSize: v }))}
            />

            <FloatField
                label="Hole max size"
                min={SettingsRanges.holeMaxSize.min}
                max={SettingsRanges.holeMaxSize.max}
                value={$settings.holeMaxSize}
                oninput={(v) => settings.update((s) => ({ ...s, holeMaxSize: v }))}
            />

            <FloatField
                label="Hole min width"
                min={SettingsRanges.holeMinWidth.min}
                max={SettingsRanges.holeMinWidth.max}
                value={$settings.holeMinWidth}
                oninput={(v) => settings.update((s) => ({ ...s, holeMinWidth: v }))}
            />

            <FloatField
                label="Hole max width"
                min={SettingsRanges.holeMaxWidth.min}
                max={SettingsRanges.holeMaxWidth.max}
                value={$settings.holeMaxWidth}
                oninput={(v) => settings.update((s) => ({ ...s, holeMaxWidth: v }))}
            />

            <FloatField
                label="Player size"
                min={SettingsRanges.playerSize.min}
                max={SettingsRanges.playerSize.max}
                step={0.005}
                value={$settings.playerSize}
                oninput={(v) => settings.update((s) => ({ ...s, playerSize: v }))}
            />

            <FloatField
                label="Player trail interval (ms)"
                min={SettingsRanges.playerTrailInterval.min}
                max={SettingsRanges.playerTrailInterval.max}
                value={$settings.playerTrailInterval}
                step={10}
                decimals={0}
                oninput={(v) => settings.update((s) => ({ ...s, playerTrailInterval: v }))}
            />

            <FloatField
                label="Player trail fade time (s)"
                min={SettingsRanges.playerTrailFadeTime.min}
                max={SettingsRanges.playerTrailFadeTime.max}
                value={$settings.playerTrailFadeTime}
                step={0.1}
                oninput={(v) => settings.update((s) => ({ ...s, playerTrailFadeTime: v }))}
            />

            <FloatField
                label="Min spawn time (ms)"
                min={SettingsRanges.minSpawnTime.min}
                max={SettingsRanges.minSpawnTime.max}
                value={$settings.minSpawnTime}
                step={100}
                decimals={0}
                oninput={(v) => settings.update((s) => ({ ...s, minSpawnTime: v }))}
            />

            <FloatField
                label="Max spawn time (ms)"
                min={SettingsRanges.maxSpawnTime.min}
                max={SettingsRanges.maxSpawnTime.max}
                value={$settings.maxSpawnTime}
                step={100}
                decimals={0}
                oninput={(v) => settings.update((s) => ({ ...s, maxSpawnTime: v }))}
            />

            <FloatField
                label="Gravity"
                min={SettingsRanges.gravity.min}
                max={SettingsRanges.gravity.max}
                value={$settings.gravity}
                oninput={(v) => settings.update((s) => ({ ...s, gravity: v }))}
            />

            <FloatField
                label="Score increase rate (pts/s)"
                min={SettingsRanges.scoreIncreaseRate.min}
                max={SettingsRanges.scoreIncreaseRate.max}
                value={$settings.scoreIncreaseRate}
                step={0.5}
                oninput={(v) => settings.update((s) => ({ ...s, scoreIncreaseRate: v }))}
            />

            <FloatField
                label="Difficulty increase factor"
                min={SettingsRanges.difficultyIncreaseFactor.min}
                max={SettingsRanges.difficultyIncreaseFactor.max}
                value={$settings.difficultyIncreaseFactor}
                step={0.1}
                oninput={(v) => settings.update((s) => ({ ...s, difficultyIncreaseFactor: v }))}
            />

            <ColorField
                label="Background color"
                value={$settings.backgroundColor}
                oninput={(v) => settings.update((s) => ({ ...s, backgroundColor: v }))}
            />

            <ColorField
                label="Background color 2"
                value={$settings.backgroundColor2}
                oninput={(v) => settings.update((s) => ({ ...s, backgroundColor2: v }))}
            />


            <ColorField
                label="Foreground color"
                value={$settings.foregroundColor}
                oninput={(v) => settings.update((s) => ({ ...s, foregroundColor: v }))}
            />

            <ColorField
                label="Player color"
                value={$settings.playerColor}
                oninput={(v) => settings.update((s) => ({ ...s, playerColor: v }))}
            />

            <button
                class="col-span-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors duration-100 cursor-pointer"
                type="button"
                onclick={() => console.log(JSON.stringify($settings, null, 4))}
            >
                Log settings to console
            </button>
        </div>
    </div>
{/if}
