import Portfolio from "../schemas/portfolio_schema.js";
import Position from "../schemas/position_schema.js";
import redis from "../services/redisClient.js";


/**
 * Recalculate unrealized PnL + exposure for one position
 */
export function computePositionMetrics(position) {
    const priceDiff =
        position.side === "LONG"
            ? position.currentPrice - position.avgEntryPrice
            : position.avgEntryPrice - position.currentPrice;

    position.unrealizedPnL = priceDiff * position.quantity;
    position.exposure = Math.abs(position.currentPrice * position.quantity);

    return position;
}

/**
 * Recalculate entire portfolio metrics
 */

export async function recalcPortfolio(userId) {
    const positions = await Position.find({ userId });
    const portfolio = await getOrCreatePortfolio(userId);

    let totalUnrealizedPnL = 0;
    let totalExposure = 0;

    for (let pos of positions) {
        computePositionMetrics(pos);
        await pos.save();

        totalUnrealizedPnL += pos.unrealizedPnL;
        totalExposure += pos.exposure;
    }

    portfolio.unrealizedPnL = totalUnrealizedPnL;
    portfolio.exposure = totalExposure; // Ensure portfolio schema has exposure field or ignore if not needed
    portfolio.equity = portfolio.balance + totalUnrealizedPnL;
    await portfolio.save();

    return {
        totalUnrealizedPnL,
        totalExposure,
        equity: portfolio.equity
    };
}


export async function getOrCreatePortfolio(userId) {
    let portfolio = await Portfolio.findOne({ userId });

    if (!portfolio) {
        portfolio = await Portfolio.create({ userId });
    }

    return portfolio;
}

export async function getPortfolioState(userId) {
    const portfolio = await getOrCreatePortfolio(userId);

    return {
        userId: portfolio.userId,
        balance: portfolio.balance,
        marginUsed: portfolio.marginUsed,
        unrealizedPnL: portfolio.unrealizedPnL,
        equity: portfolio.equity
    };
}

/**
 * Sync portfolio with latest market prices from Redis
 * Updates positions and portfolio with live market data
 */

export async function syncPortfolioWithMarket(userId) {
    const portfolio = await getOrCreatePortfolio(userId);
    const positions = await Position.find({ userId });

    if (positions.length === 0) {
        portfolio.unrealizedPnL = 0;
        portfolio.equity = portfolio.balance;
        await portfolio.save();

        return {
            equity: portfolio.equity,
            unrealizedPnL: 0,
            totalExposure: 0
        };
    }

    let totalUnrealizedPnL = 0;
    let totalExposure = 0;

    for (let pos of positions) {
        const redisKey = `live_price:${pos.symbol}`;
        const priceStr = await redis.get(redisKey);

        if (priceStr) {
            pos.currentPrice = Number(priceStr);
        }

        computePositionMetrics(pos);
        await pos.save();

        totalUnrealizedPnL += pos.unrealizedPnL;
        totalExposure += pos.exposure;
    }


    portfolio.unrealizedPnL = totalUnrealizedPnL;
    portfolio.equity = portfolio.balance + totalUnrealizedPnL;
    await portfolio.save();

    // Cache updated positions to Redis
    const allPositions = await Position.find({ userId });
    await redis.set(`positions:${userId}`, JSON.stringify(allPositions));

    return {
        equity: portfolio.equity,
        unrealizedPnL: totalUnrealizedPnL,
        totalExposure
    };

}
