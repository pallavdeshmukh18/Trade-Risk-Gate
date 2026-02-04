import { z } from "zod";

export const TradeRequestSchema = z.object({
  symbol: z.string(),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().positive(),
  order_type: z.enum(["MARKET", "LIMIT"]),
  price: z.number().optional(),
  strategy_id: z.string().nullable(),
  timestamp: z.string().datetime()
});
