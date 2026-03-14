import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { SignInForm } from "@/components/auth/sign-in-form"
import { authOptions } from "@/lib/auth/options"

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role === "DONOR") {
    redirect("/donor/requests")
  }

  if (session?.user?.role === "NGO") {
    redirect("/ngo/inbox")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8">
      <SignInForm />
      <p className="text-muted-foreground text-center text-sm mt-6">
        New here?{" "}
        <Link href="/sign-up" className="text-primary hover:underline underline-offset-4 font-medium">
          Create an account
        </Link>
      </p>
    </div>
  )
}
