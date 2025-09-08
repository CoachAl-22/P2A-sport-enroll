import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Sparkles, X, Bot } from "lucide-react";
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
  isActive?: boolean;
}

export default function OneClickChat({ onEnrollClick, isActive = false }: OneClickChatProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'name' | 'age' | 'interests' | 'availability' | 'recommendations'>('welcome');
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
      text: "Hi there! I'm your Program Finder assistant. I'll help you discover the perfect athletic program for your child. Let's start - what's your child's name?",
      isBot: true,
      timestamp: new Date()
    }]);
    setCurrentStep('name');
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
      setCurrentStep('age');
    }, 800);
  };

  const handleAgeSubmit = () => {
    if (!childAge) return;
    
    sendMessage(`${childName} is ${childAge} years old`);
    setTimeout(() => {
      sendMessage(`Perfect! What sports or activities is ${childName} most interested in?`, true);
      setCurrentStep('interests');
    }, 800);
  };

  const handleInterestsSubmit = () => {
    if (!interests.trim()) return;
    
    sendMessage(`${childName} is interested in ${interests}`);
    setTimeout(() => {
      sendMessage("When would work best for classes?", true);
      setCurrentStep('availability');
    }, 800);
  };

  const handleAvailabilitySubmit = () => {
    if (!availability) return;
    
    sendMessage(`We prefer ${availability} classes`);
    
    // Generate recommendations based on inputs
    setTimeout(() => {
      const recommendations = generateRecommendations();
      const numRecs = recommendations.length;
      const message = numRecs > 0 
        ? `Perfect! Based on ${childName}'s age (${childAge}), interests (${interests}), and availability (${availability}), here ${numRecs === 1 ? 'is' : 'are'} ${numRecs} great ${numRecs === 1 ? 'option' : 'options'}:`
        : `I couldn't find classes matching ${childName}'s age range right now, but here are some similar options:`;
      
      sendMessage(message, true, recommendations);
      setCurrentStep('recommendations');
    }, 1200);
  };

  const generateRecommendations = (): ClassRecommendation[] => {
    const age = parseInt(childAge);
    const filteredClasses = (classes as any[]).filter((cls: any) => {
      return age >= cls.minAge && age <= cls.maxAge;
    });

    return filteredClasses.map((cls: any) => ({
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
    setTimeout(() => startChat(), 300);
  };

  return (
    <>
      {/* Prominent Chat Helper */}
      {isActive && isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          {/* Chat Message Bubble */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="absolute bottom-20 right-0 bg-gray-900 rounded-lg shadow-xl p-4 mb-2 max-w-xs border-2 border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-secondary-500" />
                <span className="font-semibold text-white">Program Finder</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800 h-6 w-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-200 mb-3">
              How can I help? I'll find the perfect athletic program for your child!
            </p>
            <div className="flex justify-end">
              <Button
                onClick={startChat}
                size="sm"
                className="bg-secondary-500 hover:bg-secondary-600 text-white text-xs px-3 py-1"
              >
                Get Started
              </Button>
            </div>
            {/* Speech bubble arrow */}
            <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-gray-900 border-r-2 border-b-2 border-gray-700"></div>
          </motion.div>

          {/* Enhanced Chat Button */}
          <Button
            onClick={startChat}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            size="icon"
          >
            <div className="flex flex-col items-center justify-center">
              <Bot className="w-8 h-8 text-white mb-1" />
              <div className="text-xs text-white font-bold">HELP</div>
            </div>
            
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
          </Button>
          
          {/* Enhanced pulsing indicator */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </motion.div>
      )}

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
          {currentStep === 'name' && (
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-2">
                <Input
                  placeholder="Enter your child's name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  autoFocus
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
            </div>
          )}

          {currentStep === 'age' && (
            <div className="p-4 border-t bg-gray-50">
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
            </div>
          )}

          {currentStep === 'interests' && (
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-2">
                <Input
                  placeholder="e.g., soccer, basketball, running, general fitness"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInterestsSubmit()}
                  autoFocus
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
            </div>
          )}

          {currentStep === 'availability' && (
            <div className="p-4 border-t bg-gray-50">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}