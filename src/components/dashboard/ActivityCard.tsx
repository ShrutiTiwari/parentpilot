import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileText, MapPin, Sparkles } from "lucide-react";
import { Activity } from '../../utils/activityTypes';
import { getEventStyle } from '../../utils/categoryStyles';
import { getCategoryIcon } from '../../utils/categoryUtils';

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  if (!activity || typeof activity !== 'object') {
    console.error("Invalid activity data:", activity);
    return null;
  }

  const categoryStyle = getEventStyle(activity.category || 'general');

  // Get the appropriate icon based on category
  const CategoryIcon = () => {
    const IconComponent = getCategoryIcon(activity.category);
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />;
  };

  return (
    <Card 
      className={`backdrop-blur-sm border-l-4 border-[${categoryStyle.borderColor}] shadow-sm mb-1.5 ${categoryStyle.gradient}`}
    >
      <CardHeader className="pb-0 pt-1.5 px-2.5 sm:px-3 space-y-0">
        <CardTitle className={`text-sm ${categoryStyle.textColor}`}>
          {activity.title || 'Untitled Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-1.5 pt-0.5 px-2.5 sm:px-3">
        <div className="space-y-1 text-xs">
          {activity.venue && activity.venue.trim() !== '' && (
            <div className="flex items-center gap-1 text-[#221F26]/70">
              <MapPin className="h-3 w-3" />
              <span className="break-words">{activity.venue}</span>
            </div>
          )}
          <div className="flex flex-wrap mt-1 gap-1">
            <div className={`inline-block px-2 py-0.5 rounded-full text-xs ${categoryStyle.tagBg} ${categoryStyle.tagText}`}>
              {activity.yearGroup || 'All Years'}
            </div>
            
            {activity.sourcePdf && (
              <a 
                href={`/pdf-sources/${activity.sourcePdf}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                <FileText className="h-2 w-2" />
                <span className="text-[10px]">Source</span>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

