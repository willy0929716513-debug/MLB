import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MLB AI Prediction Engine — Real-Time Sports Intelligence',
  description: 'Institutional-grade MLB analytics powered by Monte Carlo, XGBoost and market models. Edge-based picks with Kelly sizing.',
  openGraph: {
    title: 'MLB AI Prediction Engine',
    description: 'Real-Time Sports Intelligence Platform',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body style={{ fontFamily: 'var(--font-display), var(--font-body), sans-serif' }}>
        <div className="site-bg" aria-hidden />
        <div className="relative z-10 flex flex-col min-h-svh">
          <Header />
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
