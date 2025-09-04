// Replace this with your real call to StakeEngine RGS
export async function playRound() {
    // DEMO: fake server result
    const reels = [
        ["1", "2", "5", "10", "X"][Math.floor(Math.random() * 5)],
        ["0", "5", "X"][Math.floor(Math.random() * 3)],
        ["0", "5", "00", "X"][Math.floor(Math.random() * 4)]
    ];
    const payoutMultiplier = 0; // compute based on your rules
    await new Promise(r => setTimeout(r, 300)); // simulate latency
    return { reels, payoutMultiplier };
}
