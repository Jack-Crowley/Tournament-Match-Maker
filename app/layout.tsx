"use client"

import { usePathname } from 'next/navigation';
import "./globals.css";
import { ClientProvider } from "@/context/clientContext";
import { MessageProvider } from "@/context/messageContext";
import Navbar from '@/components/navbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  return (
    <ClientProvider>
      <html lang="en">
        <body className="min-h-screen bg-background text-white font-sans">
          <MessageProvider>
            {pathname != "/login" && (
              <Navbar/>
            )}

            <div className="">{children}</div>
          </MessageProvider>
        </body>
      </html>
    </ClientProvider>
  )
}
