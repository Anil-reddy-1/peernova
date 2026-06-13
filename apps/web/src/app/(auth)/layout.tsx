import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your PeerNova account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-accent-400/10 rounded-full blur-2xl animate-pulse-soft" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-2">PeerNova</h1>
            <div className="w-16 h-1 bg-accent-400 rounded-full" />
          </div>
          <p className="text-2xl font-light leading-relaxed mb-6 text-white/90">
            Learn from the best.<br />
            Teach what you love.
          </p>
          <p className="text-lg text-white/70 max-w-md">
            Connect with expert peer tutors for personalized, 1-on-1 video tutoring sessions in any subject.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-50 dark:bg-surface-950">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
