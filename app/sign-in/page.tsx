import Link from "next/link"
import { getServerSession } from "next-auth"

import { SignInForm } from "@/components/auth/sign-in-form"
import { authOptions } from "@/lib/auth/options"

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="kolam-sheet -mx-4 -mt-8 flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center gap-6 px-4 py-12 sm:-mx-8 sm:-mt-12 sm:px-8">
      <SignInForm resetExistingSession={Boolean(session?.user)} />
      <p className="text-muted-foreground text-center text-base">
        New here?{" "}
        <Link href="/sign-up" className="text-primary font-semibold underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
          Create an account
        </Link>
      </p>
    </div>
  )
}
