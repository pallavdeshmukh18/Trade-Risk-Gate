const { updateMarket } = require("./marketEngine")

function genCandle(prev) {
    const change = (Math.random() - 0.5) * 50
    const close = prev + change
    return {
        time: Date.now(),
        open: prev,
        high: close + Math.random() * 10,
        low: close - Math.random() * 10,
        close,
        volume: Math.floor(Math.random() * 10000)
    }
}

let last = 19500

setInterval(async () => {
    const candles = []
    for (let i = 0; i < 30; i++) {
        const c = genCandle(last)
        last = c.close
        candles.push(c)
    }

    const r = await updateMarket("RELIANCE", candles)
    console.log("Updated market", r)
}, 5000)
