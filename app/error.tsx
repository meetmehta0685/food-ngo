"use client"

import Link from "next/link"
import { ArrowClockwise, ArrowLeft, WarningCircle } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="kolam-sheet -mx-4 -mt-8 flex min-h-[70vh] items-center px-4 py-16 sm:-mx-8 sm:-mt-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6">
        <WarningCircle className="text-destructive size-12" weight="bold" />
        <h1 className="text-4xl sm:text-6xl">This workspace needs a refresh</h1>
        <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">We couldn’t load this rescue surface. Try again, or return to the network home.</p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" size="lg" onClick={() => reset()}>
            <ArrowClockwise data-icon="inline-start" />
            Try again
          </Button>
          <Button render={<Link href="/home" />} nativeButton={false} variant="outline" size="lg">
            <ArrowLeft data-icon="inline-start" />
            Return home
          </Button>
        </div>
      </div>
    </div>
  )
}
