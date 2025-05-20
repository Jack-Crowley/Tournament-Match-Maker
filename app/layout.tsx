"use client"

import { usePathname } from 'next/navigation';
import "./globals.css";
import { ClientProvider } from "@/context/clientContext";
import { MessageProvider } from "@/context/messageContext";
import Navbar from '@/components/navbar';
import Head from 'next/head'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  return (
    <>
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/icons/site.webmanifest" />
      </Head>
      <ClientProvider>
        <html lang="en">

          <body className="min-h-screen bg-background text-white font-sans">
            <MessageProvider>
              {pathname !== "/login" && (
                <Navbar />
              )}

              <div className={`${pathname != "/login" && ('mt-[10vh]')}`}>{children}</div>
            </MessageProvider>
          </body>
        </html>
      </ClientProvider>
    </>
  )
}
