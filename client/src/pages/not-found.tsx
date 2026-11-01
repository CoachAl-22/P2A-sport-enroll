import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">We couldn’t find that page</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The link may have changed. Explore our programs or return to the homepage to find what you need.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a href="/programs" className="font-semibold text-teal-700 underline">Explore programs</a>
            <a href="/" className="font-semibold text-teal-700 underline">Power2ADAPT home</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
