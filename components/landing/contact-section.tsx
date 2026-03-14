"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PaperPlaneTilt } from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { contactInquirySchema, type ContactInquiryInput } from "@/lib/validations/contact"

const defaultValues: ContactInquiryInput = {
  name: "",
  email: "",
  organization: "",
  topic: "General inquiry",
  message: "",
}

export function ContactSection() {
  const form = useForm<ContactInquiryInput>({
    resolver: zodResolver(contactInquirySchema),
    defaultValues,
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null

      toast.error(payload?.error?.message ?? "Could not send message right now")
      return
    }

    form.reset(defaultValues)
    toast.success("Message received", {
      description: "Our team will review your request and get back to you.",
    })
  })

  return (
    <Card className="border-border/50 bg-card/90">
      <CardHeader>
        <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">Get in touch</p>
        <CardTitle className="font-serif text-xl">Contact Us</CardTitle>
        <CardDescription>
          Reach us for NGO onboarding, donor support, partnerships, or technical issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input id="contact-name" placeholder="Your full name" {...form.register("name")} />
              <FieldError errors={[form.formState.errors.name]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" placeholder="you@example.com" {...form.register("email")} />
              <FieldError errors={[form.formState.errors.email]} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-org">Organization (optional)</Label>
              <Input id="contact-org" placeholder="NGO / Company / Community" {...form.register("organization")} />
              <FieldError errors={[form.formState.errors.organization]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-topic">Topic</Label>
              <Input id="contact-topic" placeholder="Partnership, NGO onboarding, support..." {...form.register("topic")} />
              <FieldError errors={[form.formState.errors.topic]} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              rows={5}
              placeholder="Share details about your request."
              {...form.register("message")}
            />
            <FieldError errors={[form.formState.errors.message]} />
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
            {form.formState.isSubmitting ? "Sending..." : (
              <>
                Send message
                <PaperPlaneTilt className="ml-2 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
