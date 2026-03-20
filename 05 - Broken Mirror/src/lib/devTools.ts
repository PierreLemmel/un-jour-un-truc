let buffer: number[] = [];
let debugLines: string[] = [];

let state: 'idle' | 'quad' | 'triangle' | 'line' = 'idle';

export function startTriangle() {
    buffer = [];
    state = 'triangle';
}

export function startQuad() {
    buffer = [];
    state = 'quad';
}

export function startLine() {
    buffer = [];
    state = 'line';
}

function displayLines() {
    console.log(debugLines.map(line => `    ${line},`).join('\n'));
}

function onPoint(idx: number) {
    if (state === 'idle') return;

    buffer.push(idx);

    if (state === 'triangle') {
        if (buffer.length === 3) {
            const line = `t(${buffer.join(', ')})`;
            debugLines.push(line);

            displayLines();
            buffer = [];
        }
    }
    else if (state === 'quad') {
        if (buffer.length === 4) {
            const line = `q(${buffer.join(', ')})`;
            debugLines.push(line);

            displayLines();
            buffer = [];
        }
    }
    else if (state === 'line') {
        console.log(`l(${buffer.join(', ')})`);
    }
}

let lastPoint: number | null = null;

window.addEventListener('pointerdown', (e) => {
    if (lastPoint === null) return;
    onPoint(lastPoint);
})

window.addEventListener('point-hover', (e) => {
    const { index } = (e as CustomEvent<{ index: number }>).detail;
    
    lastPoint = index;
})