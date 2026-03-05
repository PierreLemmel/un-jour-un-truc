<script lang="ts">
    export let label = '';
    export let checked = false;
    export let onchange: (value: boolean) => void = () => {};
</script>

<label class="flex items-center justify-between gap-4">
    <span class="text-sm text-white/90">{label}</span>
    <input
        type="checkbox"
        class="size-5 accent-white"
        {checked}
        onchange={(e) => onchange((e.currentTarget as HTMLInputElement).checked)}
    />
</label>
