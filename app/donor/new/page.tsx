import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { DonationForm } from "@/components/donor/donation-form"
import { authOptions } from "@/lib/auth/options"

export default async function NewDonationPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  if (session.user.role !== "DONOR") {
    redirect("/ngo/inbox")
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">New request</p>
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Report available food</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in the details once. Nearby NGOs are notified automatically.
        </p>
      </div>
      <DonationForm />
    </div>
  )
}
