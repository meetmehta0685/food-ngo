import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { getServerSession } from "next-auth";

import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { authOptions } from "@/lib/auth/options";

import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Food Rescue Network | Surplus Redistribution & Meal Security",
  description:
    "Realtime food rescue platform connecting corporate event donors, caterers, and households with nearby verified NGOs and shelters.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="scroll-smooth">
      <body
        data-direction-seed="e862e26e"
        className={`${jakartaSans.variable} ${jetbrainsMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        {/*
          THESIS: Rescue work is a clear handoff, not a catalogue of claims; the landing page makes the next useful action obvious.
          OWN-WORLD: Light paper surfaces, grounded ink, marigold actions, and Phosphor controls keep the product calm and direct.
          STORY: Donors report surplus, nearby partners take ownership, and volunteers confirm the final handover.
          FIRST VIEWPORT: A focused hero pairs the rescue promise and primary action with real delivery imagery, followed by the three-step handoff.
          FORM: Refined operational landing surface, seed e862e26e.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
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
  );
}
