import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BikeReady — Cycle safely in the Netherlands',
  description: 'A short preparation course for expats learning to cycle safely in Dutch cities.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
