import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitPro - Seu Personal Trainer Digital',
  description: 'App completo de dieta e treino com design premium e UX impecável',
  manifest: '/manifest.json',
  themeColor: '#F97316',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FitPro'
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body 
        className="inter bg-[#0B0F14] text-[#E6EBF2] overflow-x-hidden"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  )
}
