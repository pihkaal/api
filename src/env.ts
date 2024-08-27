import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  VOLTFM_USERNAME: z.string(),
  REDIS_HOST: z.string().default("redis"),
  REDIS_PORT: z.coerce.number().default(6379),
});

export type Env = z.infer<typeof envSchema>;
