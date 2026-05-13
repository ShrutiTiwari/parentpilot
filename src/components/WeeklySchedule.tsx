
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Book, Clock, Eye, EyeOff, Save } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

// Define types for the schedule
type UniformType = 'Uniform' | 'PE';
type VenueType = 'School Club' | 'External Venue' | 'None';

interface SchoolActivity {
  uniformType: UniformType;
  activityName: string;
  time: string;
}

interface AfterSchoolActivity {
  venue: VenueType;
  activityName: string;
  time: string;
}

interface DaySchedule {
  school: SchoolActivity;
  afterSchool: AfterSchoolActivity;
}

interface WeeklyScheduleData {
  [day: string]: DaySchedule;
}

export default function WeeklySchedule() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Initial schedule data
  const [schedule, setSchedule] = useState<WeeklyScheduleData>({
    Monday: {
      school: { uniformType: 'Uniform', activityName: 'Regular Classes', time: '8:30 AM - 3:30 PM' },
      afterSchool: { venue: 'School Club', activityName: 'Chess Club', time: '4:00 PM - 5:00 PM' },
    },
    Tuesday: {
      school: { uniformType: 'PE', activityName: 'Physical Education', time: '8:30 AM - 3:30 PM' },
      afterSchool: { venue: 'External Venue', activityName: 'Swimming', time: '4:30 PM - 6:00 PM' },
    },
    Wednesday: {
      school: { uniformType: 'Uniform', activityName: 'Art & Music Day', time: '8:30 AM - 3:30 PM' },
      afterSchool: { venue: 'None', activityName: '', time: '' },
    },
    Thursday: {
      school: { uniformType: 'Uniform', activityName: 'Regular Classes', time: '8:30 AM - 3:30 PM' },
      afterSchool: { venue: 'School Club', activityName: 'Drama Club', time: '4:00 PM - 5:30 PM' },
    },
    Friday: {
      school: { uniformType: 'PE', activityName: 'Field Trip', time: '8:30 AM - 2:30 PM' },
      afterSchool: { venue: 'External Venue', activityName: 'Piano Lessons', time: '3:30 PM - 4:30 PM' },
    },
  });
  
  const [editedSchedule, setEditedSchedule] = useState<WeeklyScheduleData>(schedule);
  
  const handleEditToggle = () => {
    if (isEditMode) {
      // Reset edited schedule when exiting edit mode without saving
      setEditedSchedule(schedule);
    }
    setIsEditMode(!isEditMode);
  };
  
  const handleSave = () => {
    setSchedule(editedSchedule);
    setIsEditMode(false);
    toast({
      title: "Schedule updated",
      description: "Your weekly schedule has been saved.",
    });
  };
  
  const handleSchoolChange = (day: string, field: keyof SchoolActivity, value: string | UniformType) => {
    setEditedSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        school: {
          ...prev[day].school,
          [field]: value
        }
      }
    }));
  };
  
  const handleAfterSchoolChange = (day: string, field: keyof AfterSchoolActivity, value: string | VenueType) => {
    setEditedSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        afterSchool: {
          ...prev[day].afterSchool,
          [field]: value
        }
      }
    }));
  };
  
  const getIcon = (type: UniformType | VenueType) => {
    switch (type) {
      case 'Uniform':
        return <Book className="h-4 w-4 text-blue-500" />;
      case 'PE':
        return <Book className="h-4 w-4 text-green-500" />;
      case 'School Club':
        return <Book className="h-4 w-4 text-orange-500" />;
      case 'External Venue':
        return <Book className="h-4 w-4 text-purple-500" />;
      case 'None':
        return <Book className="h-4 w-4 text-gray-400" />;
      default:
        return <Book className="h-4 w-4" />;
    }
  };
  
  const renderCompactMobileRow = (day: string) => {
    const daySchedule = schedule[day];
    
    return (
      <TableRow key={day}>
        <TableCell className="font-medium py-1 px-1">{day.substring(0, 3)}</TableCell>
        <TableCell className="py-1 px-1">
          <div className="text-xs">
            <div className="flex items-center gap-1">
              {getIcon(daySchedule.school.uniformType)}
              <span>{daySchedule.school.activityName}</span>
            </div>
            {daySchedule.afterSchool.venue !== 'None' && (
              <div className="flex items-center gap-1 mt-1">
                {getIcon(daySchedule.afterSchool.venue)}
                <span>{daySchedule.afterSchool.activityName}</span>
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right text-xs py-1 px-1">
          <div>{daySchedule.school.time.split(' - ')[0]}</div>
          {daySchedule.afterSchool.venue !== 'None' && (
            <div className="mt-1">{daySchedule.afterSchool.time.split(' - ')[0]}</div>
          )}
        </TableCell>
      </TableRow>
    );
  };
  
  const renderRegularRow = (day: string) => {
    const daySchedule = schedule[day];
    
    return (
      <TableRow key={day}>
        <TableCell className="font-medium">{day}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {getIcon(daySchedule.school.uniformType)}
            <div>
              <div>{daySchedule.school.activityName}</div>
              <div className="text-sm text-muted-foreground">{daySchedule.school.time}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {daySchedule.afterSchool.venue !== 'None' ? (
            <div className="flex items-center gap-2">
              {getIcon(daySchedule.afterSchool.venue)}
              <div>
                <div>{daySchedule.afterSchool.activityName}</div>
                <div className="text-sm text-muted-foreground">{daySchedule.afterSchool.time}</div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">No activity</span>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderReadOnlyView = () => {
    if (isMobile) {
      return (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] py-1 px-1">Day</TableHead>
              <TableHead className="py-1 px-1">Activities</TableHead>
              <TableHead className="w-[70px] text-right py-1 px-1">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weekDays.map((day) => renderCompactMobileRow(day))}
          </TableBody>
        </Table>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Day</TableHead>
            <TableHead>School</TableHead>
            <TableHead>After School</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weekDays.map((day) => renderRegularRow(day))}
        </TableBody>
      </Table>
    );
  };

  const renderEditView = () => (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditedSchedule(schedule);
            toast({
              title: "Changes discarded",
              description: "Your changes have been reset.",
            });
          }}
        >
          Discard Changes
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Day</TableHead>
            <TableHead>Schedule</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weekDays.map((day) => (
            <TableRow key={day}>
              <TableCell className="font-medium">{day}</TableCell>
              <TableCell>
                <div className="space-y-6">
                  {/* School Section */}
                  <div className="rounded-lg bg-background/50 p-4">
                    <div className="text-sm font-medium mb-4">School</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getIcon(editedSchedule[day].school.uniformType)}
                        <Select
                          value={editedSchedule[day].school.uniformType}
                          onValueChange={(value: UniformType) => 
                            handleSchoolChange(day, 'uniformType', value)
                          }
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select uniform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Uniform">Uniform</SelectItem>
                            <SelectItem value="PE">PE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Book className="h-4 w-4 text-[#8A898C]" />
                        <Input
                          placeholder="Activity name"
                          value={editedSchedule[day].school.activityName}
                          onChange={(e) =>
                            handleSchoolChange(day, 'activityName', e.target.value)
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#8A898C]" />
                        <Input
                          placeholder="Time"
                          value={editedSchedule[day].school.time}
                          onChange={(e) => 
                            handleSchoolChange(day, 'time', e.target.value)
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* After School Section */}
                  <div className="rounded-lg bg-background/50 p-4">
                    <div className="text-sm font-medium mb-4">After School</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getIcon(editedSchedule[day].afterSchool.venue)}
                        <Select
                          value={editedSchedule[day].afterSchool.venue}
                          onValueChange={(value: VenueType) => 
                            handleAfterSchoolChange(day, 'venue', value)
                          }
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select venue" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="School Club">School Club</SelectItem>
                            <SelectItem value="External Venue">External Venue</SelectItem>
                            <SelectItem value="None">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {editedSchedule[day].afterSchool.venue !== 'None' && (
                        <>
                          <div className="flex items-center gap-2">
                            <Book className="h-4 w-4 text-[#8A898C]" />
                            <Input
                              placeholder="Activity name"
                              value={editedSchedule[day].afterSchool.activityName}
                              onChange={(e) => 
                                handleAfterSchoolChange(day, 'activityName', e.target.value)
                              }
                              className="w-full"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#8A898C]" />
                            <Input
                              placeholder="Time"
                              value={editedSchedule[day].afterSchool.time}
                              onChange={(e) => 
                                handleAfterSchoolChange(day, 'time', e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm shadow-sm border-[#1EAEDB]/20">
        <CardHeader className={`flex flex-row items-center justify-between ${isMobile ? 'p-2' : ''}`}>
          <CardTitle className="text-lg text-[#221F26]">Weekly Schedule</CardTitle>
          <Button
            variant="ghost"
            size={isMobile ? "icon" : "sm"}
            onClick={handleEditToggle}
            className={isMobile ? "" : "gap-2"}
          >
            {isEditMode ? (
              isMobile ? <Eye className="h-4 w-4" /> : (
                <>
                  <Eye className="h-4 w-4" />
                  View Mode
                </>
              )
            ) : (
              isMobile ? <EyeOff className="h-4 w-4" /> : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Edit Mode
                </>
              )
            )}
          </Button>
        </CardHeader>
        <CardContent className={isMobile ? "p-1 sm:p-3" : ""}>
          {isEditMode ? renderEditView() : renderReadOnlyView()}
        </CardContent>
      </Card>
    </div>
  );
}
