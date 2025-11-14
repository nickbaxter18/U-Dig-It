'use client';

import { useState } from 'react';

const testimonials = [
  {
    id: 1,
    name: 'John MacDonald',
    role: 'Construction Manager',
    company: 'Atlantic Builders Ltd.',
    image: '/images/avatar-placeholder.png',
    rating: 5,
    text: 'Best equipment rental experience in Saint John! The Kubota SVL-75 was in perfect condition, delivery was on time, and the service was exceptional. Highly recommend for any construction project.',
    date: '2 weeks ago',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    role: 'Landscape Designer',
    company: 'Green Spaces NB',
    image: '/images/avatar-placeholder.png',
    rating: 5,
    text: 'U-Dig It Rentals made our landscaping project so much easier. Professional service, fair pricing, and the equipment was exactly what we needed. Will definitely use them again!',
    date: '1 month ago',
  },
  {
    id: 3,
    name: 'Mike Peterson',
    role: 'Homeowner',
    company: 'Rothesay, NB',
    image: '/images/avatar-placeholder.png',
    rating: 5,
    text: 'Rented for a DIY excavation project. The team was incredibly helpful, explained everything clearly, and the insurance process was straightforward. Great local business!',
    date: '3 weeks ago',
  },
];

export default function TestimonialsSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#E1BC56]/10 px-4 py-2">
            <svg className="h-5 w-5 text-[#E1BC56]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold text-[#E1BC56]">Customer Reviews</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            What Our Customers Say
          </h2>
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="h-6 w-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-2xl font-bold text-gray-900">4.9/5</span>
          </div>
          <p className="text-gray-600">Based on 127+ verified reviews</p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-xl md:p-12">
            {/* Quote Icon */}
            <div className="absolute left-8 top-8 text-[#E1BC56]/20">
              <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>

            {/* Testimonial Content */}
            <div className="relative z-10">
              <div className="mb-4 flex justify-center gap-1">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="mb-8 text-center text-xl leading-relaxed text-gray-700 md:text-2xl">
                "{testimonials[activeTestimonial].text}"
              </p>

              <div className="flex items-center justify-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#E1BC56] to-yellow-500 text-2xl font-bold text-white">
                  {testimonials[activeTestimonial].name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-gray-900">
                    {testimonials[activeTestimonial].name}
                  </div>
                  <div className="text-gray-600">{testimonials[activeTestimonial].role}</div>
                  <div className="text-sm text-gray-500">
                    {testimonials[activeTestimonial].company}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                {testimonials[activeTestimonial].date}
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`h-3 w-3 rounded-full transition-all ${
                  index === activeTestimonial ? 'w-8 bg-[#E1BC56]' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-[#E1BC56]">500+</div>
            <div className="text-gray-600">Successful Rentals</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-[#E1BC56]">4.9/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-[#E1BC56]">98%</div>
            <div className="text-gray-600">Customer Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-[#E1BC56]">24/7</div>
            <div className="text-gray-600">Support Available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
