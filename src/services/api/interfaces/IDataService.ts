
import { Event } from '../../../utils/dateGrouping';
import { Activity } from '../../../utils/activityTypes';
import { WeekendPlan } from '../../../utils/weekendPlanTypes';

export interface IDataService {
  // One-off events - based on school name
  getOneOffEvents(schoolName: string): Promise<Event[]>;
  getEventsByYearGroup(yearGroup: string, schoolName: string): Promise<Event[]>;
  
  // Recurring events - based on child name
  getRecurringEvents(childName: string): Promise<Activity[]>;
  
  // Weekend plans - based on child name
  getWeekendPlans(childName: string): Promise<WeekendPlan[]>;
  
  // Year groups - based on school name
  getYearGroups(schoolName: string): Promise<string[]>;
}
