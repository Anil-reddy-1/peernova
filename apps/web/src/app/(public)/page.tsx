import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
{/* ─── Hero Section ────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[128px] animate-float" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary-500/10 rounded-full blur-[128px] animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-up text-balance" style={{ animationDelay: '0.1s' }}>
            Find Your{' '}
            <span className="gradient-text">Perfect Tutor</span>
          </h1>

          <p className="text-xl md:text-2xl text-surface-500 max-w-2xl mx-auto mb-10 animate-fade-up text-balance" style={{ animationDelay: '0.2s' }}>
            Connect with expert peer tutors for personalized, 1-on-1 video sessions. Learn any subject, at your pace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/register" className="px-8 py-4 rounded-xl text-lg font-semibold text-white gradient-primary hover:opacity-90 transition-all shadow-glow-primary hover:shadow-lg">
              Start Learning Free →
            </Link>
            <Link href="/register?role=tutor" className="px-8 py-4 rounded-xl text-lg font-semibold text-surface-700 dark:text-surface-300 border-2 border-surface-200 dark:border-surface-700 hover:border-primary-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all">
              Become a Tutor
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why students love <span className="gradient-text">PeerNova</span></h2>
            <p className="text-lg text-surface-500 max-w-2xl mx-auto">Everything you need for a world-class learning experience</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎥', title: '1-on-1 Video', desc: 'Crystal-clear HD video sessions with screen sharing and whiteboard tools' },
              { icon: '🎓', title: 'Expert Tutors', desc: 'Verified tutors with proven track records and real student reviews' },
              { icon: '💰', title: 'Affordable', desc: 'Peer pricing that fits student budgets. Pay only for what you learn' },
              { icon: '📅', title: 'Flexible Schedule', desc: 'Book sessions that fit your timetable. Available 24/7 across timezones' },
            ].map((feature) => (
              <div key={feature.title} className="glass-card rounded-2xl p-8 hover-lift group">
                <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-surface-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-surface-50 dark:bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get started in <span className="gradient-text">3 simple steps</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Find a Tutor', desc: 'Browse expert tutors filtered by subject, rating, price, and availability.' },
              { step: '02', title: 'Book a Session', desc: 'Choose a time slot, make a secure payment, and get instant confirmation.' },
              { step: '03', title: 'Start Learning', desc: 'Join your HD video session, ask questions, and ace your goals.' },
            ].map((item) => (
              <div key={item.step} className="relative glass-card rounded-2xl p-8 hover-lift">
                <div className="text-5xl font-black text-primary-100 dark:text-primary-900/30 absolute top-4 right-6">{item.step}</div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-3 relative">{item.title}</h3>
                <p className="text-surface-500 relative">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-card rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-secondary-600/5" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your learning?</h2>
              <p className="text-lg text-surface-500 mb-8 max-w-lg mx-auto">Join thousands of students already learning smarter with PeerNova.</p>
              <Link href="/register" className="inline-flex px-8 py-4 rounded-xl text-lg font-semibold text-white gradient-primary hover:opacity-90 transition-all shadow-glow-primary">
                Get Started — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
