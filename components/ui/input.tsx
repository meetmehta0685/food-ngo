import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "bg-card border-input hover:border-foreground/40 focus-visible:border-ring focus-visible:ring-ring/25 aria-invalid:ring-destructive/20 aria-invalid:border-destructive h-11 rounded-md border px-3 py-1 text-base transition-colors file:h-8 file:text-sm/relaxed file:font-medium focus-visible:ring-2 aria-invalid:ring-2 sm:h-10 sm:file:h-8 sm:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
