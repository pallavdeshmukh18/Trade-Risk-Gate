import { z } from "zod";

export const MarketSnapshotSchema = z.object({
  symbol: z.string(),
  ltp: z.number().nullable(),
  bid: z.number().nullable(),
  ask: z.number().nullable(),
  volume: z.number().nullable(),
  timestamp: z.string(),
  source: z.string(),
});
