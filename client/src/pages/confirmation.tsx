import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Navbar from '@/components/layout/navbar';

const WHAT_TO_BRING = [
  'Athletic shoes (no spikes required)',
  'Water bottle',
  'Weather-appropriate clothing',
];

function generateIcs(cls: any, child: any): string {
  const sessions: string[] = [];
  const start = new Date(cls.startDate);

  for (let i = 0; i < 10; i++) {
    const sessionDate = new Date(start);
    sessionDate.setDate(start.getDate() + i * 7);

    const dateStr = sessionDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const [startHour, startMin] = cls.startTime.split(':');
    const [endHour, endMin] = cls.endTime.split(':');

    sessions.push([
      'BEGIN:VEVENT',
      `DTSTART:${dateStr.substring(0, 8)}T${startHour}${startMin}00`,
      `DTEND:${dateStr.substring(0, 8)}T${endHour}${endMin}00`,
      `SUMMARY:${cls.name} — ${child.firstName}`,
      `LOCATION:${cls.venue?.name ?? ''}`,
      'END:VEVENT',
    ].join('\r\n'));
  }

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', ...sessions, 'END:VCALENDAR'].join('\r\n');
}

function downloadIcs(cls: any, child: any) {
  const ics = generateIcs(cls, child);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cls.name.replace(/\s+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

const getDayName = (dayOfWeek: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] ?? '';
};

export default function ConfirmationPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const enrollmentId = params.get('enrollmentId');

  const { data: fullEnrollment, isLoading } = useQuery({
    queryKey: ['/api/enrollments', enrollmentId],
    queryFn: () => fetch(`/api/enrollments/${enrollmentId}`).then(r => r.json()),
    enabled: !!enrollmentId,
  });

  const enrollment = fullEnrollment?.enrollment;
  const cls = fullEnrollment?.class;
  const child = fullEnrollment?.child;
  const venue = fullEnrollment?.venue;
  const payment = fullEnrollment?.payment;

  if (isLoading || !fullEnrollment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="px-4 py-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">You're all set!</h1>
          <p className="text-gray-500 mt-1">
            {child?.firstName} is enrolled in {cls?.name}.
          </p>
        </div>

        <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
          <div className="bg-gray-50 px-5 py-4 flex flex-col gap-3 text-sm">
            <div className="flex gap-3">
              <span className="text-lg">📅</span>
              <div>
                <div className="font-medium text-gray-900">
                  {cls ? `${getDayName(cls.dayOfWeek)}s, ${cls.startTime}–${cls.endTime}` : '—'}
                </div>
                {cls?.startDate && (
                  <div className="text-gray-500">
                    Starting {new Date(cls.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">📍</span>
              <div>
                <div className="font-medium text-gray-900">{venue?.name ?? cls?.venue?.name ?? '—'}</div>
                <div className="text-gray-500">{venue?.address ?? cls?.venue?.address ?? ''}</div>
              </div>
            </div>
            {payment && (
              <div className="flex gap-3">
                <span className="text-lg">💰</span>
                <div>
                  <div className="font-medium text-gray-900">
                    ${parseFloat(payment.amount || '0').toLocaleString('en-AU')} AUD — paid
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4">
            <div className="text-sm font-medium text-gray-700 mb-2">What to bring</div>
            {WHAT_TO_BRING.map(item => (
              <div key={item} className="flex gap-2 text-sm text-gray-600 mb-1">
                <span className="text-green-500">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {cls && child && (
          <button
            onClick={() => downloadIcs(cls, child)}
            className="w-full border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:border-gray-400 transition-colors mb-3"
          >
            + Add to calendar
          </button>
        )}

        <a
          href="/classes"
          className="block w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-center hover:bg-blue-700 mb-4"
        >
          Enrol another child
        </a>

        <p className="text-xs text-center text-gray-400">
          💡 Did you know? Families enrolling multiple children receive a sibling discount — automatically applied at checkout.
        </p>
      </div>
    </div>
  );
}
