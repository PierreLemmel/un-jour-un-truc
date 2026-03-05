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
        class="absolute right-0 top-0 bottom-0 w-1/2 z-50 flex flex-col bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-label="Settings"
    >
        <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 gap-6 text-white">
            <div class="flex items-center justify-between mb-6">
                <div class="text-4xl font-semibold">Settings</div>
                <button
                    class="size-11 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-100 cursor-pointer"
                    type="button"
                    aria-label="Close"
                    on:click={onClose}
                >
                    <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <BooleanField
                label="Show webcam"
                checked={$settings.showWebcam}
                onchange={(v) => settings.update((s) => ({ ...s, showWebcam: v }))}
            />

            <BooleanField
                label="Show debug"
                checked={$settings.showDebug}
                onchange={(v) => settings.update((s) => ({ ...s, showDebug: v }))}
            />
            
            <BooleanField
                label="Mirror cam"
                checked={$settings.mirrorCam}
                onchange={(v) => settings.update((s) => ({ ...s, mirrorCam: v }))}
            />

            <FloatField
                label="Point size"
                min={SettingsRanges.pointSize.min}
                max={SettingsRanges.pointSize.max}
                value={$settings.pointSize}
                step={0.5}
                oninput={(v) => settings.update((s) => ({ ...s, pointSize: v }))}
            />

            <FloatField
                label="Line width"
                min={SettingsRanges.lineWidth.min}
                max={SettingsRanges.lineWidth.max}
                value={$settings.lineWidth}
                step={0.1}
                oninput={(v) => settings.update((s) => ({ ...s, lineWidth: v }))}
            />

            <FloatField
                label="Face proportion"
                min={SettingsRanges.faceProportion.min}
                max={SettingsRanges.faceProportion.max}
                value={$settings.faceProportion}
                step={1}
                decimals={0}
                oninput={(v) => settings.update((s) => ({ ...s, faceProportion: v }))}
            />

            <FloatField
                label="Face offset"
                min={SettingsRanges.faceOffset.min}
                max={SettingsRanges.faceOffset.max}
                value={$settings.faceOffset}
                step={0.01}
                decimals={2}
                oninput={(v) => settings.update((s) => ({ ...s, faceOffset: v }))}
            />

            <ColorField
                label="Background color 1"
                value={$settings.backgroundColor1}
                oninput={(v) => settings.update((s) => ({ ...s, backgroundColor1: v }))}
            />

            <ColorField
                label="Background color 2"
                value={$settings.backgroundColor2}
                oninput={(v) => settings.update((s) => ({ ...s, backgroundColor2: v }))}
            />

            <ColorField
                label="Point color 1"
                value={$settings.pointColor1}
                oninput={(v) => settings.update((s) => ({ ...s, pointColor1: v }))}
            />

            <ColorField
                label="Point color 2"
                value={$settings.pointColor2}
                oninput={(v) => settings.update((s) => ({ ...s, pointColor2: v }))}
            />

            <ColorField
                label="Line color 1"
                value={$settings.lineColor1}
                oninput={(v) => settings.update((s) => ({ ...s, lineColor1: v }))}
            />

            <ColorField
                label="Line color 2"
                value={$settings.lineColor2}
                oninput={(v) => settings.update((s) => ({ ...s, lineColor2: v }))}
            />

            <ColorField
                label="Surface color 1"
                value={$settings.surfaceColor1}
                oninput={(v) => settings.update((s) => ({ ...s, surfaceColor1: v }))}
            />

            <ColorField
                label="Surface color 2"
                value={$settings.surfaceColor2}
                oninput={(v) => settings.update((s) => ({ ...s, surfaceColor2: v }))}
            />

            <button
                class="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors duration-100 cursor-pointer"
                type="button"
                on:click={() => console.log(JSON.stringify($settings, null, 4))}
            >
                Log settings to console
            </button>
        </div>
    </div>
{/if}
