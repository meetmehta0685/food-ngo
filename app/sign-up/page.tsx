import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { SignUpForm } from "@/components/auth/sign-up-form"
import { authOptions } from "@/lib/auth/options"
import { getRoleHomePath } from "@/lib/auth/roles"

export default async function SignUpPage() {
  const session = await getServerSession(authOptions)

  const destination = getRoleHomePath(session?.user?.role)

  if (destination) {
    redirect(destination)
  }

  return (
    <div className="kolam-sheet -mx-4 -mt-8 flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center gap-6 px-4 py-12 sm:-mx-8 sm:-mt-12 sm:px-8">
      <SignUpForm />
      <p className="text-muted-foreground text-center text-base">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary font-semibold underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
          Sign in
        </Link>
      </p>
    </div>
  )
}
