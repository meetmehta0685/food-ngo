import type { Metadata } from "next";
import { Eczar, Mukta } from "next/font/google";
import { getServerSession } from "next-auth";

import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { authOptions } from "@/lib/auth/options";

import "./globals.css";

const mukta = Mukta({
  variable: "--font-sans-family",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

const eczar = Eczar({
  variable: "--font-display-family",
  subsets: ["latin", "devanagari"],
  weight: ["500", "600", "700", "800"],
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
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${mukta.variable} ${eczar.variable} min-h-screen bg-background text-foreground antialiased`}
      >
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
