import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Background Remover - Remove Image Backgrounds Online for Free',
  description: 'Remove image backgrounds 100% automatically in seconds. Free online tool, no software required.',
  openGraph: {
    title: 'Background Remover - Free Online Tool',
    description: 'Remove image backgrounds automatically in seconds.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer id="google-gsi"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
