import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  gradient?: string;
  textColor?: string;
  onClick?: () => void;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient = "bg-primary-500", 
  textColor = "text-white",
  onClick 
}: StatsCardProps) {
  return (
    <Card 
      className={`${gradient} ${textColor} hover:scale-105 transition-transform ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6 text-center">
        {icon && (
          <div className="flex items-center justify-center mb-3">
            {icon}
          </div>
        )}
        <h3 className="font-heading font-semibold text-lg mb-1">{title}</h3>
        <div className="text-2xl font-heading font-bold mb-1">{value}</div>
        {subtitle && (
          <p className="text-sm opacity-90">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
