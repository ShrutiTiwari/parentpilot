import { format, parse, isValid, parseISO, compareAsc, isToday, isTomorrow, isAfter, startOfToday } from 'date-fns';

/**
 * Comprehensive date utilities for the Power Parent application
 * Consolidates all date/time formatting, parsing, validation, and conversion logic
 */

export interface DateFormatOptions {
  includeYear?: boolean;
  includeTime?: boolean;
  short?: boolean;
  relative?: boolean;
}

export interface TimeFormatOptions {
  includeSeconds?: boolean;
  format24Hour?: boolean;
}

/**
 * Parse a date string into a Date object with robust error handling
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // Try to parse ISO format first (YYYY-MM-DD)
    let date = parseISO(dateStr);
    
    if (isValid(date)) {
      return date;
    }
    
    // Try to parse format like "April 28, 2025"
    if (dateStr.includes(',')) {
      date = parse(dateStr, 'MMMM d, yyyy', new Date());
      if (isValid(date)) {
        return date;
      }
    }
    
    // Try parsing as is
    date = new Date(dateStr);
    if (isValid(date)) {
      return date;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
}

/**
 * Validate if a date string is valid
 */
export function isValidDate(dateStr: string): boolean {
  const date = parseDate(dateStr);
  return date !== null && isValid(date);
}

/**
 * Convert any date string to YYYY-MM-DD format for input fields
 */
export function convertToInputFormat(dateStr: string): string {
  if (!dateStr) return '';
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  const date = parseDate(dateStr);
  if (!date) {
    // Fallback to current date if parsing fails
    const today = new Date();
    return format(today, 'yyyy-MM-dd');
  }
  
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format a date for display with various options
 */
export function formatDate(dateStr: string, options: DateFormatOptions = {}): string {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  
  const { includeYear = true, short = false, relative = false } = options;
  
  // Handle relative dates
  if (relative) {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
  }
  
  // Short format
  if (short) {
    return includeYear ? format(date, 'MMM d, yyyy') : format(date, 'MMM d');
  }
  
  // Full format
  return includeYear ? format(date, 'EEEE, MMMM d, yyyy') : format(date, 'EEEE, MMMM d');
}

/**
 * Format time for display
 */
export function formatTime(timeStr: string, options: TimeFormatOptions = {}): string {
  if (!timeStr) return '';
  
  try {
    const { includeSeconds = false, format24Hour = false } = options;
    
    // Handle time range (e.g., "10:00 - 14:00")
    if (timeStr.includes('-')) {
      const [start, end] = timeStr.split('-').map(t => t.trim());
      const startFormatted = formatTime(start, options);
      const endFormatted = formatTime(end, options);
      return `${startFormatted} - ${endFormatted}`;
    }
    
    // Parse time string
    let date: Date;
    if (timeStr.includes('T')) {
      // ISO format
      date = new Date(`1970-01-01T${timeStr}`);
    } else {
      // Simple time format
      date = new Date(`1970-01-01T${timeStr}:00`);
    }
    
    if (!isValid(date)) {
      // Try to extract time from string
      const match = timeStr.match(/(\d{1,2}:\d{2})/);
      if (match) {
        date = new Date(`1970-01-01T${match[1]}:00`);
      }
    }
    
    if (!isValid(date)) return timeStr;
    
    // Format based on options
    if (format24Hour) {
      return includeSeconds ? format(date, 'HH:mm:ss') : format(date, 'HH:mm');
    } else {
      return includeSeconds ? format(date, 'h:mm:ss a') : format(date, 'h:mm a');
    }
  } catch (error) {
    console.error('Error formatting time:', timeStr, error);
    return timeStr;
  }
}

/**
 * Format date and time together
 */
export function formatDateTime(dateStr: string, timeStr?: string, options: DateFormatOptions = {}): string {
  const dateFormatted = formatDate(dateStr, options);
  if (!timeStr) return dateFormatted;
  
  const timeFormatted = formatTime(timeStr);
  return `${dateFormatted} at ${timeFormatted}`;
}

/**
 * Get relative day name (Today, Tomorrow, or day name)
 */
export function getRelativeDayName(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return '';
  
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE');
}

/**
 * Check if a date is today
 */
export function isDateToday(dateStr: string): boolean {
  const date = parseDate(dateStr);
  return date ? isToday(date) : false;
}

/**
 * Check if a date is tomorrow
 */
export function isDateTomorrow(dateStr: string): boolean {
  const date = parseDate(dateStr);
  return date ? isTomorrow(date) : false;
}

/**
 * Check if a date is in the future (after today)
 */
export function isDateInFuture(dateStr: string): boolean {
  const date = parseDate(dateStr);
  return date ? isAfter(date, startOfToday()) : false;
}

/**
 * Get the start of week for a given date
 */
export function getStartOfWeek(date: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1): Date {
  const day = date.getDay();
  const diff = (day < weekStartsOn ? (7 + day) : day) - weekStartsOn;
  return new Date(date.setDate(date.getDate() - diff));
}

/**
 * Get the end of week for a given date
 */
export function getEndOfWeek(date: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1): Date {
  const start = getStartOfWeek(date, weekStartsOn);
  return new Date(start.setDate(start.getDate() + 6));
}

/**
 * Format a week range (e.g., "Jan 1 - Jan 7")
 */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
}

/**
 * Compare two dates for sorting
 */
export function compareDates(dateA: string, dateB: string): number {
  const dateObjA = parseDate(dateA);
  const dateObjB = parseDate(dateB);
  
  if (!dateObjA || !dateObjB) return 0;
  
  return compareAsc(dateObjA, dateObjB);
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get current time in HH:mm format
 */
export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm');
}

/**
 * Parse time string to HH:mm format for input fields
 */
export function parseTimeForInput(timeStr: string): string {
  if (!timeStr) return '';
  
  try {
    // If already in HH:mm format, return as is
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    
    // Try to parse and format
    const date = new Date(`1970-01-01T${timeStr}`);
    if (isValid(date)) {
      return format(date, 'HH:mm');
    }
    
    // Try to extract time from string
    const match = timeStr.match(/(\d{1,2}:\d{2})/);
    if (match) {
      const date = new Date(`1970-01-01T${match[1]}:00`);
      if (isValid(date)) {
        return format(date, 'HH:mm');
      }
    }
    
    return timeStr;
  } catch (error) {
    console.error('Error parsing time for input:', timeStr, error);
    return timeStr;
  }
}

/**
 * Format date for month display (e.g., "January 2025")
 */
export function formatMonth(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  return format(date, 'MMMM yyyy');
}

/**
 * Format date for day display (e.g., "Mon, Jan 1")
 */
export function formatDay(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  return format(date, 'EEE, MMM d');
}

/**
 * Get duration between two dates in days
 */
export function getDurationInDays(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!start || !end) return 0;
  
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Check if a date is within a date range
 */
export function isDateInRange(dateStr: string, startDate: string, endDate: string): boolean {
  const date = parseDate(dateStr);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!date || !start || !end) return false;
  
  return date >= start && date <= end;
}

/**
 * Get the next occurrence of a date (for recurring events)
 */
export function getNextOccurrence(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  
  const today = new Date();
  if (date >= today) return dateStr;
  
  // Add one year to get next occurrence
  const nextYear = new Date(date);
  nextYear.setFullYear(today.getFullYear() + 1);
  
  return format(nextYear, 'yyyy-MM-dd');
}

// Export commonly used date-fns functions for convenience
export { format, parse, isValid, parseISO, compareAsc, isToday, isTomorrow, isAfter, startOfToday }; 