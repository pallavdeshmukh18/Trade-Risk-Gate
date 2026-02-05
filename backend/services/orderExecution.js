
import Order from "../schemas/order_schema.js";
import Position from "../schemas/position_schema.js";
import Portfolio from "../schemas/portfolio_schema.js";
import Trade from "../schemas/trade_schema.js";
import redis from "../services/redisClient.js"; 
import { getOrCreatePortfolio } from "./portfolioEngine.js";


export async function executeOrder(orderData) {
    const { userId, symbol, atp, side, quantity } = orderData;
    const price = Number(atp);
    const qty = Number(quantity);
    
    const portfolio = await getOrCreatePortfolio(userId);
    
    const cost = price * qty;
    if (portfolio.balance < cost && side === "BUY") { // Very basic check
         throw new Error("Insufficient balance"); 
    }

    const order = await Order.create({
        userId,
        symbol,
        atp: price,
        side,
        quantity: qty,
        status: "EXECUTED"
    });

    let position = await Position.findOne({ userId, symbol });
    
    let currentSignedQty = 0;
    let avgPrice = 0;
    
    if (position) {
        currentSignedQty = position.side === "LONG" ? position.quantity : -position.quantity;
        avgPrice = position.avgEntryPrice;
    }

    const orderSignedQty = side === "BUY" ? qty : -qty;
    const newSignedQty = currentSignedQty + orderSignedQty;
    
    
    const isSameSide = (currentSignedQty >= 0 && orderSignedQty >= 0) || (currentSignedQty <= 0 && orderSignedQty <= 0);
    
    if (currentSignedQty === 0 || (isSameSide)) {
        const totalQty = Math.abs(newSignedQty);
        const oldQty = Math.abs(currentSignedQty);
        
        let newAvgPrice = price; 
        if (oldQty > 0) {
            newAvgPrice = ((oldQty * avgPrice) + (qty * price)) / totalQty;
        }
        
        if (!position) {
            position = new Position({
                userId,
                symbol,
                quantity: totalQty,
                avgEntryPrice: newAvgPrice,
                currentPrice: price,
                side: newSignedQty >= 0 ? "LONG" : "SHORT"
            });
        } else {
            position.quantity = totalQty;
            position.avgEntryPrice = newAvgPrice;
            position.currentPrice = price;
            position.side = newSignedQty >= 0 ? "LONG" : "SHORT";
        }
        
        portfolio.balance -= cost; 

    } else {
        const qtyClosed = Math.min(Math.abs(currentSignedQty), Math.abs(orderSignedQty));
        
        const pnlPerShare = (position.side === "LONG") 
            ? (price - position.avgEntryPrice) 
            : (position.avgEntryPrice - price);
            
        const realizedPnL = pnlPerShare * qtyClosed;
        
        // 2. Record Trade
        await Trade.create({
            userId,
            symbol,
            quantity: qtyClosed,
            entryPrice: position.avgEntryPrice,
            exitPrice: price,
            side: position.side, 
            realizedPnL
        });
        
        const returnedCapital = (position.avgEntryPrice * qtyClosed) + realizedPnL;
        
        if (side === "BUY") {
            portfolio.balance -= (price * qty);
        } else {
            portfolio.balance += (price * qty); 
        }
        
        portfolio.realizedPnL = (portfolio.realizedPnL || 0) + realizedPnL;

        const remainingQty = Math.abs(newSignedQty);
        
        if (remainingQty === 0) {
            await Position.deleteOne({ _id: position._id });
            position = null;
        } else {
            position.quantity = remainingQty;
            position.currentPrice = price;
            
            if ((newSignedQty > 0 && position.side === "SHORT") || (newSignedQty < 0 && position.side === "LONG")) {
                position.side = newSignedQty > 0 ? "LONG" : "SHORT";
                position.avgEntryPrice = price;
            }
        }
    }

    if (position) await position.save();
    await portfolio.save();

    const allPositions = await Position.find({ userId });
    await redis.set(`positions:${userId}`, JSON.stringify(allPositions));
    
    const recentTrades = await Trade.find({ userId }).sort({ createdAt: -1 }).limit(50);
    await redis.set(`trades:${userId}`, JSON.stringify(recentTrades));

    return { 
        success: true, 
        position: position, 
        balance: portfolio.balance,
        orderId: order._id
    };
}
