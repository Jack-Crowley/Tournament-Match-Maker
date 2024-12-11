import type { Metadata } from "next";
import "./globals.css";
import "./figma.css";

export const metadata: Metadata = {
  title: 'Plumbing Project',
  description: 'Store and display random numbers in real-time',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
