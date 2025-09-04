import * as PIXI from 'pixi.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

export class Reel {
    constructor({ x, y, width, windowHeight, symbolHeight, symbols, textures, duplicates = 3 }) {
        this.symbols = symbols.slice();
        this.W = width;
        this.H = windowHeight;
        this.SYMH = symbolHeight;

        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;

        const mask = new PIXI.Graphics().beginFill(0xffffff).drawRect(0, 0, this.W, this.H).endFill();
        this.container.addChild(mask);
        this.container.mask = mask;

        this.strip = new PIXI.Container();
        this.container.addChild(this.strip);

        for (let d = 0; d < duplicates; d++) {
            for (let i = 0; i < symbols.length; i++) {
                const sp = PIXI.Sprite.from(textures[symbols[i]]);
                sp.x = 0;
                sp.y = (d * symbols.length + i) * this.SYMH;
                sp.width = this.W;
                sp.height = this.SYMH;
                this.strip.addChild(sp);
            }
        }

        this.totalRows = symbols.length * duplicates;
        this.totalHeight = this.totalRows * this.SYMH;

        this.scrollY = 0;
        this.speed = 0;
        this.spinning = false;
        this._settle = null;
    }

    startSpin(pxPerSec = 2200) {
        this.spinning = true;
        this.speed = pxPerSec;
    }

    async settleToIndex(targetIndex, { cyclesMin = 2, cyclesMax = 4, durationMs = 650 } = {}) {
        const cycles = cyclesMin + Math.random() * (cyclesMax - cyclesMin);
        const baseRow = targetIndex;
        const curRowFloat = (this.scrollY / this.SYMH) % this.totalRows;
        const curRow = curRowFloat < 0 ? curRowFloat + this.totalRows : curRowFloat;

        let finalRow = Math.floor(cycles) * this.symbols.length + baseRow;
        while (finalRow <= curRow) finalRow += this.symbols.length;

        const startY = this.scrollY;
        const endY = finalRow * this.SYMH;
        const overshoot = 4 + Math.random() * 8;
        const endOver = endY + overshoot;

        const startTime = performance.now();
        const D = durationMs * (0.9 + Math.random() * 0.2);

        return new Promise(resolve => {
            this._settle = (now) => {
                const t = clamp((now - startTime) / D, 0, 1);
                const e = easeOutCubic(t);
                this.scrollY = lerp(startY, endOver, e);
                if (t >= 1) {
                    this.scrollY = endY;
                    this.spinning = false;
                    this.speed = 0;
                    this._settle = null;
                    resolve();
                }
            };
        });
    }

    update(dt) {
        if (this.spinning) this.scrollY += this.speed * dt;
        if (this._settle) this._settle(performance.now());
        const y = -((this.scrollY % this.totalHeight) + this.totalHeight) % this.totalHeight;
        this.strip.y = y;
    }
}
