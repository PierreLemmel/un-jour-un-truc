<script lang="ts">
    import * as THREE from 'three';
    import { hexToVector3, vector3ToHex } from '../lib/utils';

    export let label = '';
    export let value: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    export let oninput: (value: THREE.Vector3) => void = () => {};
</script>

<label class="flex items-center justify-between gap-4">
    <span class="text-sm text-white/90">{label}</span>
    <input
        type="color"
        class="size-10 cursor-pointer rounded border border-white/30 bg-transparent"
        value={vector3ToHex(value)}
        oninput={(e: Event) => oninput(hexToVector3((e.currentTarget as HTMLInputElement).value))}
    />
</label>
