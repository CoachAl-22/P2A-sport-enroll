import { useState } from 'react';
import { useLocation } from 'wouter';

const AGE_RANGE = Array.from({ length: 13 }, (_, i) => i + 5); // 5–17

const GOALS = [
  {
    label: 'Run faster and improve sprint speed',
    sportTypes: ['sprints', 'athletics'],
  },
  {
    label: 'Learn athletics events (jumps, throws)',
    sportTypes: ['jumps', 'throws', 'multi_event'],
  },
  {
    label: 'Build fitness, confidence, and movement skills',
    sportTypes: ['general_fitness', 'athletics'],
  },
  {
    label: 'I play a team sport and want to be faster',
    sportTypes: ['team_sport_speed'],
  },
  {
    label: 'Train at a competitive level',
    sportTypes: ['athletics', 'multi_event', 'cross_country'],
  },
] as const;

interface Props {
  onClose: () => void;
}

export function ProgramQuiz({ onClose }: Props) {
  const [step, setStep] = useState<'age' | 'goal'>('age');
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  function handleGoalSelect(sportTypes: readonly string[]) {
    if (selectedAge === null) return;
    const params = new URLSearchParams({
      age: String(selectedAge),
      sportTypes: sportTypes.join(','),
    });
    setLocation(`/classes?${params.toString()}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1">
            <div className="h-1.5 w-8 rounded-full bg-blue-600" />
            <div className={`h-1.5 w-8 rounded-full ${step === 'goal' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &#x2715;
          </button>
        </div>

        {step === 'age' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">How old is your child?</h2>
            <p className="text-sm text-gray-500 mb-6">We'll find classes that suit their age group.</p>
            <div className="grid grid-cols-5 gap-2">
              {AGE_RANGE.map((age) => (
                <button
                  key={age}
                  onClick={() => { setSelectedAge(age); setStep('goal'); }}
                  className="h-12 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 hover:border-blue-600 hover:text-blue-600 active:bg-blue-50 transition-all"
                >
                  {age}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'goal' && (
          <>
            <button
              onClick={() => setStep('age')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
            >
              &larr; Back
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              What are they looking to improve?
            </h2>
            <p className="text-sm text-gray-500 mb-6">Age {selectedAge} selected.</p>
            <div className="flex flex-col gap-3">
              {GOALS.map((goal) => (
                <button
                  key={goal.label}
                  onClick={() => handleGoalSelect(goal.sportTypes)}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 font-medium text-gray-700 hover:border-blue-600 hover:text-blue-600 active:bg-blue-50 transition-all"
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          className="block w-full text-center text-sm text-gray-400 underline underline-offset-2 mt-6 hover:text-gray-600"
          onClick={() => { setLocation('/classes'); onClose(); }}
        >
          Browse all classes instead
        </button>
      </div>
    </div>
  );
}
