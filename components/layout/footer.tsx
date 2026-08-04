import Link from "next/link"

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pb-8 pt-16 sm:px-6">
      <div className="flex flex-col gap-4 border-t py-6 text-xs sm:flex-row sm:items-center">
        <p className="font-semibold text-foreground">Food Rescue Network</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-medium" aria-label="Footer navigation">
          <Link href="/home#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link href="/home#persona-donors" className="text-muted-foreground hover:text-foreground transition-colors">
            For donors
          </Link>
          <Link href="/home#persona-ngos" className="text-muted-foreground hover:text-foreground transition-colors">
            NGO partners
          </Link>
        </nav>
        <p className="text-muted-foreground sm:ml-auto">© {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
