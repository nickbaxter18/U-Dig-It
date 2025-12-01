'use client';

import { Clock, MessageSquare, Shield, User } from 'lucide-react';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchSupportMessages } from '@/lib/api/admin/support';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: 'admin' | 'customer' | 'system';
  sender_id: string;
  message_text: string;
  attachments?: Array<{
    fileName: string;
    url: string;
    size?: number;
    contentType?: string;
  }>;
  created_at: string;
  internal: boolean;
}

interface MessageThreadProps {
  ticketId: string;
  onMessageSent?: () => void;
}

export default function MessageThread({ ticketId, onMessageSent }: MessageThreadProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSupportMessages(ticketId);
      setMessages((data as SupportMessage[]) || []);
    } catch (err) {
      logger.error(
        'Failed to fetch support messages',
        { component: 'MessageThread', action: 'fetch_failed', metadata: { ticketId } },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  // Initial fetch and real-time subscription setup
  useEffect(() => {
    if (!ticketId) return;

    let isMounted = true;

    // Initial fetch
    const loadMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSupportMessages(ticketId);
        if (isMounted) {
          setMessages((data as SupportMessage[]) || []);
        }
      } catch (err) {
        if (isMounted) {
          logger.error(
            'Failed to fetch support messages',
            { component: 'MessageThread', action: 'fetch_failed', metadata: { ticketId } },
            err instanceof Error ? err : new Error(String(err))
          );
          setError(err instanceof Error ? err.message : 'Failed to load messages');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMessages();

    // Set up Supabase Realtime subscription for new messages
    const channel = supabase
      .channel(`support-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          // Add new message to the list without refetching everything
          const newMessage = payload.new as unknown as SupportMessage;
          if (newMessage) {
            logger.debug('New support message received via Realtime', {
              component: 'MessageThread',
              action: 'realtime_message',
              metadata: { ticketId, messageId: newMessage.id },
            });

            // Add the new message only if it doesn't already exist (prevent duplicates)
            setMessages((prev) => {
              // Check if message already exists
              if (prev.some((msg) => msg.id === newMessage.id)) {
                return prev;
              }

              // Add new message and sort by created_at to maintain order
              const updated = [...prev, newMessage].sort((a, b) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateA - dateB;
              });

              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('Subscribed to support messages Realtime channel', {
            component: 'MessageThread',
            action: 'realtime_subscribed',
            metadata: { ticketId },
          });
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('Error subscribing to support messages Realtime channel', {
            component: 'MessageThread',
            action: 'realtime_subscribe_error',
            metadata: { ticketId, status },
          });
        }
      });

    return () => {
      isMounted = false;
      // Cleanup: remove Realtime subscription
      supabase.removeChannel(channel);
      logger.debug('Removed support messages Realtime subscription', {
        component: 'MessageThread',
        action: 'realtime_cleanup',
        metadata: { ticketId },
      });
    };
    // Only depend on ticketId to avoid recreating subscription
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && containerRef.current) {
      const container = containerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      if (isNearBottom || messages.length === 0) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getSenderIcon = (senderType: string, internal: boolean) => {
    if (internal) {
      return <Shield className="h-4 w-4 text-purple-600" />;
    }
    if (senderType === 'admin') {
      return <Shield className="h-4 w-4 text-blue-600" />;
    }
    if (senderType === 'customer') {
      return <User className="h-4 w-4 text-gray-600" />;
    }
    return <MessageSquare className="h-4 w-4 text-gray-400" />;
  };

  const getSenderLabel = (senderType: string, internal: boolean) => {
    if (internal) {
      return 'Internal Note';
    }
    if (senderType === 'admin') {
      return 'Admin';
    }
    if (senderType === 'customer') {
      return 'Customer';
    }
    return 'System';
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-premium-gold h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button onClick={fetchMessages} className="mt-2 text-sm text-red-600 hover:text-red-800">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h4 className="text-sm font-medium text-gray-900">Conversation</h4>
        <span className="text-xs text-gray-400">
          Updates automatically
        </span>
      </div>

      <div
        ref={containerRef}
        className="max-h-96 space-y-4 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400">Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((message) => {
            const isInternal = message.internal;
            const isAdmin = message.sender_type === 'admin';
            const isCustomer = message.sender_type === 'customer';

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isAdmin && !isInternal ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isInternal
                        ? 'bg-purple-100'
                        : isAdmin
                          ? 'bg-blue-100'
                          : isCustomer
                            ? 'bg-gray-100'
                            : 'bg-gray-200'
                    }`}
                  >
                    {getSenderIcon(message.sender_type, isInternal)}
                  </div>
                </div>
                <div className={`flex-1 ${isAdmin && !isInternal ? 'items-end text-right' : ''}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      isInternal
                        ? 'bg-purple-50 border border-purple-200'
                        : isAdmin
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          isInternal
                            ? 'text-purple-700'
                            : isAdmin
                              ? 'text-blue-700'
                              : 'text-gray-700'
                        }`}
                      >
                        {getSenderLabel(message.sender_type, isInternal)}
                      </span>
                      <span className="text-xs text-gray-500">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-900">
                      {message.message_text}
                    </p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:text-blue-800"
                          >
                            📎 {attachment.fileName}
                            {attachment.size && ` (${(attachment.size / 1024).toFixed(1)} KB)`}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
