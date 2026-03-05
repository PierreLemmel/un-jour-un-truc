<script lang="ts">
    export let label = '';
    export let min = 0;
    export let max = 1;
    export let value = 0;
    export let step = 0.01;
    export let decimals = 2;
    export let oninput: (value: number) => void = () => {};
</script>

<label class="flex flex-col gap-1">
    <span class="flex justify-between text-sm text-white/90">
        {label} ({min}–{max})
        <span class="text-gray-400">{value.toFixed(decimals)}</span>
    </span>
    <input
        type="range"
        {min}
        {max}
        {step}
        class="w-full accent-white"
        {value}
        oninput={(e) => oninput(parseFloat((e.currentTarget as HTMLInputElement).value))}
    />
</label>
