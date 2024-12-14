"use client"

import type { Metadata } from "next";
import { usePathname } from 'next/navigation';
import "./globals.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body className="min-h-screen bg-base-dark-purple text-white font-sans">
        {pathname != "/login" && (
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
              <Link href={"/account"}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#7e67d2] hover:cursor-pointer">
                  <FontAwesomeIcon icon={faUser} className="text-white w-6 h-6" />
                </div>
              </Link>

            </div>
          </nav>
        )}

        <div className="">{children}</div>
      </body>
    </html>
  )
}
