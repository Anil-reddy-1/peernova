import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-bold mb-8">About <span className="gradient-text">PeerNova</span></h1>
        
        <div className="glass-card rounded-2xl p-8 space-y-6 text-surface-600 dark:text-surface-400 leading-relaxed text-lg">
          <p>
            PeerNova was founded with a simple belief: the best way to learn is from someone who has recently mastered the material. Traditional tutoring can be expensive and inaccessible, while self-study can be isolating. We bridge that gap.
          </p>
          <p>
            Our platform connects students seeking help with top-performing peers who have excelled in those exact subjects. This peer-to-peer approach not only makes high-quality tutoring more affordable but also creates a more relatable and effective learning environment.
          </p>
          <p>
            Whether you are struggling with organic chemistry, looking for coding mentorship, or preparing for standardized tests, PeerNova is here to help you achieve your academic goals.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Link href="/register" className="inline-flex px-8 py-4 rounded-xl text-lg font-semibold text-white gradient-primary hover:opacity-90 transition-all shadow-glow-primary">
            Join Our Community
          </Link>
        </div>
      </div>
    </main>
  );
}
