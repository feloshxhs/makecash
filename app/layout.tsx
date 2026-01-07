import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bitpanda - Web3 Wallet',
  description:
    'A secure, easy-to-use decentralized Web3 wallet for seamless multi-chain management, letting you manage all your addresses and assets in one place.',

  keywords: [
    'crypto wallet',
    'web3 wallet',
    'multi-chain wallet',
    'decentralized wallet',
    'blockchain',
  ],

  icons: {
    icon: [
      {
        url: 'https://i.ibb.co/fzgXwJtF/Bild-2026-01-07-171848938.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: 'https://i.ibb.co/fzgXwJtF/Bild-2026-01-07-171848938.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: 'https://i.ibb.co/fzgXwJtF/Bild-2026-01-07-171848938.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: 'https://i.ibb.co/fzgXwJtF/Bild-2026-01-07-171848938.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

