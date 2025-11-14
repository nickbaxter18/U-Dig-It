import clsx from 'clsx';

type CompletionSteps = {
  contract_signed: boolean;
  insurance_uploaded: boolean;
  license_uploaded: boolean;
  payment_completed: boolean;
  deposit_paid: boolean;
};

type BookingOverviewStripProps = {
  bookingNumber: string;
  bookingStatus: string;
  equipmentLabel?: string | null;
  locationLabel?: string | null;
  totalSteps: number;
  completedSteps: number;
  completionSteps: CompletionSteps;
};

const STEP_CONTENT: Array<{
  key: keyof CompletionSteps;
  label: string;
  helper: string;
  icon: string;
}> = [
  {
    key: 'contract_signed',
    label: 'Rental Agreement',
    helper: 'Signed electronically',
    icon: '📝',
  },
  {
    key: 'insurance_uploaded',
    label: 'Insurance',
    helper: 'Certificate uploaded',
    icon: '🛡️',
  },
  {
    key: 'license_uploaded',
    label: 'ID Verification',
    helper: 'Licence + selfie verified',
    icon: '🪪',
  },
  {
    key: 'payment_completed',
    label: 'Invoice',
    helper: 'Rental invoice paid',
    icon: '💳',
  },
  {
    key: 'deposit_paid',
    label: 'Security Hold',
    helper: 'Card on file & hold placed',
    icon: '🔒',
  },
];

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 ring-green-200',
  paid: 'bg-blue-100 text-blue-800 ring-blue-200',
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  cancelled: 'bg-red-100 text-red-800 ring-red-200',
};

export default function BookingOverviewStrip({
  bookingNumber,
  bookingStatus,
  equipmentLabel,
  locationLabel,
  totalSteps,
  completedSteps,
  completionSteps,
}: BookingOverviewStripProps) {
  const normalizedStatus = bookingStatus?.toLowerCase() ?? 'pending';
  const statusStyles =
    STATUS_STYLES[normalizedStatus] ?? 'bg-gray-100 text-gray-800 ring-gray-200';
  const remainingSteps = Math.max(totalSteps - completedSteps, 0);

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Booking #{bookingNumber}</span>
            {equipmentLabel ? (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                {equipmentLabel}
              </span>
            ) : null}
            {locationLabel ? (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                {locationLabel}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ring-1',
                statusStyles
              )}
            >
              {bookingStatus.replace('_', ' ').toUpperCase()}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-medium text-gray-900">{completedSteps}</span>
              <span>of</span>
              <span className="font-medium text-gray-900">{totalSteps}</span>
              <span>steps complete</span>
              {remainingSteps > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {remainingSteps} remaining
                </span>
              ) : (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  All steps complete
                </span>
              )}
            </div>
          </div>
          <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <span
              className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-[#E1BC56] to-[#A47A1E] transition-all"
              style={{ width: `${(completedSteps / Math.max(totalSteps, 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STEP_CONTENT.map(({ key, label, helper, icon }) => {
          const isComplete = completionSteps[key];
          return (
            <div
              key={key}
              className={clsx(
                'rounded-xl border px-4 py-3 transition',
                isComplete
                  ? 'border-green-100 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-lg" role="img" aria-hidden>
                  {icon}
                </span>
                <span
                  className={clsx(
                    'rounded-full px-2 py-1 text-xs font-semibold',
                    isComplete
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  )}
                >
                  {isComplete ? 'Completed' : 'Action Needed'}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">{label}</p>
              <p className="mt-1 text-xs text-gray-600">{helper}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}







