import type { Metadata } from 'next'
import React from 'react'
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '../src/components/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HowAIConnects Webapp Admin',
  description: 'Admin dashboard for HowAIConnects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}