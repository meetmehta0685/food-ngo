import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { SignUpForm } from "@/components/auth/sign-up-form"
import { authOptions } from "@/lib/auth/options"

export default async function SignUpPage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role === "DONOR") {
    redirect("/donor/requests")
  }

  if (session?.user?.role === "NGO") {
    redirect("/ngo/inbox")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8">
      <SignUpForm />
      <p className="text-muted-foreground text-center text-sm mt-6">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary hover:underline underline-offset-4 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
