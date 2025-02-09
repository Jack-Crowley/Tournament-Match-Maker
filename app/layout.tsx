"use client"

import { usePathname } from 'next/navigation';
import "./globals.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import Link from "next/link";
import { ClientProvider } from "@/context/clientContext";
import { MessageProvider } from "@/context/messageContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  return (
    <ClientProvider>
      <html lang="en">
        <body className="min-h-screen bg-base-dark-purple text-white font-sans">
          <MessageProvider>
            {pathname != "/login" && (
              <nav className="pl-8 pr-8 pb-4 pt-10 flex items-center z-20">
                <div className="w-48">
                  <Link href="/" className="text-3xl">TMM</Link>
                </div>

                <div className="flex-1 flex justify-center">
                  <div className="flex space-x-8">
                    <Link href="/teams" className="hover:underline text-2xl font-bold">Teams</Link>
                    <Link href="/tournaments" className="hover:underline text-2xl font-bold">Tournaments</Link>
                    <Link href="/organizations" className="hover:underline text-2xl font-bold">Organizations</Link>
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
          </MessageProvider>
        </body>
      </html>
    </ClientProvider>
  )
}
