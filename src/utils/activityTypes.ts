
export interface Activity {
  id: string;
  title: string;
  dayOfWeek: string;
  location?: string;
  time?: string;
  sourcePdf?: string;
  category?: string;
  venue?: string;
  yearGroup?: string;
}

export interface ActivityGroup {
  day: string;
  activities: Activity[];
}

const daysOrder = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export function sortDays(days: string[]): string[] {
  return days.sort((a, b) => {
    const indexA = daysOrder.indexOf(a);
    const indexB = daysOrder.indexOf(b);
    return indexA - indexB;
  });
}

export function groupActivitiesByDay(activities: Activity[]): ActivityGroup[] {
  // Create a map to store activities by day
  const groupedMap = activities.reduce((acc, activity) => {
    const day = activity.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  // Convert the map to an array and sort by day of week
  return daysOrder
    .filter(day => groupedMap[day]?.length > 0)
    .map(day => ({
      day,
      activities: groupedMap[day].sort((a, b) => {
        // Sort by time if available
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        // Sort by title if time not available
        return a.title.localeCompare(b.title);
      })
    }));
}
