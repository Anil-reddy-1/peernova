export default function TermsPage() {
  return (
    <main className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>
        
        <div className="glass-card rounded-2xl p-8 space-y-6 text-surface-600 dark:text-surface-400">
          <p className="text-sm">Last updated: June 2026</p>
          
          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using PeerNova, you accept and agree to be bound by the terms and provision of this agreement. 
            In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
          </p>

          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mt-8 mb-4">2. Description of Service</h2>
          <p>
            PeerNova provides a platform that connects students with peer tutors for educational purposes. 
            We do not provide tutoring services directly, nor do we employ the tutors. We act solely as a marketplace and facilitator.
          </p>

          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mt-8 mb-4">3. User Conduct</h2>
          <p>
            Users agree to use the service for lawful educational purposes only. Harassment, cheating, plagiarism, 
            or any form of academic dishonesty is strictly prohibited and will result in immediate account termination.
          </p>

          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mt-8 mb-4">4. Payments and Refunds</h2>
          <p>
            All payments are processed securely. Tutors set their own rates. Refunds may be requested within 24 hours 
            of a completed session if the tutor failed to show up or violated our community guidelines.
          </p>
        </div>
      </div>
    </main>
  );
}
