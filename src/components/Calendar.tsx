
import React, { useState, useEffect } from 'react';
import { useDataService } from '../services/api/DataServiceContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Event, EventGroup, groupEventsByDate, formatEventDate, formatEventTime } from '../utils/dateGrouping';

export const Calendar: React.FC = () => {
  const dataService = useDataService();
  const [events, setEvents] = useState<Event[]>([]);
  const [groupedEvents, setGroupedEvents] = useState<EventGroup[]>([]);
  const [yearGroups, setYearGroups] = useState<string[]>([]);
  const [selectedYearGroup, setSelectedYearGroup] = useState<string>('All');

  useEffect(() => {
    const fetchData = async () => {
      const [eventsData, yearGroupsData] = await Promise.all([
        dataService.getEvents(),
        dataService.getYearGroups()
      ]);
      setEvents(eventsData);
      setYearGroups(['All', ...yearGroupsData]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filteredEvents = events.filter(event => {
      if (selectedYearGroup === 'All') return true;
      return event.yearGroup === selectedYearGroup || 
             event.yearGroup === 'All' || 
             event.yearGroup === 'Parents';
    });
    setGroupedEvents(groupEventsByDate(filteredEvents));
  }, [events, selectedYearGroup]);

  return (
    <div className="space-y-6 w-full p-4">
      <div>
        <select
          value={selectedYearGroup}
          onChange={(e) => setSelectedYearGroup(e.target.value)}
          className="max-w-[200px] p-2 border rounded"
        >
          {yearGroups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>

      {groupedEvents.map(group => (
        <Card key={group.date} className="p-4">
          <CardHeader>
            <CardTitle className="text-md">{formatEventDate(group.date)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.events.map(event => (
              <div
                key={event.id}
                className="p-4 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <p className="font-bold">{event.title}</p>
                <p className="text-sm text-gray-600">
                  {formatEventTime(event.date)} - {event.location}
                </p>
                <p className="mt-2">{event.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {event.yearGroup === 'All' ? 'All Year Groups' : event.yearGroup}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
