"use client"

import Link from "next/link"
import { ArrowClockwise, ArrowLeft, WarningCircle } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg border-destructive/25">
        <CardHeader className="gap-3">
          <span className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-lg">
            <WarningCircle weight="duotone" />
          </span>
          <CardTitle className="text-xl">This workspace needs a refresh</CardTitle>
          <CardDescription>We couldn’t load this rescue surface. Try again, or return to the network home.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => reset()}>
            <ArrowClockwise data-icon="inline-start" />
            Try again
          </Button>
          <Button render={<Link href="/home" />} nativeButton={false} variant="outline">
            <ArrowLeft data-icon="inline-start" />
            Return home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
