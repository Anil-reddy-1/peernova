import Link from 'next/link';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 glass-card border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold gradient-text">PeerNova</Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/about" className="text-sm font-medium text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white transition-colors">About</Link>
            <Link href="/pricing" className="text-sm font-medium text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white transition-colors">Pricing</Link>
            <Link href="/contact" className="text-sm font-medium text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white transition-colors">Contact</Link>
            <Link href="/login" className="text-sm font-medium text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="px-5 py-2 rounded-lg text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity shadow-glow-primary">Get Started</Link>
          </div>
        </div>
      </nav>
      {children}
      <footer className="border-t border-surface-200 dark:border-surface-800 py-12 bg-surface-50 dark:bg-surface-950">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold gradient-text mb-4">PeerNova</div>
            <p className="text-surface-500 max-w-sm">The world's leading peer-to-peer tutoring marketplace. Learn smarter, not harder.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-surface-500">
              <li><Link href="/about" className="hover:text-primary-500">About Us</Link></li>
              <li><Link href="/pricing" className="hover:text-primary-500">Pricing</Link></li>
              <li><Link href="/contact" className="hover:text-primary-500">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-surface-500">
              <li><Link href="/terms" className="hover:text-primary-500">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary-500">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 text-sm text-surface-400">
          © {new Date().getFullYear()} PeerNova. All rights reserved.
        </div>
      </footer>
    </>
  );
}
