import { z } from "zod"

export const contactInquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.email("Enter a valid email address"),
  organization: z.string().trim().max(120).optional(),
  topic: z.string().trim().min(2, "Select a topic").max(80),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(1200),
})

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>
