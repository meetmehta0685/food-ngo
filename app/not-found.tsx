import Link from "next/link"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"

import { KolamMark } from "@/components/kolam/kolam-mark"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="kolam-sheet -mx-4 -mt-8 flex min-h-[70vh] items-center px-4 py-16 sm:-mx-8 sm:-mt-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6">
        <KolamMark className="size-14" />
        <h1 className="text-4xl sm:text-6xl">That rescue route is no longer available.</h1>
        <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">The link may be outdated, or you may not have access to this handoff.</p>
        <Button render={<Link href="/home" />} nativeButton={false} size="lg">
          <ArrowLeft data-icon="inline-start" />
          Return home
        </Button>
      </div>
    </div>
  )
}
