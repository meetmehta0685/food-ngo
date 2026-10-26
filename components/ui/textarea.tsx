import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-card hover:border-foreground/40 focus-visible:border-ring focus-visible:ring-ring/25 aria-invalid:ring-destructive/20 aria-invalid:border-destructive resize-none rounded-md border px-3 py-2.5 text-base transition-colors focus-visible:ring-2 aria-invalid:ring-2 sm:text-sm/relaxed placeholder:text-muted-foreground flex field-sizing-content min-h-24 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
