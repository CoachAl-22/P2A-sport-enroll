export const DISCOVERY_CALL_URL = "https://power2adapt.setmore.com/book?step=time-slot&products=a9a6a66a-9c61-4bec-829a-84d78687c2c0&type=service&staff=radec66996c3d8174cc26c451adc8c9832fdac5b7&staffSelected=true";
export const EMAIL_ENQUIRY_URL = "mailto:info@power2adapt.com?" + new URLSearchParams({
  subject: "Coaching enquiry",
  body: "My mobile number: \nBest time to call: \nAthlete and goals: ",
}).toString().replace(/\+/g, "%20");

// Keep callback preferences in the existing message field so every downstream
// storage and notification consumer receives them without a schema migration.
export function withCallbackDetails(message: string, bestTime: string): string {
  const preference = bestTime.trim();
  return preference ? [`Best time to call: ${preference}`, message].filter(Boolean).join("\n\n") : message;
}
