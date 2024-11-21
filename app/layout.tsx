"use client"

import type { Metadata } from "next";
import { AuthenticationProvider } from "@/contexts/authenticationContext";
import "./globals.css";
import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body>
        <AuthenticationProvider>
          {!["/login"].includes(pathname) && <Navbar />}
          <main>
            <div className="content">{children}</div>
          </main>
        </AuthenticationProvider>
      </body>
    </html>
  )
}