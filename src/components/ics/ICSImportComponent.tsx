import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle, AlertCircle, Edit2, Save, Trash2, Plus, Star, Upload } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { supabase } from '@/lib/supabase';
import { batchInsertFavorites } from '@/services/userFavoritesService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface ParsedEvent {
  title: string;
  date: string;
  time_start: string;
  time_end: string;
  year_group: string;
  year_groups: string[];
  category: string;
  source: string | null;
  event_type: string;
  venue: string;
  school_code_required: boolean;
  visibility: string;
  description?: string;
  external_id?: string;
  // UI state
  editing?: boolean;
  todos?: Array<{text: string; completed: boolean}>;
  isFavorite?: boolean;
}

const CATEGORIES = ['general', 'holiday', 'exam', 'sports', 'parent', 'report', 'music', 'birthday', 'swimming', 'dance'];
const YEAR_GROUPS = ['All', 'Reception', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'];
const VISIBILITY_OPTIONS = ['private', 'verified_shared', 'public'];

interface ICSImportComponentProps {
  onImportComplete?: (eventCount: number) => void;
  defaultSchoolId?: string;
  showSchoolSelector?: boolean;
}

export function ICSImportComponent({
  onImportComplete,
  defaultSchoolId,
  showSchoolSelector = true
}: ICSImportComponentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [icsUrl, setIcsUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    totalEvents?: number;
    calendarName?: string;
    error?: string;
  } | null>(null);
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(defaultSchoolId || '');
  const [schools, setSchools] = useState<Array<{id: string; name: string}>>([]);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
    failedEvents?: Array<{title: string; error: string}>;
  } | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [importType, setImportType] = useState<'personal' | 'school' | null>(null);

  useEffect(() => {
    if (defaultSchoolId) {
      setSelectedSchoolId(defaultSchoolId);
    }
  }, [defaultSchoolId]);

  useEffect(() => {
    // Fetch available schools
    const fetchSchools = async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching schools:', error);
      } else {
        setSchools(data || []);
      }
    };
    fetchSchools();
  }, []);

  const extractYearGroupsFromTitle = (title: string): string[] => {
    const yearGroupsSet = new Set<string>();
    const upperTitle = title.toUpperCase();

    const yearGroupToNumber = (yearGroup: string): number => {
      if (yearGroup === 'Reception' || yearGroup === 'Kindergarten') return 0;
      const match = yearGroup.match(/Year (\d+)/);
      return match ? parseInt(match[1]) : -1;
    };

    const getYearGroupsInRange = (start: number, end: number): string[] => {
      const groups: string[] = [];
      for (let i = start; i <= end; i++) {
        if (i === 0) {
          groups.push('Reception', 'Kindergarten');
        } else {
          const yearGroup = `Year ${i}`;
          if (YEAR_GROUPS.includes(yearGroup)) {
            groups.push(yearGroup);
          }
        }
      }
      return groups;
    };

    // Check for range patterns (with -, &, or / separator)
    const rangePatterns = [
      /RECEPTION\s*[-&/]\s*YEAR\s*(\d+)/gi,
      /RECEPTION\s*[-&/]\s*Y(\d+)/gi,
      /RECEPTION\s*[-&/]\s*(\d+)/gi,
      /YEAR\s*(\d+)\s*[-&/]\s*YEAR\s*(\d+)/gi,
      /YEAR\s*(\d+)\s*[-&/]\s*(\d+)/gi,
      /Y(\d+)\s*[-&/]\s*Y(\d+)/gi,
      /Y(\d+)\s*[-&/]\s*(\d+)/gi,
    ];

    let foundRange = false;
    rangePatterns.forEach((pattern, index) => {
      const matches = upperTitle.matchAll(pattern);
      for (const match of matches) {
        let startYear: number;
        let endYear: number;

        if (index <= 2) {
          startYear = 0;
          endYear = parseInt(match[1]);
        } else {
          startYear = parseInt(match[1]);
          endYear = parseInt(match[2] || match[1]);
        }

        // Only accept valid year group numbers (1-13)
        if ((startYear === 0 || (startYear >= 1 && startYear <= 13)) &&
            (endYear >= 1 && endYear <= 13)) {
          foundRange = true;

          if (startYear > endYear) {
            [startYear, endYear] = [endYear, startYear];
          }

          const rangeGroups = getYearGroupsInRange(startYear, endYear);
          rangeGroups.forEach(g => yearGroupsSet.add(g));
        }
      }
    });

    if (foundRange && yearGroupsSet.size > 0) {
      return Array.from(yearGroupsSet);
    }

    // Check for individual year groups
    YEAR_GROUPS.forEach(group => {
      if (group === 'All') return;
      const escapedGroup = group.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const patterns = [
        new RegExp(`\\b${escapedGroup}\\b`, 'gi'),
        new RegExp(`\\bY${group.replace('Year ', '')}\\b`, 'gi')
      ];

      patterns.forEach(pattern => {
        if (pattern.test(upperTitle)) {
          yearGroupsSet.add(group);
        }
      });
    });

    return yearGroupsSet.size > 0 ? Array.from(yearGroupsSet) : ['All'];
  };

  const handleParseICS = async () => {
    if (!icsUrl.trim()) {
      setResult({
        success: false,
        error: 'Please enter an ICS URL'
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setEvents([]);
    setSaveResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/test/parse-ics-from-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: icsUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        const sortedEvents = data.events
          .map((e: ParsedEvent) => {
            const detectedYearGroups = extractYearGroupsFromTitle(e.title);
            return {
              ...e,
              year_groups: detectedYearGroups,
              editing: false,
              todos: [],
              isFavorite: false
            };
          })
          .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });
        setEvents(sortedEvents);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error('Error parsing ICS:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse ICS'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!importType) {
      setSaveResult({
        success: false,
        message: 'Please select whether these are Personal or School events'
      });
      return;
    }

    if (importType === 'school' && !selectedSchoolId) {
      setSaveResult({
        success: false,
        message: 'Please select a school first'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to import events',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    setSaveResult(null);

    try {
      const eventsToSave = events.map(e => {
        // Only include fields that exist in the database schema
        return {
          title: e.title,
          date: e.date,
          time_start: e.time_start,
          time_end: e.time_end,
          year_group: e.year_groups.join(','),
          year_groups: e.year_groups,
          category: e.category,
          source: e.source,
          venue: e.venue,
          school_code_required: e.school_code_required,
          visibility: e.visibility,
          event_type: importType,
          school_id: importType === 'school' ? selectedSchoolId : null,
          created_by_user_id: importType === 'personal' ? user.id : null
        };
      });

      // Try to save all events at once first with upsert
      const { data, error } = await supabase
        .from('events')
        .upsert(eventsToSave, {
          onConflict: 'school_id,title,date,time_start,time_end',
          ignoreDuplicates: false
        })
        .select('id');

      let successCount = events.length;
      let failedEvents: Array<{title: string; error: string}> = [];
      let savedEventIds: string[] = [];

      if (error) {
        // If bulk upsert fails, try saving events one by one
        console.log('Bulk upsert failed, trying individual inserts...');
        successCount = 0;

        for (let i = 0; i < eventsToSave.length; i++) {
          const eventToSave = eventsToSave[i];
          const originalEvent = events[i];

          try {
            const { data: singleData, error: singleError } = await supabase
              .from('events')
              .upsert([eventToSave], {
                onConflict: 'school_id,title,date,time_start,time_end',
                ignoreDuplicates: false
              })
              .select('id');

            if (singleError) throw singleError;

            successCount++;
            if (singleData && singleData.length > 0) {
              savedEventIds.push(singleData[0].id);
            }
          } catch (err) {
            failedEvents.push({
              title: originalEvent.title,
              error: err instanceof Error ? err.message : 'Unknown error'
            });
          }
        }
      } else if (data) {
        savedEventIds = data.map(e => e.id);
      }

      // Handle favorites for successfully saved events
      const favoriteEvents = events.filter(e => e.isFavorite);
      if (favoriteEvents.length > 0 && savedEventIds.length > 0) {
        await batchInsertFavorites(user.id, savedEventIds);
      }

      // Show results
      if (failedEvents.length > 0) {
        setSaveResult({
          success: successCount > 0,
          message: `Successfully saved ${successCount} out of ${events.length} events. ${failedEvents.length} events failed.`,
          failedEvents
        });

        toast({
          title: successCount > 0 ? 'Partial import success' : 'Import failed',
          description: `${successCount} events imported, ${failedEvents.length} failed`,
          variant: successCount > 0 ? 'default' : 'destructive',
        });
      } else {
        setSaveResult({
          success: true,
          message: `Successfully saved ${successCount} events to database`
        });

        toast({
          title: 'Import successful',
          description: `${successCount} events imported successfully`,
        });
      }

      if (onImportComplete && successCount > 0) {
        onImportComplete(successCount);
      }

      // Clear events after successful save (only if all succeeded)
      if (failedEvents.length === 0) {
        setTimeout(() => {
          setEvents([]);
          setIcsUrl('');
          setResult(null);
        }, 2000);
      }

    } catch (error) {
      console.error('Error saving to database:', error);
      setSaveResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save events'
      });
      toast({
        title: 'Import failed',
        description: 'Failed to save events to database',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEvent = (index: number, field: keyof ParsedEvent, value: any) => {
    const updatedEvents = [...events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      [field]: value
    };
    setEvents(updatedEvents);
  };

  const handleToggleEdit = (index: number) => {
    const updatedEvents = [...events];
    updatedEvents[index].editing = !updatedEvents[index].editing;
    setEvents(updatedEvents);
  };

  const handleDeleteEvent = (index: number) => {
    const updatedEvents = events.filter((_, i) => i !== index);
    setEvents(updatedEvents);
  };

  const handleToggleFavorite = (eventIndex: number) => {
    const updatedEvents = [...events];
    updatedEvents[eventIndex].isFavorite = !updatedEvents[eventIndex].isFavorite;
    setEvents(updatedEvents);
  };

  const handleToggleYearGroup = (eventIndex: number, yearGroup: string) => {
    const updatedEvents = [...events];
    const currentGroups = updatedEvents[eventIndex].year_groups;

    if (currentGroups.includes(yearGroup)) {
      updatedEvents[eventIndex].year_groups = currentGroups.filter(g => g !== yearGroup);
    } else {
      updatedEvents[eventIndex].year_groups = [...currentGroups, yearGroup];
    }

    if (updatedEvents[eventIndex].year_groups.length === 0) {
      updatedEvents[eventIndex].year_groups = ['All'];
    }

    setEvents(updatedEvents);
  };

  const filteredEvents = showOnlyFavorites
    ? events.filter(e => e.isFavorite)
    : events;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <CardTitle>Import Calendar Events</CardTitle>
          </div>
          <CardDescription>
            Import events from an ICS calendar URL (Google Calendar, Outlook, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ICS Calendar URL</label>
            <Input
              type="url"
              placeholder="https://calendar.google.com/calendar/ical/..."
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleParseICS}
            disabled={loading || !icsUrl.trim()}
            className="w-full"
          >
            {loading ? (
              <>Loading...</>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Parse Calendar
              </>
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                {result.success
                  ? `Found ${result.totalEvents} events from "${result.calendarName}"`
                  : result.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {events.length > 0 && (
        <>
          {/* Event Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Import As</CardTitle>
              <CardDescription>Choose how to import these events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setImportType('personal')}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      importType === 'personal'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">👤</div>
                      <h3 className="font-semibold text-lg mb-1">Personal Events</h3>
                      <p className="text-sm text-gray-600">
                        Only visible to you
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setImportType('school')}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      importType === 'school'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏫</div>
                      <h3 className="font-semibold text-lg mb-1">School Events</h3>
                      <p className="text-sm text-gray-600">
                        Visible to all school users
                      </p>
                    </div>
                  </button>
                </div>

                {importType === 'school' && (
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium">Select School</label>
                    <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map(school => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Parsed Events ({filteredEvents.length})</CardTitle>
                  <CardDescription>Review and edit events before importing</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={showOnlyFavorites ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  >
                    <Star className={`h-4 w-4 mr-2 ${showOnlyFavorites ? 'fill-current' : ''}`} />
                    Favorites ({events.filter(e => e.isFavorite).length})
                  </Button>
                  <Button
                    onClick={handleSaveToDatabase}
                    disabled={saving || !importType || (importType === 'school' && !selectedSchoolId)}
                    size="sm"
                  >
                    {saving ? 'Saving...' : `Save ${events.length} Events`}
                  </Button>
                </div>
              </div>
            </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Fav</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Year Groups</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event, index) => {
                    const actualIndex = events.findIndex(e => e === event);
                    return (
                      <TableRow key={actualIndex}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(actualIndex)}
                          >
                            <Star className={`h-4 w-4 ${event.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          </Button>
                        </TableCell>
                        <TableCell>
                          {event.editing ? (
                            <Input
                              value={event.title}
                              onChange={(e) => handleUpdateEvent(actualIndex, 'title', e.target.value)}
                              className="w-full"
                            />
                          ) : (
                            <span className="font-medium">{event.title}</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {event.time_start && event.time_end
                            ? `${event.time_start.slice(0, 5)} - ${event.time_end.slice(0, 5)}`
                            : 'All day'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {event.year_groups.map(group => (
                              <Badge
                                key={group}
                                variant={event.editing ? 'default' : 'secondary'}
                                className="text-xs cursor-pointer"
                                onClick={() => event.editing && handleToggleYearGroup(actualIndex, group)}
                              >
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.editing ? (
                            <Select
                              value={event.category}
                              onValueChange={(value) => handleUpdateEvent(actualIndex, 'category', value)}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">{event.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleEdit(actualIndex)}
                            >
                              {event.editing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(actualIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {saveResult && (
        <Alert variant={saveResult.success ? 'default' : 'destructive'}>
          {saveResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>
            <div>{saveResult.message}</div>
            {saveResult.failedEvents && saveResult.failedEvents.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Failed Events:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {saveResult.failedEvents.map((failedEvent, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{failedEvent.title}</span>
                      <span className="text-gray-600 ml-2">- {failedEvent.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
