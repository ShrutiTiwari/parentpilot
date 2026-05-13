import { Activity } from '../../utils/activityTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No activities found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{activity.title}</span>
              <Badge variant="secondary">{activity.category || 'General'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activity.time && (
                <div className="text-sm text-muted-foreground">
                  Time: {activity.time}
                </div>
              )}
              {activity.location && (
                <div className="text-sm text-muted-foreground">
                  Location: {activity.location}
                </div>
              )}
              {activity.venue && (
                <div className="text-sm text-muted-foreground">
                  Venue: {activity.venue}
                </div>
              )}
              {activity.yearGroup && (
                <div className="text-sm text-muted-foreground">
                  Year Group: {activity.yearGroup}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 