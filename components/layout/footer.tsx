import Link from "next/link"

import { KolamMark } from "@/components/kolam/kolam-mark"

export function Footer() {
  return (
    <footer className="bg-threshold text-threshold-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <KolamMark className="size-10" />
          <p className="font-display text-2xl font-semibold leading-none">Food Rescue Network</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold" aria-label="Footer navigation">
          <Link href="/home#how-it-works" className="text-threshold-muted hover:text-threshold-foreground rounded-sm transition-colors">
            How it works
          </Link>
          <Link href="/home#persona-donors" className="text-threshold-muted hover:text-threshold-foreground rounded-sm transition-colors">
            For donors
          </Link>
          <Link href="/home#persona-ngos" className="text-threshold-muted hover:text-threshold-foreground rounded-sm transition-colors">
            NGO partners
          </Link>
          <span className="text-threshold-muted tabular">© {new Date().getFullYear()}</span>
        </nav>
      </div>
    </footer>
  )
}
