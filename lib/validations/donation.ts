import { z } from "zod"

export const donationCreateSchema = z.object({
  foodType: z.string().trim().min(2).max(120),
  quantity: z.string().trim().min(1).max(120),
  servesCount: z
    .number({ message: "Serves count must be a number" })
    .int()
    .positive()
    .max(10000),
  address: z.string().trim().min(6).max(255),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  pickupBy: z
    .string()
    .min(1)
    .transform((value) => new Date(value))
    .refine((value) => !Number.isNaN(value.getTime()), {
      message: "pickupBy must be a valid date",
    }),
  notes: z.string().trim().max(600).optional(),
})

export const donationStatusSchema = z.object({
  nextStatus: z.enum([
    "PICKUP_IN_PROGRESS",
    "PICKED_UP",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().trim().max(600).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
})

export type DonationCreateInput = z.infer<typeof donationCreateSchema>
export type DonationStatusInput = z.infer<typeof donationStatusSchema>
