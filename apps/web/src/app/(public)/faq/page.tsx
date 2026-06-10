import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@peer-tutoring/ui';

export default function FAQPage() {
  const faqs = [
    {
      question: "How do I become a tutor?",
      answer: "You can sign up as a tutor by creating an account and verifying your academic credentials. Once approved by our team, you can set your schedule and rates."
    },
    {
      question: "How does payment work?",
      answer: "Students pay securely through our platform before the session starts. Funds are held in escrow and released to the tutor's wallet upon successful completion of the session."
    },
    {
      question: "Can I cancel a booked session?",
      answer: "Yes, you can cancel a session up to 24 hours before the scheduled time for a full refund. Late cancellations may incur a fee."
    },
    {
      question: "What if my tutor doesn't show up?",
      answer: "If your tutor fails to attend a session, you will automatically receive a full refund, and you can report the incident from your dashboard."
    }
  ];

  return (
    <main className="min-h-screen pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center & <span className="gradient-text">FAQ</span></h1>
          <p className="text-xl text-surface-500 max-w-2xl mx-auto">Find answers to common questions about PeerNova.</p>
        </div>
        
        <div className="glass-card rounded-2xl p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-surface-600 dark:text-surface-400 text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </main>
  );
}
