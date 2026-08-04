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
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 py-8">
      <SignUpForm />
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary hover:underline underline-offset-4 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
