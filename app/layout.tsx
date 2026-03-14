import type { Metadata } from "next"
import { DM_Serif_Display, Instrument_Sans, JetBrains_Mono } from "next/font/google"
import { getServerSession } from "next-auth"

import { AppShell } from "@/components/layout/app-shell"
import { Providers } from "@/components/providers"
import { authOptions } from "@/lib/auth/options"

import "leaflet/dist/leaflet.css"
import "./globals.css"

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Food Rescue Network",
  description: "Realtime food rescue platform connecting donors and nearby NGOs.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${instrumentSans.variable} ${dmSerif.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>
          <AppShell
            user={
              session?.user
                ? {
                    id: session.user.id,
                    name: session.user.name,
                    role: session.user.role,
                  }
                : undefined
            }
          >
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  )
}
