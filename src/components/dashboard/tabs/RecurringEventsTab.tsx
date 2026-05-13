import { Activity } from '../../../utils/activityTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityList } from '../ActivityList';

interface RecurringEventsTabProps {
  activities: Activity[];
  childName: string;
}

export function RecurringEventsTab({ activities, childName }: RecurringEventsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityList activities={activities} />
      </CardContent>
    </Card>
  );
} 