import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1).default("other"),
  notes: z.string().max(240).optional().nullable()
});

export const upsertDailyPlanSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0)
});
