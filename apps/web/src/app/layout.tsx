import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'PeerNova — Peer Tutoring Marketplace',
    template: '%s | PeerNova',
  },
  description:
    'Connect with expert peer tutors for personalized, affordable learning sessions. Book 1-on-1 video tutoring in any subject.',
  keywords: ['tutoring', 'peer tutoring', 'online learning', 'video tutoring', 'education'],
  authors: [{ name: 'PeerNova' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'PeerNova',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
