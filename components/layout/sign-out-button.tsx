"use client"

import { signOut } from "next-auth/react"
import { SignOut } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        void signOut({ callbackUrl: "/" })
      }}
    >
      <SignOut data-icon="inline-start" />
      Sign out
    </Button>
  )
}
