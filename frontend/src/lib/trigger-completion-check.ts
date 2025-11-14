'use client';

interface CompletionResponse {
  success: boolean;
  wasCompleted: boolean;
  bookingNumber?: string;
  error?: string;
}

export async function triggerCompletionCheck(
  bookingId: string,
  stepCompleted: string
): Promise<CompletionResponse> {
  const response = await fetch(`/api/bookings/${bookingId}/check-completion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ stepCompleted }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorBody.error || 'Failed to trigger completion check');
  }

  return response.json();
}
