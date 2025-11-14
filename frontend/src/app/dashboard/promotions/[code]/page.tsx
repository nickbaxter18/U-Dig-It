'use client';

import { format } from 'date-fns';
import { BookOpen, CheckCircle2, Copy, Gift, MapPin, Timer, XCircle } from 'lucide-react';

import { useMemo, useState } from 'react';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

const PROMOTION_CONTENT: Record<
  string,
  {
    code: string;
    amount: number;
    headline: string;
    subheadline: string;
    highlights: string[];
    finePrint: string[];
    bestFor: string;
    availability: string;
    expiresDescription: string;
    awardedDescription: string;
  }
> = {
  'udig-gold50': {
    code: 'UDIG-GOLD50',
    amount: 50,
    headline: '$50 off your next booking',
    subheadline:
      'Trim the cost of compact equipment or add-on attachments and keep smaller jobs under budget.',
    highlights: [
      'Ideal for weekday trenching, lawn prep, and one-day projects.',
      'Pairs nicely with augers, forks, and other attachment upgrades.',
      'Lets you experiment with new tools without stretching your spend.',
    ],
    finePrint: [
      'Redeem within 48 hours of winning via your customer dashboard checkout.',
      'Discount applies once per booking and before taxes/delivery.',
      'Non-transferable — tied to the account that claimed the prize.',
    ],
    bestFor: 'Trenching, fence post installs, lawn prep, and other one-day jobs.',
    availability:
      'Available across Greater Saint John, Rothesay, Quispamsis, Hampton, and surrounding communities.',
    expiresDescription: 'Use it within 48 hours to keep the discount active.',
    awardedDescription: 'Awarded instantly on your third spin of the wheel.',
  },
  'udig-super75': {
    code: 'UDIG-SUPER75',
    amount: 75,
    headline: '$75 off your next booking',
    subheadline:
      'Cover most delivery fees or fuel top-ups and arrive on site ready to work all weekend.',
    highlights: [
      'Great for delivery-heavy jobs or bundling multiple attachments.',
      'Softens the cost of skid steers, mini excavators, and compact track loaders.',
      'Keeps your security deposit available for unforeseen incidents.',
    ],
    finePrint: [
      'Checkout must be completed within 48 hours of the win to activate the discount.',
      'Cannot be combined with corporate rate agreements.',
      'Online redemption only through your authenticated dashboard.',
    ],
    bestFor: 'Weekend mini-excavators, skid steers, and add-on attachments.',
    availability: 'Covers deliveries anywhere we travel within our standard service radius.',
    expiresDescription: 'Redeem within 48 hours of the win to keep the savings.',
    awardedDescription: 'Unlocked during the Spin-to-Win finale with one final click.',
  },
  'udig-jackpot': {
    code: 'UDIG-JACKPOT',
    amount: 100,
    headline: '$100 off your next booking',
    subheadline:
      'Take a serious bite out of large equipment rentals or week-long construction projects.',
    highlights: [
      'Offset premium attachments, additional safety gear, or deep-clean add-ons.',
      'Perfect for multi-day trenching, shoring, or commercial builds.',
      'Helps secure high-demand equipment during peak season.',
    ],
    finePrint: [
      'Complete checkout within 48 hours of winning to apply the jackpot savings.',
      'Discount is single-use and calculated before taxes.',
      'Tied to the customer profile that landed the prize.',
    ],
    bestFor: 'Week-long track loader rentals, excavation projects, or seasonal site prep.',
    availability: 'Valid across our delivery network—contact dispatch for special accommodations.',
    expiresDescription: 'Redeem within 48 hours to lock in the jackpot value.',
    awardedDescription: 'Granted instantly when the wheel lands on the jackpot slice.',
  },
};

export default function PromotionDetailPage() {
  const params = useParams<{ code: string }>();
  const codeParam = (params?.code ?? '').toLowerCase();
  const promotion = PROMOTION_CONTENT[codeParam];

  if (!promotion) {
    notFound();
  }

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const statusBadge = useMemo(() => {
    return {
      label: 'Active',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Timer,
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promotion.code);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gradient-to-r from-[#FFF6E0] to-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                    Promotion
                  </p>
                  <h1 className="mt-1 text-3xl font-bold text-gray-900">{promotion.headline}</h1>
                  <p className="mt-2 text-gray-600">{promotion.subheadline}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-semibold ${statusBadge.className}`}
                  >
                    <statusBadge.icon className="h-4 w-4" />
                    {statusBadge.label}
                  </span>
                  <p className="text-xs text-gray-500">
                    Awarded moments ago · {promotion.awardedDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-8 p-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm font-medium text-gray-500">Your coupon code</p>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="rounded-md bg-white px-4 py-2 text-xl font-semibold tracking-widest text-gray-900 shadow-sm">
                      {promotion.code}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                    >
                      <Copy className="h-4 w-4" />
                      {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  {copyStatus === 'error' && (
                    <p className="mt-2 text-sm text-red-600">
                      Unable to copy automatically. Please copy it manually.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">How to redeem</h2>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
                    <li>Start a booking from your dashboard and pick your rental dates.</li>
                    <li>
                      Enter <strong>{promotion.code}</strong> in the discount field before
                      completing checkout.
                    </li>
                    <li>The discount will apply instantly to your rental total.</li>
                  </ol>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Why you’ll love this prize
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    {promotion.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">Best suited for</h2>
                  <p className="mt-2 text-sm text-gray-600">{promotion.bestFor}</p>
                  <p className="mt-4 text-sm text-gray-600">{promotion.availability}</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">Plan around the expiry</h2>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-gray-500" />
                      {promotion.expiresDescription}
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {promotion.availability}
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">Ready to book?</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Lock in your preferred dates before the busy season. Discounts stack with our
                    long-term pricing tiers.
                  </p>
                  <Link
                    href="/book"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#E1BC56] px-5 py-3 font-semibold text-gray-900 shadow-sm transition hover:bg-[#d4b04a]"
                  >
                    <BookOpen className="h-5 w-5" />
                    Start a booking
                  </Link>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">Need help?</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Our rental specialists can walk you through applying discounts and planning
                    delivery logistics.
                  </p>
                  <Link
                    href="/support"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#B98109] hover:text-[#94680a]"
                  >
                    <Gift className="h-4 w-4" />
                    Contact support
                  </Link>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">Fine print</h2>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    {promotion.finePrint.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 text-gray-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
