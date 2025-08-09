import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

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
    onSuccess: (data) => {
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

  if (isOnWaitlist) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        disabled
      >
        On Waitlist #{waitlistPosition}
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      onClick={() => addToWaitlistMutation.mutate()}
      disabled={addToWaitlistMutation.isPending}
    >
      {addToWaitlistMutation.isPending ? "Joining..." : "Join Waitlist"}
    </Button>
  );
}