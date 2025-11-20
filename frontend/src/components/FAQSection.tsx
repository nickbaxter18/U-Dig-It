'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'What equipment do you offer for rent?',
    answer:
      'We specialize in Kubota SVL-75 compact track loaders, perfect for construction, landscaping, and excavation projects. Our equipment is professionally maintained and comes with full insurance coverage.',
  },
  {
    question: 'How do I book equipment?',
    answer:
      "Booking is easy! Use our online booking widget to select your equipment and dates, or call us at (506) 643-1575. You'll receive instant confirmation and all the details you need.",
  },
  {
    question: 'What are your rental rates?',
    answer:
      'Our Kubota SVL-75 starts at $450/day with competitive weekly and monthly rates available. Contact us for custom quotes based on your project duration and specific needs.',
  },
  {
    question: 'Do you deliver equipment?',
    answer:
      'Yes! We offer same-day delivery throughout Saint John and surrounding areas including Rothesay, Quispamsis, Grand Bay-Westfield, and Hampton. Delivery fees vary by location.',
  },
  {
    question: 'What insurance is required?',
    answer:
      'All our equipment comes with $120,000 liability insurance included. We can also provide additional coverage options based on your project requirements.',
  },
  {
    question: 'Do I need operator certification?',
    answer:
      'While certification is recommended, we provide comprehensive training and safety instructions with every rental. For commercial projects, operator certification may be required by your insurance.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'We offer flexible cancellation up to 48 hours before your rental start date for a full refund. Cancellations within 48 hours are subject to a 50% cancellation fee.',
  },
  {
    question: 'What if the equipment breaks down?',
    answer:
      'All our equipment is thoroughly inspected before rental. In the rare event of a breakdown, we provide 24/7 support and will replace the equipment at no additional cost.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-bold text-blue-600">FAQ</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about renting equipment from U-Dig It Rentals
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq: unknown, index: unknown) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border-2 border-gray-100 bg-white shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50"
              >
                <span className="flex-1 text-lg font-bold text-gray-900">{faq.question}</span>
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E1BC56]/10 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                >
                  <svg
                    className="h-5 w-5 text-[#E1BC56]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="border-t border-gray-100 px-6 pb-5 pt-4 leading-relaxed text-gray-600">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-center text-white">
          <h3 className="mb-3 text-2xl font-bold">Still Have Questions?</h3>
          <p className="mb-6 text-blue-100">
            Our team is here to help! Contact us anytime for personalized assistance.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="tel:+15066431575"
              className="btn-premium-gold inline-flex items-center justify-center rounded-lg px-6 py-3 font-bold"
              style={{ animationDelay: '1s' }}
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Call (506) 643-1575
            </a>
            <a
              href="mailto:info@udigitnb.ca"
              className="btn-premium-gold inline-flex items-center justify-center rounded-lg px-6 py-3 font-bold"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
