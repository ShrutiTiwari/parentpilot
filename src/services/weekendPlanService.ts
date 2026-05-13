
import { WeekendPlan } from '@/utils/weekendPlanTypes';

export const dataService = {
  async addWeekendPlan(childName: string, plan: WeekendPlan): Promise<void> {
    console.log('Adding weekend plan for child:', childName, plan);
    // This is a mock implementation - in a real app this would save to a database
    throw new Error('Weekend plan service not implemented yet');
  }
};
