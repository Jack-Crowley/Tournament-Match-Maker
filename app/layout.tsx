import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen bg-base-dark-purple text-white font-sans">
        <nav className="pl-8 pr-8 pb-4 pt-10 flex items-center z-20">
          <div className="w-48">
            <a href="/" className="text-3xl">TMM</a>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="flex space-x-8">
              <a href="/teams" className="hover:underline text-2xl font-bold">Teams</a>
              <a href="/tournaments" className="hover:underline text-2xl font-bold">Tournaments</a>
              <a href="/organizations" className="hover:underline text-2xl font-bold">Organizations</a>
            </div>
          </div>

          <div className="w-48 flex justify-end">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
          </div>
        </nav>
        <div className="">{children}</div>
      </body>
    </html>
  )
}
