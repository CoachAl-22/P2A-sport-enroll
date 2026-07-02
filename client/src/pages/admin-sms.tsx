import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/layout/navbar";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Users, Clock, Send } from "lucide-react";

export default function AdminSMS() {
  const [messageType, setMessageType] = useState("single");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [classId, setClassId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch classes for reminder selection
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["/api/classes"],
  });

  // Send single SMS mutation
  const sendSMSMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      const response = await apiRequest("POST", "/api/admin/send-sms", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMS Sent Successfully!",
        description: "Your message has been delivered.",
      });
      setPhoneNumber("");
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send SMS",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Send class reminders mutation
  const sendRemindersMutation = useMutation({
    mutationFn: async (data: { classId: string }) => {
      const response = await apiRequest("POST", "/api/admin/send-class-reminders", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminders Sent Successfully!",
        description: `${data.successCount} reminders sent to parents.`,
      });
      setClassId("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Reminders",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !message) {
      toast({
        title: "Missing Information",
        description: "Please provide both phone number and message",
        variant: "destructive",
      });
      return;
    }
    
    sendSMSMutation.mutate({ phoneNumber, message });
  };

  const handleSendReminders = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) {
      toast({
        title: "Missing Information",
        description: "Please select a class for reminders",
        variant: "destructive",
      });
      return;
    }
    
    sendRemindersMutation.mutate({ classId });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">SMS Notifications</h1>
          <p className="text-gray-600">Send text messages to parents and manage class reminders</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Single SMS Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-500" />
                Send Individual SMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendSMS} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Parent's Mobile Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g., 0412345678 or +61412345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {message.length}/160 characters
                  </p>
                </div>
                <Button 
                  type="submit" 
                  disabled={sendSMSMutation.isPending}
                  className="w-full"
                >
                  {sendSMSMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send SMS
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Class Reminders Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary-500" />
                Send Class Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendReminders} className="space-y-4">
                <div>
                  <Label htmlFor="class">Select Class</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.venue?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    This will send reminder messages to all parents with active enrollments in the selected class for tomorrow's session.
                  </p>
                </div>
                <Button 
                  type="submit" 
                  disabled={sendRemindersMutation.isPending}
                  className="w-full"
                  variant="secondary"
                >
                  {sendRemindersMutation.isPending ? (
                    "Sending Reminders..."
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Send Class Reminders
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* SMS Templates Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Message Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => setMessage("Hi! Just a reminder that class is tomorrow at 4:00 PM. Please bring water bottle and comfortable clothes. See you there!")}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium">Class Reminder</div>
                  <div className="text-sm text-gray-500">Standard reminder template</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setMessage("Great news! Term 4 enrollment is now open. Secure your child's spot early for continued athletic development!")}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium">Enrollment Open</div>
                  <div className="text-sm text-gray-500">New term enrollment</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setMessage("Important update: Today's class has been cancelled due to weather conditions. We'll notify you about makeup classes soon.")}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium">Class Cancellation</div>
                  <div className="text-sm text-gray-500">Weather/emergency notice</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setMessage("Welcome to Power2ADAPT! We're excited to have your child join our athletic community. Their sporting journey starts here!")}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium">Welcome Message</div>
                  <div className="text-sm text-gray-500">New family welcome</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
