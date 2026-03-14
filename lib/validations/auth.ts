import { z } from "zod"

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["DONOR", "NGO"]),
    ngoProfile: z
      .object({
        orgName: z.string().trim().min(2),
        phone: z.string().trim().min(8),
        address: z.string().trim().min(6),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        serviceRadiusKm: z.number().min(1).max(100).default(15),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "NGO" && !data.ngoProfile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ngoProfile"],
        message: "NGO details are required for NGO accounts",
      })
    }
  })

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export type RegisterInput = z.infer<typeof registerSchema>
