import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function Waitlist() {
  const { toast } = useToast();

  const { data: waitlistEntries = [], isLoading } = useQuery({
    queryKey: ["/api/waitlist/parent"],
  });

  const removeFromWaitlistMutation = useMutation({
    mutationFn: async (waitlistId: string) => {
      return await apiRequest("DELETE", `/api/waitlist/${waitlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/parent"] });
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'notified': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'notified': return 'Spot Available!';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Family's Waitlists</h1>
        <p className="text-gray-600 mt-2">
          Track your children's position on class waitlists and get notified when spots become available.
        </p>
      </div>

      {waitlistEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Waitlist Entries</h3>
            <p className="text-gray-600">
              Your children are not currently on any class waitlists. When classes are full, you can join the waitlist to be notified when spots become available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {waitlistEntries.map((entry: any) => (
            <Card key={entry.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{entry.childName}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{entry.className}</p>
                  </div>
                  <Badge className={getStatusColor(entry.status)}>
                    {getStatusText(entry.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {entry.classDay} at {entry.classTime}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Position: </span>
                      <span className="text-lg font-bold text-blue-600">#{entry.position}</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromWaitlistMutation.mutate(entry.id)}
                      disabled={removeFromWaitlistMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Joined: {new Date(entry.joinedAt).toLocaleDateString()}
                    {entry.notifiedAt && (
                      <div className="mt-1 text-green-600 font-medium">
                        Spot offered: {new Date(entry.notifiedAt).toLocaleDateString()}
                      </div>
                    )}
                    {entry.expiresAt && new Date(entry.expiresAt) > new Date() && (
                      <div className="mt-1 text-orange-600 font-medium">
                        Offer expires: {new Date(entry.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}