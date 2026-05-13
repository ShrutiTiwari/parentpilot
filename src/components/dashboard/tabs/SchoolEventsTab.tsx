import { Event } from '../../../utils/dateGrouping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventList } from '../EventList';

interface SchoolEventsTabProps {
  events: Event[];
  schoolName: string;
  yearGroup: string;
}

export function SchoolEventsTab({ events, schoolName, yearGroup }: SchoolEventsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>School Events</CardTitle>
      </CardHeader>
      <CardContent>
        <EventList events={events} />
      </CardContent>
    </Card>
  );
} 