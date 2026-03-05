<script lang="ts">
    import { vec4ToHex, hexToVec4 } from '../lib/utils';
    import type { vec4 } from '../lib/utils';

    export let label = '';
    export let value: vec4 = [0, 0, 0, 1];
    export let oninput: (value: vec4) => void = () => {};
</script>

<label class="flex items-center justify-between gap-4">
    <span class="text-sm text-white/90">{label}</span>
    <input
        type="color"
        class="size-10 cursor-pointer rounded border border-white/30 bg-transparent"
        value={vec4ToHex(value)}
        oninput={(e) => oninput(hexToVec4((e.currentTarget as HTMLInputElement).value))}
    />
</label>
