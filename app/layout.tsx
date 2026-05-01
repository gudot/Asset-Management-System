import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'First Pack Asset Management System',
  description: 'Headquarters asset management, tracking and register system for First Pack Company Zimbabwe - manage assets across all branches with full audit trail',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/fpIcon.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/fpIcon.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
