'use client';

const steps = [
  {
    number: '1',
    title: 'Choose Equipment',
    description:
      'Browse our professional Kubota equipment and select what you need for your project.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    number: '2',
    title: 'Select Dates',
    description: 'Pick your rental period and check real-time availability instantly.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    number: '3',
    title: 'Book Online',
    description:
      'Complete your secure booking online with instant confirmation and transparent pricing.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    number: '4',
    title: 'We Deliver',
    description: 'Sit back and relax. We deliver the equipment to your site, ready to work.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
        />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-bold text-blue-600">Simple Process</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">How It Works</h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            Rent professional equipment in 4 easy steps. Fast, simple, and hassle-free.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div
            className="absolute left-0 right-0 top-1/4 hidden h-1 -translate-y-1/2 transform bg-gradient-to-r from-[#E1BC56] via-yellow-400 to-[#E1BC56] lg:block"
            style={{ top: '80px' }}
          ></div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step: unknown, index: unknown) => (
              <div key={index} className="relative">
                {/* Step Card */}
                <div className="h-full transform rounded-2xl border-2 border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#E1BC56]/30 hover:shadow-2xl">
                  {/* Step Number */}
                  <div className="relative mb-6">
                    <div className="mx-auto flex h-20 w-20 rotate-3 transform items-center justify-center rounded-2xl bg-gradient-to-br from-[#E1BC56] to-yellow-500 text-white shadow-lg transition-transform hover:rotate-0">
                      <div className="-rotate-3 transform">{step.icon}</div>
                    </div>
                    <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  {/* Step Content */}
                  <h3 className="mb-3 text-center text-2xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-center leading-relaxed text-gray-600">{step.description}</p>
                </div>

                {/* Arrow - Desktop */}
                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-20 z-10 hidden text-[#E1BC56] lg:block">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                {/* Arrow - Mobile */}
                {index < steps.length - 1 && (
                  <div className="my-4 flex justify-center text-[#E1BC56] lg:hidden">
                    <svg
                      className="h-8 w-8 rotate-90 transform"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="rounded-2xl border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 md:p-12">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">
              Ready to Get Started?
            </h3>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-gray-600">
              Join hundreds of satisfied customers who trust U-Dig It Rentals for their equipment
              needs.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/book"
                className="btn-premium-gold inline-flex items-center justify-center rounded-lg px-8 py-4 font-bold"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                Start Booking Now
              </a>
              <a
                href="tel:+15066431575"
                className="btn-premium-gold inline-flex items-center justify-center rounded-lg px-8 py-4 font-bold"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
