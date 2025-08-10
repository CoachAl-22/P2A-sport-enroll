import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  recommendations?: ClassRecommendation[];
}

interface ClassRecommendation {
  id: string;
  name: string;
  program: string;
  venue: string;
  day: string;
  time: string;
  ageRange: string;
  price: number;
  spots: number;
}

interface OneClickChatProps {
  onEnrollClick?: (classId: string) => void;
}

export default function OneClickChat({ onEnrollClick }: OneClickChatProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'collecting' | 'recommendations'>('welcome');
  const [childAge, setChildAge] = useState<string>("");
  const [childName, setChildName] = useState<string>("");
  const [interests, setInterests] = useState<string>("");
  const [availability, setAvailability] = useState<string>("");

  const { data: classes = [] } = useQuery({
    queryKey: ["/api/classes"],
  });

  const startChat = () => {
    setIsChatOpen(true);
    setMessages([{
      id: "welcome",
      text: "Hi! I'm here to help you find the perfect athletic program for your child. What's your child's name?",
      isBot: true,
      timestamp: new Date()
    }]);
    setCurrentStep('collecting');
  };

  const sendMessage = (text: string, isBot: boolean = false, recommendations?: ClassRecommendation[]) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date(),
      recommendations
    };
    setMessages(prev => [...prev, message]);
  };

  const handleNameSubmit = () => {
    if (!childName.trim()) return;
    
    sendMessage(`My child's name is ${childName}`);
    setTimeout(() => {
      sendMessage(`Great! How old is ${childName}?`, true);
    }, 500);
  };

  const handleAgeSubmit = () => {
    if (!childAge) return;
    
    sendMessage(`${childName} is ${childAge} years old`);
    setTimeout(() => {
      sendMessage(`Perfect! What sports or activities is ${childName} most interested in?`, true);
    }, 500);
  };

  const handleInterestsSubmit = () => {
    if (!interests.trim()) return;
    
    sendMessage(`${childName} is interested in ${interests}`);
    setTimeout(() => {
      sendMessage("When would work best for classes?", true);
    }, 500);
  };

  const handleAvailabilitySubmit = () => {
    if (!availability) return;
    
    sendMessage(`We prefer ${availability} classes`);
    
    // Generate recommendations based on inputs
    setTimeout(() => {
      const recommendations = generateRecommendations();
      sendMessage(
        `Perfect! Based on ${childName}'s age (${childAge}), interests (${interests}), and availability (${availability}), here are my top recommendations:`, 
        true, 
        recommendations
      );
      setCurrentStep('recommendations');
    }, 1000);
  };

  const generateRecommendations = (): ClassRecommendation[] => {
    const age = parseInt(childAge);
    const filteredClasses = (classes as any[]).filter((cls: any) => {
      return age >= cls.minAge && age <= cls.maxAge;
    });

    return filteredClasses.slice(0, 3).map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      program: cls.program,
      venue: cls.venue?.name || "TBA",
      day: cls.dayOfWeek,
      time: cls.startTime,
      ageRange: `${cls.minAge}-${cls.maxAge} years`,
      price: cls.termPrice,
      spots: cls.maxCapacity - (cls.enrollments?.length || 0)
    }));
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentStep('welcome');
    setChildAge("");
    setChildName("");
    setInterests("");
    setAvailability("");
    startChat();
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={startChat}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-lg hover:shadow-xl transition-all duration-300"
          size="icon"
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </Button>
        
        {/* Pulsing indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
          Get personalized class recommendations
        </div>
      </motion.div>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-md w-full h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <DialogTitle>Class Finder Assistant</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'bg-primary-500 text-white'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    
                    {/* Recommendations */}
                    {message.recommendations && (
                      <div className="mt-3 space-y-2">
                        {message.recommendations.map((rec) => (
                          <Card key={rec.id} className="border-0 shadow-sm">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-sm">{rec.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {rec.program}
                                  </Badge>
                                </div>
                                <span className="text-sm font-bold text-primary-600">
                                  ${rec.price}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <p>📍 {rec.venue}</p>
                                <p>🗓️ {rec.day}s at {rec.time}</p>
                                <p>👶 Ages {rec.ageRange} • {rec.spots} spots left</p>
                              </div>
                              <Button
                                size="sm"
                                className="w-full mt-2 text-xs"
                                onClick={() => onEnrollClick?.(rec.id)}
                              >
                                Enroll Now
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={resetChat}
                            className="flex-1 text-xs"
                          >
                            Start Over
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setIsChatOpen(false)}
                            className="flex-1 text-xs"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          {currentStep === 'collecting' && (
            <div className="p-4 border-t bg-gray-50">
              {!childName && (
                <div className="space-y-2">
                  <Input
                    placeholder="Enter your child's name"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  />
                  <Button 
                    onClick={handleNameSubmit}
                    disabled={!childName.trim()}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Continue
                  </Button>
                </div>
              )}

              {childName && !childAge && (
                <div className="space-y-2">
                  <Select value={childAge} onValueChange={setChildAge}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 14 }, (_, i) => i + 5).map(age => (
                        <SelectItem key={age} value={age.toString()}>
                          {age} years old
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAgeSubmit}
                    disabled={!childAge}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Continue
                  </Button>
                </div>
              )}

              {childAge && !interests && (
                <div className="space-y-2">
                  <Input
                    placeholder="e.g., soccer, basketball, running, general fitness"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInterestsSubmit()}
                  />
                  <Button 
                    onClick={handleInterestsSubmit}
                    disabled={!interests.trim()}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Continue
                  </Button>
                </div>
              )}

              {interests && !availability && (
                <div className="space-y-2">
                  <Select value={availability} onValueChange={setAvailability}>
                    <SelectTrigger>
                      <SelectValue placeholder="When works best?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekday-morning">Weekday mornings</SelectItem>
                      <SelectItem value="weekday-afternoon">Weekday afternoons</SelectItem>
                      <SelectItem value="weekend-morning">Weekend mornings</SelectItem>
                      <SelectItem value="weekend-afternoon">Weekend afternoons</SelectItem>
                      <SelectItem value="any-time">Any time works</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAvailabilitySubmit}
                    disabled={!availability}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Get Recommendations
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}