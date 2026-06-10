import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Student',
      price: 'Free',
      description: 'Find tutors and book sessions pay-as-you-go.',
      features: ['Access to all tutors', 'Secure payments', 'Real-time chat', 'HD Video Sessions', 'Session recordings'],
      cta: 'Sign Up as Student',
      href: '/register',
    },
    {
      name: 'Tutor',
      price: '10%',
      description: 'Platform fee per successful session.',
      features: ['Profile listing', 'Availability calendar', 'Automated payouts', 'Student reviews', 'Analytics dashboard'],
      cta: 'Become a Tutor',
      href: '/register?role=tutor',
      highlight: true,
    }
  ];

  return (
    <main className="min-h-screen pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Simple, Transparent <span className="gradient-text">Pricing</span></h1>
          <p className="text-xl text-surface-500 max-w-2xl mx-auto">No hidden fees. You only pay for the sessions you book.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <div key={tier.name} className={`glass-card rounded-3xl p-8 relative ${tier.highlight ? 'border-primary-500/50 shadow-glow-primary' : ''}`}>
              {tier.highlight && <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-full">POPULAR</div>}
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-5xl font-black">{tier.price}</span>
              </div>
              <p className="text-surface-500 mb-8 h-12">{tier.description}</p>
              
              <ul className="space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary-500" />
                    <span className="text-surface-700 dark:text-surface-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={tier.href} className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${tier.highlight ? 'gradient-primary text-white shadow-glow-primary hover:opacity-90' : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white hover:bg-surface-200 dark:hover:bg-surface-700'}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
