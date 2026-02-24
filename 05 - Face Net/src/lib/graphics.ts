let ctx: CanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let animationFrameId: number | null = null;
let setup = false;

export function setupGraphics(canvas: HTMLCanvasElement): void {
    if (setup) return;

    ctx = canvas.getContext('2d');
    if (!ctx) return;

    setup = true;

    function loop(): void {
        if (ctx && width > 0 && height > 0) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
        }
        animationFrameId = requestAnimationFrame(loop);
    }

    loop();
}

export function resizeGraphics(w: number, h: number): void {
    width = w;
    height = h;
}

export function disposeGraphics(): void {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    ctx = null;
    setup = false;
}
