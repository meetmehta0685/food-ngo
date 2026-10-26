import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8" aria-label="Loading workspace">
      <div className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <Skeleton className="min-h-80 rounded-lg" />
        <Skeleton className="min-h-64 rounded-lg" />
      </div>
    </div>
  )
}
