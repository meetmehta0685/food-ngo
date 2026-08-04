import Link from "next/link"
import { getServerSession } from "next-auth"

import { SignInForm } from "@/components/auth/sign-in-form"
import { authOptions } from "@/lib/auth/options"

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 py-8">
      <SignInForm resetExistingSession={Boolean(session?.user)} />
      <p className="text-muted-foreground text-center text-sm">
        New here?{" "}
        <Link href="/sign-up" className="text-primary hover:underline underline-offset-4 font-medium">
          Create an account
        </Link>
      </p>
    </div>
  )
}
