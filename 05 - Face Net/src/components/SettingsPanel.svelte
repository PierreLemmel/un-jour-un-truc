<script lang="ts">
    import { settings } from '../lib/settings';
    import BooleanField from './BooleanField.svelte';

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
        </div>
    </div>
{/if}
