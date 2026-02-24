<script lang="ts">
    import { navigate } from '../router';
    import { settings } from '../settings';
</script>

<div class="absolute inset-0 flex flex-col items-center justify-center gap-6 text-white">
    <div class="text-3xl font-semibold">Settings</div>

    <div class="w-[min(560px,90vw)] p-4 flex flex-col gap-4">
        <label class="flex items-center justify-between gap-4">
            <span class="text-sm text-white/90">Show camera</span>
            <input
                type="checkbox"
                class="size-5 accent-white"
                checked={$settings.showWebcam}
                on:change={(e) =>
                    settings.update((s) => ({
                        ...s,
                        showWebcam: (e.currentTarget as HTMLInputElement).checked,
                    }))}
            />
        </label>

        <label class="flex items-center justify-between gap-4">
            <span class="text-sm text-white/90">Show debug</span>
            <input
                type="checkbox"
                class="size-5 accent-white"
                checked={$settings.showDebug}
                on:change={(e) =>
                    settings.update((s) => ({
                        ...s,
                        showDebug: (e.currentTarget as HTMLInputElement).checked,
                    }))}
            />
        </label>

        <label class="flex items-center justify-between gap-4">
            <span class="text-sm text-white/90">Show debug text</span>
            <input
                type="checkbox"
                class="size-5 accent-white"
                checked={$settings.showDebugText}
                on:change={(e) =>
                    settings.update((s) => ({
                        ...s,
                        showDebugText: (e.currentTarget as HTMLInputElement).checked,
                    }))}
            />
        </label>

        <label class="flex flex-col gap-1">
            <span class="flex justify-between text-sm text-white/90">
                Min alpha (0–1)
                <span class="text-gray-400">{$settings.minAlpha}</span>
            </span>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="w-full accent-white"
                value={$settings.minAlpha}
                on:input={(e) =>
                    settings.update((s) => ({
                        ...s,
                        minAlpha: parseFloat((e.currentTarget as HTMLInputElement).value),
                    }))}
            />
        </label>

        <label class="flex flex-col gap-1">
            <span class="flex justify-between text-sm text-white/90">
                Display distance (0–1.5)
                <span class="text-gray-400">{$settings.displayDistance}</span>
            </span>
            <input
                type="range"
                min="0"
                max="1.5"
                step="0.01"
                class="w-full accent-white"
                value={$settings.displayDistance}
                on:input={(e) =>
                    settings.update((s) => ({
                        ...s,
                        displayDistance: parseFloat((e.currentTarget as HTMLInputElement).value),
                    }))}
            />
        </label>

        <label class="flex flex-col gap-1">
            <span class="flex justify-between text-sm text-white/90">
                Text smooth time (0–500 ms)
                <span class="text-gray-400">{$settings.textSmoothTime} ms</span>
            </span>
            <input
                type="range"
                min="0"
                max="500"
                step="10"
                class="w-full accent-white"
                value={$settings.textSmoothTime}
                on:input={(e) =>
                    settings.update((s) => ({
                        ...s,
                        textSmoothTime: parseFloat((e.currentTarget as HTMLInputElement).value),
                    }))}
            />
        </label>

        <label class="flex flex-col gap-1">
            <span class="flex justify-between text-sm text-white/90">
                Text size (20–120 px)
                <span class="text-gray-400">{$settings.textSize} px</span>
            </span>
            <input
                type="range"
                min="20"
                max="120"
                step="1"
                class="w-full accent-white"
                value={$settings.textSize}
                on:input={(e) =>
                    settings.update((s) => ({
                        ...s,
                        textSize: parseFloat((e.currentTarget as HTMLInputElement).value),
                    }))}
            />
        </label>

        <label class="flex flex-col gap-1">
            <span class="flex justify-between text-sm text-white/90">
                Text display duration (500–3000 ms)
                <span class="text-gray-400">{$settings.textDisplayDuration} ms</span>
            </span>
            <input
                type="range"
                min="500"
                max="3000"
                step="100"
                class="w-full accent-white"
                value={$settings.textDisplayDuration}
                on:input={(e) =>
                    settings.update((s) => ({
                        ...s,
                        textDisplayDuration: parseFloat((e.currentTarget as HTMLInputElement).value),
                    }))}
            />
        </label>
    </div>

    <div class="flex flex-row gap-2">
        <button class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded" on:click={() => navigate('')}>Back</button>
        <button
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            on:click={() => navigate('calibration')}
        >
            Calibration
        </button>
    </div>
</div>