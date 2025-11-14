'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ContestVerifyPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [referralInfo, setReferralInfo] = useState({ code: '', link: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify email
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/contest/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
        return;
      }

      setStatus('success');
      setReferralInfo({
        code: data.referralCode,
        link: data.referralLink,
      });
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralInfo.link);
    alert('Referral link copied!');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralInfo.link)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Entry...</h2>
          <p className="text-gray-600">Please wait while we confirm your email.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            href="/contest"
            className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">You're Entered!</h1>
          <p className="text-xl text-gray-600">
            Your entry for this month's contest has been confirmed.
          </p>
        </div>

        {/* Referral Section */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">
            🎁 Want Another Chance to Win?
          </h2>
          <p className="text-gray-700 mb-4">
            Share your unique referral link with friends. When they enter and verify using your code,
            you <strong>BOTH</strong> get entered in the <strong>Referral Grand Prize</strong> draw!
          </p>

          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">Your Referral Code:</div>
            <div className="font-mono text-2xl font-bold text-yellow-700 mb-3">
              {referralInfo.code}
            </div>
            <div className="text-xs text-gray-500 break-all mb-3">
              {referralInfo.link}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copyReferralLink}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold"
              >
                📋 Copy Link
              </button>
              <button
                onClick={shareToFacebook}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold"
              >
                📱 Share on Facebook
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Share on Facebook, send to friends via text, or post in community
            groups. The more friends who enter using your code, the better your chances!
          </p>
        </div>

        {/* What Happens Next */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-lg mb-3">What Happens Next?</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>You're entered in the <strong>Grand Prize #1</strong> draw (all verified entries)</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">📧</span>
              <span>Winners announced on the last day of the month</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">🏆</span>
              <span>Each friend who uses your referral code earns you an additional entry in <strong>Grand Prize #2</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">🎁</span>
              <span>Winners receive a 4-hour machine + operator voucher (value: $600)</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg transition-colors font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}


