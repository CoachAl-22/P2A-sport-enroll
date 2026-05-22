import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

interface ChildFormProps {
  onCreated: (childId: string, firstName: string, lastName: string) => void;
}

export default function ChildForm({ onCreated }: ChildFormProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    grade: '',
    medicalInfo: '',
    emergencyContact: '',
  });
  const [showExtras, setShowExtras] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.firstName || !form.lastName || !form.dateOfBirth) {
        throw new Error('First name, last name, and date of birth are required');
      }
      const res = await apiRequest("POST", "/api/children", {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        grade: form.grade || undefined,
        medicalInfo: form.medicalInfo || undefined,
        emergencyContact: form.emergencyContact || undefined,
      });
      return res.json();
    },
    onSuccess: (child) => {
      onCreated(child.id, form.firstName, form.lastName);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [name]: e.target.value })),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">First name *</label>
          <input {...field('firstName')} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Last name *</label>
          <input {...field('lastName')} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Date of birth *</label>
        <input type="date" {...field('dateOfBirth')} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">School grade</label>
        <select {...field('grade')} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Select grade</option>
          {['Prep','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
            'Year 7','Year 8','Year 9','Year 10','Year 11','Year 12'].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowExtras(!showExtras)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <span>{showExtras ? '-' : '+'}</span>
        Medical notes & emergency contact
      </button>

      {showExtras && (
        <div className="flex flex-col gap-4 pl-4 border-l-2 border-gray-100">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Medical notes</label>
            <textarea
              value={form.medicalInfo}
              onChange={(e) => setForm(prev => ({ ...prev, medicalInfo: e.target.value }))}
              rows={3}
              placeholder="Any injuries, conditions, or allergies"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Emergency contact</label>
            <input
              type="tel"
              {...field('emergencyContact')}
              placeholder="Name and phone number"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      )}

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 mt-2 h-auto"
      >
        {mutation.isPending ? 'Saving...' : 'Continue'}
      </Button>
    </div>
  );
}
