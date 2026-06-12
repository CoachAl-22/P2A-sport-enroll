import { useState } from 'react';
import { useLocation } from 'wouter';

const AGE_RANGE = Array.from({ length: 13 }, (_, i) => i + 5);

type AgeGroup = 'foundation' | 'emerging' | 'academy';

function getAgeGroup(age: number): AgeGroup {
  if (age <= 8) return 'foundation';
  if (age <= 12) return 'emerging';
  return 'academy';
}

const GOALS: Record<AgeGroup, { label: string; sportType: string }[]> = {
  foundation: [
    { label: 'Build movement skills & confidence', sportType: 'foundation_prep_year2' },
  ],
  emerging: [
    { label: 'Athletics, running & movement skills', sportType: 'emerging_year3_6' },
    { label: 'Get faster for my team sport (AFL, soccer, basketball…)', sportType: 'team_sport_speed' },
  ],
  academy: [
    { label: 'Athletics & track training', sportType: 'academy_year7_above' },
    { label: 'Get faster for my team sport (AFL, soccer, basketball…)', sportType: 'team_sport_speed' },
    { label: 'Train at a competitive / elite level', sportType: 'senior_squad' },
  ],
};

const AGE_GROUP_LABEL: Record<AgeGroup, string> = {
  foundation: 'Prep – Year 2',
  emerging: 'Year 3 – 6',
  academy: 'Year 7+',
};

interface Props {
  onClose: () => void;
}

export function ProgramQuiz({ onClose }: Props) {
  const [step, setStep] = useState<'age' | 'goal'>('age');
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  const ageGroup = selectedAge ? getAgeGroup(selectedAge) : null;
  const goals = ageGroup ? GOALS[ageGroup] : [];

  function handleAgeSelect(age: number) {
    setSelectedAge(age);
    const group = getAgeGroup(age);
    if (GOALS[group].length === 1) {
      setLocation(`/classes?sportType=${GOALS[group][0].sportType}`);
      onClose();
    } else {
      setStep('goal');
    }
  }

  function handleGoalSelect(sportType: string) {
    setLocation(`/classes?sportType=${sportType}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1">
            <div className={`h-1.5 w-8 rounded-full ${step === 'age' ? 'bg-blue-600' : 'bg-blue-200'}`} />
            <div className={`h-1.5 w-8 rounded-full ${step === 'goal' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {step === 'age' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">How old is your child?</h2>
            <p className="text-sm text-gray-500 mb-6">We'll find the right program for their age group.</p>
            <div className="grid grid-cols-5 gap-2">
              {AGE_RANGE.map((age) => (
                <button
                  key={age}
                  onClick={() => handleAgeSelect(age)}
                  className="h-12 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 hover:border-blue-600 hover:text-blue-600 active:bg-blue-50 transition-all"
                >
                  {age}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'goal' && ageGroup && (
          <>
            <button
              onClick={() => setStep('age')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              What's their main goal?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Age {selectedAge} · {AGE_GROUP_LABEL[ageGroup]}
            </p>
            <div className="flex flex-col gap-3">
              {goals.map((goal) => (
                <button
                  key={goal.sportType}
                  onClick={() => handleGoalSelect(goal.sportType)}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 font-medium text-gray-700 hover:border-blue-600 hover:text-blue-600 active:bg-blue-50 transition-all"
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </>
        )}

        <a
          href="/classes"
          className="block text-center text-sm text-gray-400 underline underline-offset-2 mt-6 hover:text-gray-600"
          onClick={onClose}
        >
          Browse all classes instead
        </a>
      </div>
    </div>
  );
}
