import { z } from "zod"

export const matchResponseSchema = z.object({
  decision: z.enum(["ACCEPT", "DECLINE"]),
})

export type MatchResponseInput = z.infer<typeof matchResponseSchema>
