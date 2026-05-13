import { DEFAULT_GRADE, INITIAL_GRADE } from '@/constants/boards';

/**
 * Returns a user-friendly grade description.
 * @param learnerGrade - Numeric grade of the learner.
 * @returns "Initial Grade" if matches INITIAL_GRADE, otherwise "Grade X".
 */
export const getGradeDesc = (learnerGrade?: number): string => {
    if (learnerGrade === undefined) {
      return "UnGraded"; // or any fallback you prefer
    }
  
    return learnerGrade === INITIAL_GRADE 
      ? "Initial Grade" 
      : `Grade ${learnerGrade}`;
  };
