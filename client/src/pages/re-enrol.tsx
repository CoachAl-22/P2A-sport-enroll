import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Navbar from '@/components/layout/navbar';

export default function ReEnrol() {
  const [, setLocation] = useLocation();

  const { data: children = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/children'],
  });

  useEffect(() => {
    if (!isLoading && children.length === 0) {
      setLocation('/classes');
    }
  }, [isLoading, children.length, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return null;
  }

  const getAge = (dob: string) =>
    new Date().getFullYear() - new Date(dob).getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back!</h1>
        <p className="text-gray-500 mb-8">Who are you enrolling this term?</p>

        <div className="flex flex-col gap-3">
          {children.map((child: any) => (
            <button
              key={child.id}
              onClick={() => setLocation(`/classes?age=${getAge(child.dateOfBirth)}`)}
              className="w-full flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-600 text-left transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg shrink-0">
                {child.firstName[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {child.firstName} {child.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  Age {getAge(child.dateOfBirth)}{child.grade ? ` · ${child.grade}` : ''}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}

          <button
            onClick={() => setLocation('/classes')}
            className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">+</div>
            <span className="font-medium">Add a new child</span>
          </button>
        </div>
      </div>
    </div>
  );
}
