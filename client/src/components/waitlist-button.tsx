import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { FloatingWaitlistButton, PlayfulPositionIndicator } from "./waitlist-animations";

interface WaitlistButtonProps {
  classId: string;
  childId: string;
  className?: string;
  isOnWaitlist?: boolean;
  waitlistPosition?: number;
}

export function WaitlistButton({ 
  classId, 
  childId, 
  className, 
  isOnWaitlist = false,
  waitlistPosition 
}: WaitlistButtonProps) {
  const { toast } = useToast();

  const addToWaitlistMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/waitlist", { 
        classId, 
        childId 
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/parent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      
      toast({
        title: "Added to Waitlist",
        description: `Your child has been added to the waitlist (position #${data.position}). We'll notify you when a spot becomes available!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join Waitlist",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const removeFromWaitlistMutation = useMutation({
    mutationFn: async (waitlistId: string) => {
      return await apiRequest("DELETE", `/api/waitlist/${waitlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/parent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      
      toast({
        title: "Removed from Waitlist",
        description: "Your child has been removed from the waitlist.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove from Waitlist", 
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  if (isOnWaitlist && waitlistPosition) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <PlayfulPositionIndicator 
          position={waitlistPosition} 
          className="scale-75"
        />
        <p className="text-xs text-center font-medium text-gray-600">
          Position #{waitlistPosition}
        </p>
      </div>
    );
  }

  return (
    <FloatingWaitlistButton
      onClick={() => addToWaitlistMutation.mutate()}
      isLoading={addToWaitlistMutation.isPending}
      className={`px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors ${className}`}
    >
      {addToWaitlistMutation.isPending ? "Joining..." : "Join Waitlist"}
    </FloatingWaitlistButton>
  );
}