export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="glass-card rounded-2xl p-8 space-y-6 text-surface-600 dark:text-surface-400">
          <p className="text-sm">Last updated: June 2026</p>
          
          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create or modify your account, 
            request on-demand services, contact customer support, or otherwise communicate with us. This information 
            may include: name, email, phone number, profile picture, and payment method.
          </p>

          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect about you to provide, maintain, and improve our services, 
            including to facilitate payments, send receipts, provide products and services you request, 
            develop new features, provide customer support, and authenticate users.
          </p>

          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mt-8 mb-4">3. Data Security</h2>
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized 
            access, disclosure, alteration and destruction.
          </p>
        </div>
      </div>
    </main>
  );
}
