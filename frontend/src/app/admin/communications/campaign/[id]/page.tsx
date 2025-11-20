'use client';

import { ArrowLeft, BarChart, Mail, Send, Users } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface CampaignDetail {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'cancelled' | 'failed';
  recipientCount: number;
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsFailed: number;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  htmlContent?: string;
  textContent?: string;
  recipientFilter?: unknown;
}

export default function CampaignDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user && campaignId) {
      fetchCampaign();
    }
  }, [user, authLoading, router, campaignId, fetchCampaign]);

  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithAuth(`/api/admin/communications/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign');
      }

      const data = await response.json();
      setCampaign(data.campaign);

      logger.info('Campaign detail fetched successfully', {
        component: 'CampaignDetailPage',
        action: 'fetch_campaign',
        metadata: { campaignId },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error(
        'Failed to fetch campaign detail',
        {
          component: 'CampaignDetailPage',
          action: 'fetch_campaign_error',
          metadata: { error: errorMessage, campaignId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOpenRate = () => {
    if (!campaign || campaign.emailsSent === 0) return 0;
    return (campaign.emailsOpened / campaign.emailsSent) * 100;
  };

  const calculateClickRate = () => {
    if (!campaign || campaign.emailsSent === 0) return 0;
    return (campaign.emailsClicked / campaign.emailsSent) * 100;
  };

  const calculateDeliveryRate = () => {
    if (!campaign || campaign.emailsSent === 0) return 0;
    return (campaign.emailsDelivered / campaign.emailsSent) * 100;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kubota-orange"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => router.push('/admin/communications')}
              className="mt-4 text-red-600 hover:text-red-800 underline"
            >
              Back to Communications
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Campaign not found</p>
            <button
              onClick={() => router.push('/admin/communications')}
              className="mt-4 text-kubota-orange hover:text-kubota-orange-dark underline"
            >
              Back to Communications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/communications')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Communications
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <p className="mt-2 text-gray-600">{campaign.subject}</p>
            </div>
            <span
              className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}
            >
              {campaign.status}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recipients</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {campaign.recipientCount.toLocaleString()}
                </p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {campaign.emailsSent.toLocaleString()}
                </p>
              </div>
              <Send className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {calculateOpenRate().toFixed(1)}%
                </p>
              </div>
              <Mail className="h-10 w-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {calculateClickRate().toFixed(1)}%
                </p>
              </div>
              <BarChart className="h-10 w-10 text-kubota-orange" />
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Emails Delivered</span>
                <span className="text-sm font-medium">
                  {campaign.emailsDelivered.toLocaleString()} ({calculateDeliveryRate().toFixed(1)}
                  %)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Emails Opened</span>
                <span className="text-sm font-medium">
                  {campaign.emailsOpened.toLocaleString()} ({calculateOpenRate().toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Emails Clicked</span>
                <span className="text-sm font-medium">
                  {campaign.emailsClicked.toLocaleString()} ({calculateClickRate().toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Emails Failed</span>
                <span className="text-sm font-medium text-red-600">
                  {campaign.emailsFailed.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Timeline</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm font-medium ml-2">
                  {new Date(campaign.createdAt).toLocaleString()}
                </span>
              </div>
              {campaign.scheduledAt && (
                <div>
                  <span className="text-sm text-gray-600">Scheduled:</span>
                  <span className="text-sm font-medium ml-2">
                    {new Date(campaign.scheduledAt).toLocaleString()}
                  </span>
                </div>
              )}
              {campaign.sentAt && (
                <div>
                  <span className="text-sm text-gray-600">Sent:</span>
                  <span className="text-sm font-medium ml-2">
                    {new Date(campaign.sentAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Content Preview */}
        {campaign.htmlContent && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Content Preview</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: campaign.htmlContent }}
              />
            </div>
          </div>
        )}

        {/* Recipient Filter Info */}
        {campaign.recipientFilter && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipient Filter</h3>
            <div className="text-sm text-gray-600">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(campaign.recipientFilter, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
