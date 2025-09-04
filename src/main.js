import * as PIXI from 'pixi.js';
import { Reel } from './Reel.js';
import { playRound } from './api.js';

async function boot() {
    const app = new PIXI.Application({
        background: '#0b0d14',
        width: 900,
        height: 600,
        antialias: true
    });
    document.getElementById('app').appendChild(app.view);

    // --- textures & reels setup ---
    const TEX = {
        "1": "/symbols/1.png",
        "2": "/symbols/2.png",
        "5": "/symbols/5.png",
        "10": "/symbols/10.png",
        "0": "/symbols/0.png",
        "00": "/symbols/00.png",
        "X": "/symbols/x.png"
    };
    await PIXI.Assets.load(Object.values(TEX));

    const R0 = ["1", "2", "5", "10", "X"];
    const R1 = ["0", "5", "X"];
    const R2 = ["0", "5", "00", "X"];

    const REEL_W = 200, SYM_H = 200, WIN_H = 200;
    const gap = 20;
    const totalW = REEL_W * 3 + gap * 2;
    const startX = (app.renderer.width - totalW) / 2;
    const startY = (app.renderer.height - WIN_H) / 2;

    const reel0 = new Reel({
        x: startX + 0 * (REEL_W + gap),
        y: startY,
        width: REEL_W,
        windowHeight: WIN_H,
        symbolHeight: SYM_H,
        symbols: R0,
        textures: TEX
    });
    const reel1 = new Reel({
        x: startX + 1 * (REEL_W + gap),
        y: startY,
        width: REEL_W,
        windowHeight: WIN_H,
        symbolHeight: SYM_H,
        symbols: R1,
        textures: TEX
    });
    const reel2 = new Reel({
        x: startX + 2 * (REEL_W + gap),
        y: startY,
        width: REEL_W,
        windowHeight: WIN_H,
        symbolHeight: SYM_H,
        symbols: R2,
        textures: TEX
    });

    app.stage.addChild(reel0.container, reel1.container, reel2.container);

    // optional blur during spin only
    const blur = new PIXI.filters.BlurFilter();
    blur.blurY = 2;
    blur.quality = 2;

    // ticker
    let last = performance.now();
    app.ticker.add(() => {
        const now = performance.now();
        const dt = (now - last) / 1000;
        last = now;
        reel0.update(dt);
        reel1.update(dt);
        reel2.update(dt);
    });

    // symbol -> index maps
    const idx0 = Object.fromEntries(R0.map((s, i) => [s, i]));
    const idx1 = Object.fromEntries(R1.map((s, i) => [s, i]));
    const idx2 = Object.fromEntries(R2.map((s, i) => [s, i]));

    // helpers
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    async function spin() {
        [reel0, reel1, reel2].forEach(r => {
            r.scrollY += Math.random() * r.totalHeight;              // phase randomization
            r.startSpin(2200 + Math.random() * 400);                  // px/sec
            r.container.filters = [blur];
        });

        // fetch server result
        const { reels, payoutMultiplier } = await playRound();

        // staggered settles (always forward)
        await sleep(120 + Math.random() * 80);
        await reel0.settleToIndex(idx0[reels[0]], { durationMs: 650 });

        await sleep(180 + Math.random() * 100);
        await reel1.settleToIndex(idx1[reels[1]], { durationMs: 680 });

        await sleep(180 + Math.random() * 100);
        await reel2.settleToIndex(idx2[reels[2]], { durationMs: 720 });

        [reel0, reel1, reel2].forEach(r => (r.container.filters = null));

        if (payoutMultiplier > 0) {
            console.log('WIN x', payoutMultiplier);
            // TODO: trigger win FX/SFX here
        }
    }

    // click/tap to spin
    app.view.addEventListener('pointerdown', spin);
    console.log('Click the canvas to spin.');
}

boot(); // no top-level await
