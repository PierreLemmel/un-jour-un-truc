<script lang="ts">
    export let label = '';
    export let value = '';
    export let placeholder = '';
    export let oninput: (value: string) => void = () => {};
</script>

<label class="flex flex-col gap-1">
    <span class="text-sm text-white/90">{label}</span>
    <input
        type="text"
        class="w-full px-3 py-2 rounded border border-white/30 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-white/50"
        {value}
        {placeholder}
        oninput={(e: Event) => oninput((e.currentTarget as HTMLInputElement).value)}
    />
</label>
