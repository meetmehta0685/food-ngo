import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { DonationForm } from "@/components/donor/donation-form"
import { authOptions } from "@/lib/auth/options"
import { getRoleHomePath } from "@/lib/auth/roles"

export default async function NewDonationPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  if (session.user.role !== "DONOR") {
    redirect(getRoleHomePath(session.user.role) ?? "/home")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Report available food</h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          Fill in the details once. Nearby NGOs are notified automatically.
        </p>
      </div>
      <DonationForm />
    </div>
  )
}
