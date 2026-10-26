"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "focus-visible:ring-ring/40 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 aria-invalid:border-destructive rounded-md border border-transparent bg-clip-padding text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 aria-invalid:ring-2 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,transform] duration-200 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/88",
        outline: "border-foreground/70 text-foreground hover:bg-foreground hover:text-background aria-expanded:bg-foreground aria-expanded:text-background",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: "border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive/30",
        link: "text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary",
      },
      size: {
        default: "h-11 gap-2 px-4 sm:h-10 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 rounded-sm px-2.5 text-xs sm:h-7 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-1.5 px-3 sm:h-9 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 text-base sm:h-12 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-11 sm:size-10",
        "icon-xs": "size-8 rounded-sm sm:size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10 sm:size-9 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
