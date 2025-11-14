'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  lastUpdated: string;
  category: string;
}

interface SupabaseTicket {
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  category: string | null;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function SupportPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'faq' | 'tickets' | 'contact'>('faq');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
  });
  const [contactForm, setContactForm] = useState({
    name: user?.user_metadata?.firstName || '',
    email: user?.email || '',
    phone: '',
    subject: '',
    message: '',
  });

  // MIGRATED: Fetch support tickets from Supabase
  useEffect(() => {
    if (user && activeTab === 'tickets') {
      fetchTickets();

      // Subscribe to real-time ticket updates
      const channel = supabase
        .channel(`support-tickets-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_tickets',
            filter: `customer_id=eq.${user.id}`,
          },
          payload => {
            if (process.env.NODE_ENV === 'development') {
              logger.debug('[Support] Ticket change detected', {
                component: 'app-page',
                action: 'debug',
                metadata: { payload },
              });
            }
            fetchTickets();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, activeTab]);

  const fetchTickets = async () => {
    if (!user) return;

    try {
      setTicketsLoading(true);

      const { data, error } = await supabase
        .from('support_tickets')
        .select(
          `
          id,
          ticket_number,
          subject,
          description,
          priority,
          status,
          category,
          created_at,
          updated_at,
          booking:booking_id (bookingNumber),
          equipment:equipment_id (make, model)
        `
        )
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to component format
      const transformed: SupportTicket[] = (data || []).map((ticket: SupabaseTicket) => ({
        id: ticket.ticket_number,
        subject: ticket.subject,
        status: ticket.status as SupportTicket['status'],
        priority: ticket.priority as SupportTicket['priority'],
        createdAt: ticket.created_at,
        lastUpdated: ticket.updated_at,
        category: ticket.category || 'General',
      }));

      setTickets(transformed);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[Support] Failed to fetch tickets', {
          component: 'app-page',
          action: 'error',
        }, err instanceof Error ? err : undefined);
      }
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const faqItems: FAQItem[] = [
    {
      question: 'What are your rental rates?',
      answer:
        'Our Kubota SVL-75 compact track loader starts at $450/day. Rates decrease for longer rental periods: weekly rates available at $2,500/week, monthly rates at $8,000/month. All rates include basic maintenance and fuel.',
      category: 'Pricing',
    },
    {
      question: 'What insurance do I need to rent equipment?',
      answer:
        'You must provide a Certificate of Insurance with: $2M Commercial General Liability, $120K Equipment Coverage, and U-Dig It Rentals Inc. listed as Additional Insured and Loss Payee. We can help you obtain appropriate coverage if needed.',
      category: 'Insurance',
    },
    {
      question: 'How far in advance should I book?',
      answer:
        'We recommend booking at least 3-5 business days in advance, especially during peak construction season (May-October). However, we often have same-day or next-day availability. Call us at (506) 643-1575 to check immediate availability.',
      category: 'Booking',
    },
    {
      question: 'What areas do you deliver to?',
      answer:
        'We deliver throughout the Greater Saint John area including: Saint John ($150 each way), Rothesay ($160 each way), Quispamsis ($175 each way), Grand Bay-Westfield ($175 each way), Hampton ($190 each way), and other areas (pricing varies). Delivery includes equipment drop-off and pickup.',
      category: 'Delivery',
    },
    {
      question: 'What is included in the rental?',
      answer:
        'All rentals include: fully fueled equipment, basic maintenance during rental period, 24/7 emergency support, delivery and pickup (fees apply), operator manual, and safety equipment. Attachments and additional accessories available upon request.',
      category: 'Rental Terms',
    },
    {
      question: 'Can I extend my rental period?',
      answer:
        "Yes! You can extend your rental period subject to equipment availability. Contact us at least 24 hours before your scheduled return date. Extensions are charged at the daily rate, and we'll send you an updated invoice.",
      category: 'Rental Terms',
    },
    {
      question: 'What happens if the equipment breaks down?',
      answer:
        "We provide 24/7 emergency support. If equipment fails due to normal wear and tear, we'll repair or replace it at no charge. Call our emergency line immediately: (506) 643-1575. Damage due to misuse or negligence may be charged to the renter.",
      category: 'Support',
    },
    {
      question: 'How do I cancel or modify a booking?',
      answer:
        'Cancellations made 48+ hours before rental start receive full refund. Cancellations within 48 hours are subject to a 50% cancellation fee. To modify dates, contact us at least 24 hours in advance. Changes subject to availability.',
      category: 'Booking',
    },
    {
      question: 'Do you provide operator training?',
      answer:
        'We provide basic orientation on equipment operation at delivery. For comprehensive training, we can recommend certified training providers. All operators must have appropriate licensing and experience for safe equipment operation.',
      category: 'Training',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept credit cards (Visa, Mastercard, Amex), debit cards, e-transfer, and company checks (with approved credit). A $500 security deposit is required, refunded within 5 business days after equipment return and inspection.',
      category: 'Payment',
    },
  ];

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to create a support ticket');
      return;
    }

    try {
      // MIGRATED: Create ticket in Supabase
      const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`;

      const supabaseAny: any = supabase;
      const { data, error } = await supabaseAny
        .from('support_tickets')
        .insert([
          {
            ticket_number: ticketNumber,
            customer_id: user.id,
            subject: ticketForm.subject,
            description: ticketForm.description,
            priority: ticketForm.priority,
            status: 'open',
            category: ticketForm.category || 'General',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (process.env.NODE_ENV === 'development') {
        logger.debug('[Support] Ticket created', {
          component: 'app-page',
          action: 'debug',
          metadata: { data },
        });
      }

      alert(`Support ticket ${ticketNumber} created successfully! We'll respond within 24 hours.`);

      // Reset form
      setTicketForm({
        subject: '',
        category: '',
        priority: 'medium',
        description: '',
      });

      // Close modal
      const modal = document.getElementById('new-ticket-modal');
      if (modal) modal.classList.add('hidden');

      // Refresh tickets list
      fetchTickets();
    } catch (err) {
      logger.error('[Support] Failed to create ticket', {
        component: 'app-page',
        action: 'error',
      }, err instanceof Error ? err : undefined);
      alert('Failed to create support ticket. Please try again or contact us directly.');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Sending contact message', {
        component: 'app-page',
        action: 'debug',
        metadata: { contactForm },
      });
    }
    // TODO: Implement API call to send message
    alert("Message sent successfully! We'll get back to you within 24 hours.");
    setContactForm({
      name: user?.user_metadata?.firstName || '',
      email: user?.email || '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
            <p className="mt-2 text-gray-600">
              Get help with your equipment rentals, bookings, and account
            </p>
          </div>

          {/* Emergency Contact Banner */}
          <div className="mb-8 border-l-4 border-red-600 bg-red-50 p-4">
            <div className="flex items-center">
              <svg
                className="mr-3 h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Emergency Support Available 24/7</p>
                <p className="text-sm text-red-700">
                  For urgent equipment issues during active rentals, call:{' '}
                  <a href="tel:+15066431575" className="font-semibold underline">
                    (506) 643-1575
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 rounded-lg bg-white shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'faq'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    FAQ
                  </div>
                </button>
                {user && (
                  <button
                    onClick={() => setActiveTab('tickets')}
                    className={`border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'tickets'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg
                        className="mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                        />
                      </svg>
                      My Tickets
                      {tickets.filter(t => t.status !== 'closed').length > 0 && (
                        <span className="ml-2 rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                          {tickets.filter(t => t.status !== 'closed').length}
                        </span>
                      )}
                    </div>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'contact'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Contact Us
                  </div>
                </button>
              </nav>
            </div>

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-gray-600">
                    Find answers to common questions about our equipment rental service
                  </p>
                </div>

                {/* FAQ Categories */}
                <div className="space-y-4">
                  {faqItems.map((item: any, index: any) => (
                    <div key={index} className="overflow-hidden rounded-lg border border-gray-200">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        className="flex w-full items-center justify-between bg-white px-6 py-4 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="flex flex-1 items-center">
                          <span className="mr-3 rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-600">
                            {item.category}
                          </span>
                          <span className="font-medium text-gray-900">{item.question}</span>
                        </div>
                        <svg
                          className={`h-5 w-5 text-gray-500 transition-transform ${
                            expandedFAQ === index ? 'rotate-180 transform' : ''
                          }`}
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
                      </button>
                      {expandedFAQ === index && (
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                          <p className="text-gray-700">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Still have questions? */}
                <div className="mt-8 rounded-lg bg-blue-50 p-6 text-center">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Still have questions?
                  </h3>
                  <p className="mb-4 text-gray-600">Our support team is here to help</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setActiveTab('contact')}
                      className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
                    >
                      Contact Support
                    </button>
                    <a
                      href="tel:+15066431575"
                      className="rounded-lg border border-blue-600 bg-white px-6 py-2 text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      Call (506) 643-1575
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <div className="p-6">
                {!user ? (
                  <div className="py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Sign in to view tickets
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You need to be logged in to create and view support tickets
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/auth/signin?callbackUrl=/support"
                        className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                      >
                        Sign In
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">My Support Tickets</h2>
                        <p className="mt-1 text-gray-600">Track and manage your support requests</p>
                      </div>
                      <button
                        onClick={() => {
                          const modal = document.getElementById('new-ticket-modal');
                          if (modal) modal.classList.remove('hidden');
                        }}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                      >
                        <div className="flex items-center">
                          <svg
                            className="mr-2 h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          New Ticket
                        </div>
                      </button>
                    </div>

                    {/* Tickets List */}
                    {ticketsLoading ? (
                      <div className="rounded-lg bg-white py-12 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading tickets...</p>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="rounded-lg bg-white py-12 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          No support tickets
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You haven't created any support tickets yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tickets.map(ticket => (
                          <div
                            key={ticket.id}
                            className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center space-x-3">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {ticket.subject}
                                  </h3>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(ticket.status)}`}
                                  >
                                    {ticket.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                                  >
                                    {ticket.priority.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">Ticket #{ticket.id}</p>
                                <p className="text-sm text-gray-600">Category: {ticket.category}</p>
                                <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                                  <span>
                                    Created: {new Date(ticket.createdAt).toLocaleDateString()}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Updated: {new Date(ticket.lastUpdated).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <button className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-800">
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Ticket Modal */}
                    <div
                      id="new-ticket-modal"
                      className="fixed inset-0 z-50 hidden items-center justify-center bg-black bg-opacity-50 p-4"
                    >
                      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
                        <div className="p-6">
                          <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                              Create Support Ticket
                            </h2>
                            <button
                              onClick={() => {
                                const modal = document.getElementById('new-ticket-modal');
                                if (modal) modal.classList.add('hidden');
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          <form onSubmit={handleTicketSubmit} className="space-y-4">
                            <div>
                              <label
                                htmlFor="ticket-subject"
                                className="mb-1 block text-sm font-medium text-gray-700"
                              >
                                Subject *
                              </label>
                              <input
                                type="text"
                                id="ticket-subject"
                                required
                                value={ticketForm.subject}
                                onChange={e =>
                                  setTicketForm({ ...ticketForm, subject: e.target.value })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Brief description of your issue"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label
                                  htmlFor="ticket-category"
                                  className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                  Category *
                                </label>
                                <select
                                  id="ticket-category"
                                  required
                                  value={ticketForm.category}
                                  onChange={e =>
                                    setTicketForm({ ...ticketForm, category: e.target.value })
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select category</option>
                                  <option value="booking">Booking Issue</option>
                                  <option value="equipment">Equipment Problem</option>
                                  <option value="delivery">Delivery/Pickup</option>
                                  <option value="payment">Payment/Billing</option>
                                  <option value="insurance">Insurance</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>

                              <div>
                                <label
                                  htmlFor="ticket-priority"
                                  className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                  Priority *
                                </label>
                                <select
                                  id="ticket-priority"
                                  required
                                  value={ticketForm.priority}
                                  onChange={e =>
                                    setTicketForm({ ...ticketForm, priority: e.target.value })
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                  <option value="urgent">Urgent</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="ticket-description"
                                className="mb-1 block text-sm font-medium text-gray-700"
                              >
                                Description *
                              </label>
                              <textarea
                                id="ticket-description"
                                required
                                rows={6}
                                value={ticketForm.description}
                                onChange={e =>
                                  setTicketForm({ ...ticketForm, description: e.target.value })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Please provide detailed information about your issue..."
                              />
                            </div>

                            <div className="flex space-x-3 pt-4">
                              <button
                                type="submit"
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                              >
                                Submit Ticket
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const modal = document.getElementById('new-ticket-modal');
                                  if (modal) modal.classList.add('hidden');
                                }}
                                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">Contact Support</h2>
                  <p className="text-gray-600">
                    Send us a message and we'll get back to you within 24 hours
                  </p>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <svg
                      className="mx-auto mb-2 h-8 w-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <p className="mt-1 text-sm text-gray-600">(506) 643-1575</p>
                    <p className="mt-1 text-xs text-gray-500">Mon-Fri: 7AM-6PM</p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <svg
                      className="mx-auto mb-2 h-8 w-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="mt-1 text-sm text-gray-600">info@udigit.ca</p>
                    <p className="mt-1 text-xs text-gray-500">24hr response time</p>
                  </div>

                  <div className="rounded-lg bg-red-50 p-4 text-center">
                    <svg
                      className="mx-auto mb-2 h-8 w-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Emergency</h3>
                    <p className="mt-1 text-sm text-gray-600">(506) 643-1575</p>
                    <p className="mt-1 text-xs text-gray-500">24/7 for active rentals</p>
                  </div>
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Name *
                      </label>
                      <input
                        type="text"
                        id="contact-name"
                        required
                        value={contactForm.name}
                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="contact-email"
                        required
                        value={contactForm.email}
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="contact-phone"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(506) 123-4567"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="contact-subject"
                      required
                      value={contactForm.subject}
                      onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={6}
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please provide details about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
