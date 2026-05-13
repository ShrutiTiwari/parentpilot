import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, groupActivitiesByDay } from '../../../utils/activityTypes';
import { ActivityCard } from '../ActivityCard';
import { CalendarDays } from 'lucide-react';

interface ActivitiesTabProps {
  activities: Activity[];
}

export function ActivitiesTab({ activities }: ActivitiesTabProps) {
  // Group activities by day
  const groupedActivities = groupActivitiesByDay(activities);
  
  // Helper function to get a background color based on the day
  const getDayColor = (day: string): string => {
    switch(day) {
      case 'Monday': return 'bg-blue-50/80';
      case 'Tuesday': return 'bg-purple-50/80';
      case 'Wednesday': return 'bg-green-50/80';
      case 'Thursday': return 'bg-yellow-50/80';
      case 'Friday': return 'bg-pink-50/80';
      case 'Saturday': return 'bg-orange-50/80';
      case 'Sunday': return 'bg-red-50/80';
      default: return 'bg-gray-50/80';
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1EAEDB] mb-4">Weekly Activities</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupedActivities.length > 0 ? (
            groupedActivities.map(group => (
              <Card 
                key={group.day} 
                className={`${getDayColor(group.day)} backdrop-blur-sm border-l-4`}
                style={{ borderLeftColor: group.day === 'Monday' ? '#3b82f6' : 
                                        group.day === 'Tuesday' ? '#8b5cf6' : 
                                        group.day === 'Wednesday' ? '#10b981' : 
                                        group.day === 'Thursday' ? '#f59e0b' : 
                                        group.day === 'Friday' ? '#ec4899' : 
                                        group.day === 'Saturday' ? '#f97316' : 
                                        '#ef4444' }}
              >
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <CalendarDays className="h-5 w-5 mr-2" />
                    {group.day}'s Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {group.activities.length > 0 ? (
                    <div className="space-y-2">
                      {group.activities.map((activity, index) => (
                        <ActivityCard key={activity.id || index} activity={activity} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[#221F26]/50">
                      No activities scheduled for {group.day}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-[#221F26]/50">
              No recurring activities found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
