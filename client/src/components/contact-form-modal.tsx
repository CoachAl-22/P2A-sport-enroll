import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Calendar, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertContactEnquirySchema } from "@shared/schema";

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Australian phone number regex - supports mobile (04XX XXX XXX) and landline formats
const australianPhoneRegex = /^(?:\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;

// Add phone validation refinements to the base schema
const contactFormSchema = insertContactEnquirySchema
  .refine(
    (data) => {
      // If subject is performance-assessment, require performanceTestType and assessmentType
      if (data.subject === "performance-assessment") {
        return !!data.performanceTestType && !!data.assessmentType;
      }
      return true;
    },
    {
      message: "Performance test type and assessment type are required for performance assessments",
      path: ["performanceTestType"],
    }
  )
  .refine(
    (data) => {
      // If phone is provided, it must be a valid Australian number
      if (data.phone && data.phone.trim() !== "") {
        // Remove spaces and dashes for validation
        const cleanPhone = data.phone.replace(/[\s-]/g, "");
        return australianPhoneRegex.test(cleanPhone);
      }
      return true;
    },
    {
      message: "Please enter a valid Australian phone number (e.g., 0412 345 678 or +61 412 345 678)",
      path: ["phone"],
    }
  )
  .refine(
    (data) => {
      // If contact method is phone or video, phone number is required
      if (data.contactMethod === "phone" || data.contactMethod === "video") {
        return !!data.phone && data.phone.trim() !== "";
      }
      return true;
    },
    {
      message: "Phone number is required when requesting a phone call or video call",
      path: ["phone"],
    }
  );

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactFormModal({ isOpen, onClose }: ContactFormModalProps) {
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      contactMethod: "phone",
      subject: "",
      performanceTestType: "",
      assessmentType: "",
      message: "",
    },
  });

  const selectedSubject = form.watch("subject");
  const selectedContactMethod = form.watch("contactMethod");

  const handleSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch('/api/contact-enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit enquiry');
      }

      toast({
        title: "Message Sent Successfully!",
        description: "We've received your enquiry and will get back to you within 24 hours. Check your SMS for confirmation.",
      });

      form.reset();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-heading font-bold text-gray-900">
              Book a Call / Send Email
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Get in touch to discuss your athletic goals and schedule a consultation
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      data-testid="input-contact-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email address"
                      data-testid="input-contact-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone Number{(selectedContactMethod === "phone" || selectedContactMethod === "video") && " *"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      type="tel"
                      placeholder="e.g. 0412 345 678 or +61 412 345 678"
                      data-testid="input-contact-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Contact Method */}
            <FormField
              control={form.control}
              name="contactMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Contact Method *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-contact-method">
                        <SelectValue placeholder="Select preferred contact method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="phone">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          Phone Call
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Video Call
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-contact-subject">
                        <SelectValue placeholder="Select consultation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="performance-assessment">Performance Assessment</SelectItem>
                      <SelectItem value="high-performance">High Performance Consultation</SelectItem>
                      <SelectItem value="senior-squad">Senior Squad Application</SelectItem>
                      <SelectItem value="youth-programs">Youth Programs</SelectItem>
                      <SelectItem value="coaching-services">Coaching Services</SelectItem>
                      <SelectItem value="general-enquiry">General Enquiry</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Performance Test Type - Only show if Performance Assessment is selected */}
            {selectedSubject === "performance-assessment" && (
              <FormField
                control={form.control}
                name="performanceTestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What type of performance test are you interested in? *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select performance test type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="speed">Speed</SelectItem>
                        <SelectItem value="power">Power</SelectItem>
                        <SelectItem value="agility">Agility</SelectItem>
                        <SelectItem value="sport-specific">Sport Specific</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Assessment Type - Only show if Performance Assessment is selected */}
            {selectedSubject === "performance-assessment" && (
              <FormField
                control={form.control}
                name="assessmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Individual or Team Assessment? *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assessment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual Assessment</SelectItem>
                        <SelectItem value="team">Team Assessment (Minimum 20 athletes)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about your athletic goals, experience level, and what you'd like to discuss..."
                      rows={4}
                      data-testid="input-contact-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                data-testid="button-submit-contact"
              >
                {form.formState.isSubmitting ? "Sending..." : "Send Message"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>

        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-500 text-center">
            We typically respond within 24 hours. For urgent inquiries, please call directly.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
