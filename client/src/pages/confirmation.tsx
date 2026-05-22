import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";

const getDayName = (dayOfWeek: number) => {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];
};

interface ClassInfo {
  name: string;
  startDate: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  pricePerTerm: string;
  term: string;
  year: number;
}

interface VenueInfo {
  name?: string;
  address?: string;
}

const formatTerm = (term: string | undefined, year: number) => {
  return `${term?.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}, ${year} (10 weeks)`;
};

const generateIcs = (cls: ClassInfo, venue: VenueInfo | null | undefined) => {
  const startDate = new Date(cls.startDate);
  const [startHour, startMin] = cls.startTime.split(':').map(Number);
  const [endHour, endMin] = cls.endTime.split(':').map(Number);

  const pad = (n: number) => String(n).padStart(2, '0');

  const formatDate = (d: Date, hour: number, min: number) => {
    const y = d.getFullYear();
    const mo = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}${mo}${day}T${pad(hour)}${pad(min)}00`;
  };

  const location = [venue?.name, venue?.address].filter(Boolean).join(', ');

  const events = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 7);
    const dtStart = formatDate(d, startHour, startMin);
    const dtEnd = formatDate(d, endHour, endMin);
    return [
      'BEGIN:VEVENT',
      `SUMMARY:${cls.name}`,
      `DTSTART;TZID=Australia/Melbourne:${dtStart}`,
      `DTEND;TZID=Australia/Melbourne:${dtEnd}`,
      location ? `LOCATION:${location}` : '',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Power2ADAPT//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
};

const downloadIcs = (cls: ClassInfo, venue: VenueInfo | null | undefined) => {
  const ics = generateIcs(cls, venue);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'p2a-class.ics';
  a.click();
  URL.revokeObjectURL(url);
};

export default function Confirmation() {
  const [location] = useLocation();
  const enrollmentId = new URLSearchParams(location.split('?')[1] || '').get('enrollmentId');

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/enrollments", enrollmentId],
    queryFn: async () => {
      const res = await fetch(`/api/enrollments/${enrollmentId}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!enrollmentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (isError || !data || !enrollmentId) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-12 text-center text-gray-500">
          <p className="mb-4">Booking not found.</p>
          <Link href="/classes" className="text-blue-600 underline">Browse classes</Link>
        </div>
      </div>
    );
  }

  const { enrollment, class: cls, venue, child } = data;
  const siblingDiscountApplied = enrollment?.siblingDiscountApplied ?? false;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Success header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">You're all booked in!</h2>
          <p className="text-gray-500 text-sm">Check your email for confirmation details.</p>
        </div>

        {/* Booking summary */}
        <div className="bg-gray-50 rounded-2xl p-5 flex flex-col gap-3 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Child</span>
            <span className="font-medium text-gray-900">{child?.firstName} {child?.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Class</span>
            <span className="font-medium text-gray-900">{cls?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">When</span>
            <span className="font-medium text-gray-900">
              {cls && `${getDayName(cls.dayOfWeek)}s, ${cls.startTime}–${cls.endTime}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Venue</span>
            <span className="font-medium text-gray-900">{venue?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Term</span>
            <span className="font-medium text-gray-900">{cls && formatTerm(cls.term, cls.year)}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-gray-500">Amount paid</span>
            <div className="text-right">
              {siblingDiscountApplied ? (
                <>
                  <span className="line-through text-gray-400 mr-2">${parseFloat(cls?.pricePerTerm ?? '0').toLocaleString('en-AU')}</span>
                  <span className="font-medium text-gray-900">${(Math.round(parseFloat(cls?.pricePerTerm ?? '0') * 0.8 * 100) / 100).toLocaleString('en-AU')} AUD</span>
                  <div className="text-xs text-green-600 mt-0.5">20% sibling discount applied</div>
                </>
              ) : (
                <span className="font-medium text-gray-900">${parseFloat(cls?.pricePerTerm ?? '0').toLocaleString('en-AU')} AUD</span>
              )}
            </div>
          </div>
        </div>

        {/* What to bring */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
          <p className="font-semibold text-gray-900 mb-2">What to bring</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Comfortable athletic clothing</li>
            <li>Water bottle</li>
            <li>Runners/athletic shoes</li>
            <li>Positive attitude!</li>
          </ul>
        </div>

        {/* Add to calendar */}
        <button
          onClick={() => downloadIcs(cls, venue)}
          className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 mb-3"
        >
          + Add to calendar
        </button>

        {/* Sibling discount tip (only when NOT already applied) */}
        {!siblingDiscountApplied && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
            Enrolling a sibling? You'll get 20% off their term fee automatically.
          </div>
        )}

        {/* Enrol another child */}
        <Link
          href="/classes"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 text-center block"
        >
          Enrol another child
        </Link>
      </div>
    </div>
  );
}
