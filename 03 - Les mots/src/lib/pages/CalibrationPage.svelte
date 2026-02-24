<script lang="ts">
    import { navigate } from '../router';
    import { updateCalibrationAngle, updateCalibrationEyesHeight, updateCalibrationPoint } from '../tracking';
</script>

<div class="absolute inset-0 z-50 bg-black text-white text-sm">
    <div class="w-full h-full relative bg-gray-900">
        <button
            class="absolute top-1 left-1 size-8 bg-red-200 hover:bg-red-400 active:bg-red-600 rounded-full cursor-pointer"
            aria-label="Calibrate top left"
            on:click={() => updateCalibrationPoint('TopLeft')}
        ></button>
        <button
            class="absolute top-1 right-1 size-8 bg-red-200 hover:bg-red-400 active:bg-red-600 rounded-full cursor-pointer"
            aria-label="Calibrate top right"
            on:click={() => updateCalibrationPoint('TopRight')}
        ></button>
        <button
            class="absolute bottom-1 left-1 size-8 bg-red-200 hover:bg-red-400 active:bg-red-600 rounded-full cursor-pointer"
            aria-label="Calibrate bottom left"
            on:click={() => updateCalibrationPoint('BottomLeft')}
        ></button>
        <button
            class="absolute bottom-1 right-1 size-8 bg-red-200 hover:bg-red-400 active:bg-red-600 rounded-full cursor-pointer"
            aria-label="Calibrate bottom right"
            on:click={() => updateCalibrationPoint('BottomRight')}
        ></button>

        <button
            class="absolute top-1 left-1/2 -translate-x-1/2 size-8 bg-blue-200 hover:bg-blue-400 active:bg-blue-600 rounded-full cursor-pointer"
            aria-label="Calibrate tilt to up"
            on:click={() => updateCalibrationAngle('tiltToUp')}
        ></button>
        <button
            class="absolute right-1 top-1/2 -translate-y-1/2 size-8 bg-blue-200 hover:bg-blue-400 active:bg-blue-600 rounded-full cursor-pointer"
            aria-label="Calibrate pan to right"
            on:click={() => updateCalibrationAngle('panToRight')}
        ></button>
        <button
            class="absolute bottom-1 left-1/2 -translate-x-1/2 size-8 bg-blue-200 hover:bg-blue-400 active:bg-blue-600 rounded-full cursor-pointer"
            aria-label="Calibrate tilt to down"
            on:click={() => updateCalibrationAngle('tiltToDown')}
        ></button>
        <button
            class="absolute left-1 top-1/2 -translate-y-1/2 size-8 bg-blue-200 hover:bg-blue-400 active:bg-blue-600 rounded-full cursor-pointer"
            aria-label="Calibrate pan to left"
            on:click={() => updateCalibrationAngle('panToLeft')}
        ></button>

        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 w-[min(520px,90vw)]">
            <div class="text-center text-lg font-bold">Eyetracking Calibration</div>
            <div class="text-center">Look at the four corners by just moving your eyes and click on them.</div>
            <div class="text-center">Look at the middle of the screen by just moving your head and click on the blue points.</div>
            <div class="text-center">Set the height of your eyes by looking at the middle of the screen and clicking on the button.</div>
            <button
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                on:click={() => updateCalibrationEyesHeight()}
            >
                Set Eyes Height
            </button>
            <button
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                on:click={() => navigate('')}
            >
                OK
            </button>
        </div>
    </div>
</div>

