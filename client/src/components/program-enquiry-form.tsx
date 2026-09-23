import { useState, type FormEvent } from "react";

const fieldClass =
  "mt-1 block w-full rounded-lg border border-[#d9d3ca] bg-white px-3 py-2 text-[#2e2600] focus:border-[#0a6b66] focus:outline-none focus:ring-2 focus:ring-[#0a6b66]/20";

export function ProgramEnquiryForm() {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    const form = event.currentTarget;
    try {
      const body = new URLSearchParams();
      new FormData(form).forEach((value, key) => {
        if (typeof value === "string") body.append(key, value);
      });
      const response = await fetch("/api/programs/enquiry", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        throw new Error(result.message || "Enquiry could not be sent. Please try again.");
      }
      setSubmitted(true);
      try {
        (window as Window & { umami?: { track(name: string): void } }).umami?.track("program_enquiry_submitted");
      } catch { /* Analytics is optional. */ }
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enquiry could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="p2a-enquiry" aria-labelledby="enquiry-heading" className="mt-10 rounded-xl border border-[#e7e1d8] bg-white p-6">
      <h2 id="enquiry-heading" className="mb-1 text-2xl font-black text-[#2e2600]">Find the right class for your athlete</h2>
      <p className="mb-5 text-[#525759]">Five quick questions. Coach Al will be in touch within 24 hours.</p>
      {submitted ? (
        <p role="status" className="rounded-lg bg-[#e8f5f0] p-4 font-bold text-[#0a6b66]">
          Thanks! Coach Al will be in touch within 24 hours.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#2e2600]">Your name *
              <input name="parent_name" required maxLength={120} autoComplete="name" className={fieldClass} />
            </label>
            <label className="text-sm font-semibold text-[#2e2600]">Email *
              <input name="email" type="email" required maxLength={254} autoComplete="email" className={fieldClass} />
            </label>
            <label className="text-sm font-semibold text-[#2e2600]">Mobile
              <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={fieldClass} />
            </label>
            <label className="text-sm font-semibold text-[#2e2600]">Athlete's first name
              <input name="child_name" maxLength={120} className={fieldClass} />
            </label>
          </div>
          <label className="block text-sm font-semibold text-[#2e2600]">1. School year *
            <select name="school_year" required defaultValue="" className={fieldClass}>
              <option value="" disabled>Choose...</option>
              <option value="prep-2">Prep to Grade 2</option>
              <option value="3-6">Grade 3 to 6</option>
              <option value="7-9">Year 7 to 9</option>
              <option value="10-12">Year 10 to 12</option>
              <option value="adult">Adult</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#2e2600]">2. Where suits you? *
            <select name="venue" required defaultValue="" className={fieldClass}>
              <option value="" disabled>Choose...</option>
              <option value="peninsula">Peninsula Grammar (students)</option>
              <option value="toorak">Toorak College (students)</option>
              <option value="frankston">Frankston / Ballam Park</option>
              <option value="mornington">Mornington</option>
              <option value="other">Somewhere else</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#2e2600]">3. What's the main goal? *
            <select name="goal" required defaultValue="" className={fieldClass}>
              <option value="" disabled>Choose...</option>
              <option value="speed">Get faster for their sport</option>
              <option value="technique">Fix their running action (arms, heels, stiff legs)</option>
              <option value="development">All-round athletic development</option>
              <option value="injury">Coming back from injury (e.g. ACL)</option>
              <option value="performance">Compete at a higher level</option>
            </select>
          </label>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[#2e2600]">4. Which afternoons work?</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                <label key={day} className="flex items-center gap-2 text-sm text-[#2e2600]">
                  <input type="checkbox" name="days" value={day} className="accent-[#0a6b66]" />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold text-[#2e2600]">5. Main sport
            <input name="sport" maxLength={120} placeholder="e.g. AFL, netball, athletics" className={fieldClass} />
          </label>
          <label className="block text-sm font-semibold text-[#2e2600]">Anything else?
            <textarea name="message" rows={3} maxLength={2000} className={fieldClass} />
          </label>
          {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={sending} className="rounded-full bg-[#f6930e] px-8 py-3 font-bold text-[#2e2600] hover:opacity-90 disabled:opacity-50">
            {sending ? "Sending..." : "Send enquiry"}
          </button>
        </form>
      )}
    </section>
  );
}