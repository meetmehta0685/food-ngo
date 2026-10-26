import { cn } from "@/lib/utils"

export function KolamMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-8 shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g className="fill-current">
        <circle cx="8" cy="20" r="3.2" />
        <circle cx="20" cy="20" r="2.2" opacity="0.55" />
        <circle cx="32" cy="20" r="3.2" />
        <circle cx="14" cy="10" r="1.6" opacity="0.45" />
        <circle cx="26" cy="30" r="1.6" opacity="0.45" />
      </g>
      <path
        d="M8 20 C 9 6, 19 4, 20 12 C 21 20, 19 20, 20 28 C 21 36, 31 34, 32 20"
        fill="none"
        className="stroke-primary"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
