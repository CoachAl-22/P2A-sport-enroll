import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Calendar, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactFormModal({ isOpen, onClose }: ContactFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    contactMethod: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent Successfully!",
        description: "We'll get back to you within 24 hours to schedule your consultation.",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        contactMethod: "",
        subject: "",
        message: ""
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Preferred Contact Method */}
          <div className="space-y-2">
            <Label htmlFor="contactMethod">Preferred Contact Method *</Label>
            <Select value={formData.contactMethod} onValueChange={(value) => handleInputChange("contactMethod", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select preferred contact method" />
              </SelectTrigger>
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
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select value={formData.subject} onValueChange={(value) => handleInputChange("subject", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select consultation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high-performance">High Performance Consultation</SelectItem>
                <SelectItem value="senior-squad">Senior Squad Application</SelectItem>
                <SelectItem value="youth-programs">Youth Programs</SelectItem>
                <SelectItem value="coaching-services">Coaching Services</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              placeholder="Tell us about your athletic goals, experience level, and what you'd like to discuss..."
              rows={4}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.email || !formData.contactMethod || !formData.subject || !formData.message}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
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

        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-500 text-center">
            We typically respond within 24 hours. For urgent inquiries, please call directly.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}