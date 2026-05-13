import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, Sparkles } from "lucide-react";
import { formatDate, isValidDate } from '../../utils/dateUtils';
import { getEventStyle } from '../../utils/categoryStyles';
import { getCategoryIcon } from '../../utils/categoryUtils';
import { WeekendPlan } from '../../utils/weekendPlanTypes';

interface PlanCardProps {
  plan: WeekendPlan;
}

export function PlanCard({ plan }: PlanCardProps) {
  const categoryStyle = getEventStyle(plan.category || 'general');
  
  // Get the appropriate icon based on category
  const CategoryIcon = () => {
    const IconComponent = getCategoryIcon(plan.category);
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />;
  };

  const isValidPlanDate = isValidDate(plan.date);
  const formattedDate = isValidPlanDate ? formatDate(plan.date, { short: true }) : plan.date;

  return (
    <Card 
      className={`backdrop-blur-sm border-l-4 border-[${categoryStyle.borderColor}] shadow-sm mb-3 ${categoryStyle.gradient}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <CardHeader className="pb-0 pt-2 px-3">
            <CardTitle className={`text-base ${categoryStyle.textColor}`}>
              {plan.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </CardHeader>
          <CardContent className="pb-2 pt-1 px-3">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1 text-[#221F26]/70">
                <Clock className="h-3 w-3" />
                <span>{plan.time}</span>
              </div>
              <div className="flex items-center gap-1 text-[#221F26]/70">
                <MapPin className="h-3 w-3" />
                <span>{plan.venue}</span>
              </div>
              <div className="flex flex-wrap mt-1 gap-1">
                <div className={`inline-block px-2 py-0.5 rounded-full text-xs ${categoryStyle.tagBg} ${categoryStyle.tagText}`}>
                  {plan.yearGroup || 'All'}
                </div>
              </div>
            </div>
          </CardContent>
        </div>
        {CategoryIcon() && (
          <div className={`pr-3 pt-3 ${categoryStyle.textColor}`}>
            <CategoryIcon />
          </div>
        )}
      </div>
    </Card>
  );
}
