import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface AnalyticsCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

export default function AnalyticsCard({ title, icon, children, loading }: AnalyticsCardProps) {
  return (
    <Card className="bg-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-heading font-bold mb-4 text-white flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-gray-600 border-t-white rounded-full" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
