'use client';

import { BarChart, CheckCircle, FileText, Mail, Send, XCircle } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { EmailDeliveryDashboard } from '@/components/admin/EmailDeliveryDashboard';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface EmailCampaign {
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
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  templateType: string;
  isActive: boolean;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalRecipients: number;
}

export default function CommunicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data state
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalEmailsSent: 0,
    averageOpenRate: 0,
    averageClickRate: 0,
    totalRecipients: 0,
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30d');

  // Tab state
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'delivery'>('campaigns');

  // Fetch campaigns and templates
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch campaigns
      const campaignsRes = await fetchWithAuth(
        `/api/admin/communications/campaigns?dateRange=${dateRange}`
      );
      if (!campaignsRes.ok) throw new Error('Failed to fetch campaigns');
      const campaignsData = await campaignsRes.json();

      setCampaigns(campaignsData.campaigns || []);
      setStats((prev) => campaignsData.stats || prev);

      // Fetch templates
      const templatesRes = await fetchWithAuth('/api/admin/communications/templates');
      if (!templatesRes.ok) throw new Error('Failed to fetch templates');
      const templatesData = await templatesRes.json();

      setTemplates(templatesData.templates || []);

      logger.info('Communications data fetched successfully', {
        component: 'CommunicationsPage',
        action: 'fetch_data',
        metadata: { campaignCount: campaignsData.campaigns?.length || 0 },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Failed to fetch communications data',
        {
          component: 'CommunicationsPage',
          action: 'fetch_data_error',
          metadata: { error: errorMessage },
        },
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Fetch campaigns and templates
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, dateRange, fetchData]);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate status badge color
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kubota-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Communications Center</h1>
          <p className="mt-2 text-gray-600">Manage email campaigns and customer communications</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCampaigns}</p>
              </div>
              <BarChart className="h-10 w-10 text-kubota-orange" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalEmailsSent.toLocaleString()}
                </p>
              </div>
              <Send className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Open Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.averageOpenRate.toFixed(1)}%
                </p>
              </div>
              <Mail className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Click Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.averageClickRate.toFixed(1)}%
                </p>
              </div>
              <BarChart className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => router.push('/admin/communications/new-campaign')}
            className="bg-kubota-orange hover:bg-kubota-orange-dark text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors"
          >
            <Send className="h-5 w-5" />
            Create Campaign
          </button>
          <button
            onClick={() => router.push('/admin/communications/new-template')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-colors"
          >
            <FileText className="h-5 w-5" />
            Create Template
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'campaigns'
                    ? 'border-b-2 border-kubota-orange text-kubota-orange'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Email Campaigns
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'templates'
                    ? 'border-b-2 border-kubota-orange text-kubota-orange'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Email Templates
              </button>
              <button
                onClick={() => setActiveTab('delivery')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'delivery'
                    ? 'border-b-2 border-kubota-orange text-kubota-orange'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📈 Delivery Stats (NEW)
              </button>
            </nav>
          </div>

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="p-6">
              {/* Filters */}
              <div className="mb-6 flex flex-wrap gap-4">
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e: unknown) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kubota-orange focus:border-kubota-orange"
                />

                <select
                  value={statusFilter}
                  onChange={(e: unknown) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kubota-orange"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="sent">Sent</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e: unknown) => setDateRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kubota-orange"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Campaigns Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opened
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clicked
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No campaigns found. Create your first campaign to get started!
                        </td>
                      </tr>
                    ) : (
                      filteredCampaigns.map((campaign: unknown) => (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{campaign.name}</div>
                              <div className="text-sm text-gray-500">{campaign.subject}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}
                            >
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {campaign.recipientCount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {campaign.emailsSent.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {campaign.emailsSent > 0
                              ? `${((campaign.emailsOpened / campaign.emailsSent) * 100).toFixed(1)}%`
                              : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {campaign.emailsSent > 0
                              ? `${((campaign.emailsClicked / campaign.emailsSent) * 100).toFixed(1)}%`
                              : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaign.sentAt
                              ? new Date(campaign.sentAt).toLocaleDateString()
                              : campaign.scheduledAt
                                ? `Scheduled: ${new Date(campaign.scheduledAt).toLocaleDateString()}`
                                : new Date(campaign.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() =>
                                router.push(`/admin/communications/campaign/${campaign.id}`)
                              }
                              className="text-kubota-orange hover:text-kubota-orange-dark font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delivery Stats Tab */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <EmailDeliveryDashboard />
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-gray-500">
                    No templates found. Create your first template to get started!
                  </div>
                ) : (
                  templates.map((template: unknown) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <FileText className="h-8 w-8 text-kubota-orange" />
                        {template.isActive ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {template.templateType}
                      </span>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() =>
                            router.push(`/admin/communications/template/${template.id}`)
                          }
                          className="flex-1 text-center px-4 py-2 bg-kubota-orange text-white rounded-lg hover:bg-kubota-orange-dark transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/communications/new-campaign?template=${template.id}`
                            )
                          }
                          className="flex-1 text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
