import { YearGroup } from '../components/dashboard/EventFilters';

/**
 * Standardized year group utilities for consistent use across the application
 * Aligned with database expectations and reusing existing YearGroup enum
 */

// Standard year group options for UK primary schools
export const STANDARD_YEAR_GROUPS: Array<{ value: string; label: string }> = [
  { value: 'All', label: 'All Events' },
  { value: 'Reception', label: 'Reception' },
  { value: 'Year 1', label: 'Year 1' },
  { value: 'Year 2', label: 'Year 2' },
  { value: 'Year 3', label: 'Year 3' },
  { value: 'Year 4', label: 'Year 4' },
  { value: 'Year 5', label: 'Year 5' },
  { value: 'Year 6', label: 'Year 6' },
  { value: 'Parents', label: 'Parents' },
  { value: 'Staff', label: 'Staff' },
];

// Extended year group options for schools with additional groups
export const EXTENDED_YEAR_GROUPS: Array<{ value: string; label: string }> = [
  ...STANDARD_YEAR_GROUPS,
  { value: 'Kindergarten', label: 'Kindergarten' },
  { value: 'Upper School', label: 'Upper School' },
  { value: 'Lower School', label: 'Lower School' },
  { value: 'EYFS', label: 'EYFS' },
  { value: 'Under 11', label: 'Under 11' },
  { value: 'Junior School', label: 'Junior School' },
  { value: 'Trip Participants', label: 'Trip Participants' },
];

// Basic year groups for personal events (Reception to Year 6)
export const PERSONAL_YEAR_GROUPS: Array<{ value: string; label: string }> = [
  { value: 'All', label: 'All Year Groups' },
  { value: 'Kindergarten', label: 'Kindergarten' },
  { value: 'Reception', label: 'Reception' },
  { value: 'Year 1', label: 'Year 1' },
  { value: 'Year 2', label: 'Year 2' },
  { value: 'Year 3', label: 'Year 3' },
  { value: 'Year 4', label: 'Year 4' },
  { value: 'Year 5', label: 'Year 5' },
  { value: 'Year 6', label: 'Year 6' },
];

/**
 * Get standardized year group options based on context
 * @param context - The context for which year groups are needed
 * @returns Array of year group options with value and label
 */
export function getYearGroupOptions(context: 'standard' | 'extended' | 'personal' = 'standard'): Array<{ value: string; label: string }> {
  switch (context) {
    case 'extended':
      return EXTENDED_YEAR_GROUPS;
    case 'personal':
      return PERSONAL_YEAR_GROUPS;
    case 'standard':
    default:
      return STANDARD_YEAR_GROUPS;
  }
}

/**
 * Get year group values only (for dropdowns that expect string arrays)
 * @param context - The context for which year groups are needed
 * @returns Array of year group values
 */
export function getYearGroupValues(context: 'standard' | 'extended' | 'personal' = 'standard'): string[] {
  return getYearGroupOptions(context).map(option => option.value);
}

/**
 * Get year group labels only
 * @param context - The context for which year groups are needed
 * @returns Array of year group labels
 */
export function getYearGroupLabels(context: 'standard' | 'extended' | 'personal' = 'standard'): string[] {
  return getYearGroupOptions(context).map(option => option.label);
}

/**
 * Validate if a year group is valid for a given context
 * @param yearGroup - The year group to validate
 * @param context - The context to validate against
 * @returns True if valid, false otherwise
 */
export function isValidYearGroup(yearGroup: string, context: 'standard' | 'extended' | 'personal' = 'standard'): boolean {
  const validValues = getYearGroupValues(context);
  return validValues.includes(yearGroup);
}

/**
 * Get the default year group for a given context
 * @param context - The context for which default is needed
 * @returns Default year group value
 */
export function getDefaultYearGroup(context: 'standard' | 'extended' | 'personal' = 'standard'): string {
  switch (context) {
    case 'personal':
      return 'Year 1'; // Default for personal events
    case 'extended':
    case 'standard':
    default:
      return 'All'; // Default for school events
  }
}

/**
 * Map year group to YearGroup enum value
 * @param yearGroup - The year group string
 * @returns YearGroup enum value or undefined if not found
 */
export function mapToYearGroupEnum(yearGroup: string): YearGroup | undefined {
  const yearGroupMap: Record<string, YearGroup> = {
    'All': YearGroup.All,
    'Reception': YearGroup.Reception,
    'Year 1': YearGroup.Year1,
    'Year 2': YearGroup.Year2,
    'Year 3': YearGroup.Year3,
    'Year 4': YearGroup.Year4,
    'Year 5': YearGroup.Year5,
    'Year 6': YearGroup.Year6,
    'Parents': YearGroup.Parents,
    'Kindergarten': YearGroup.Kindergarten,
    'Upper School': YearGroup.UpperSchool,
    'Lower School': YearGroup.LowerSchool,
    'EYFS': YearGroup.EYFS,
    'Under 11': YearGroup.Under11,
    'Staff': YearGroup.Staff,
    'Junior School': YearGroup.JuniorSchool,
    'Trip Participants': YearGroup.TripParticipants,
  };
  
  return yearGroupMap[yearGroup];
}

/**
 * Get year group options for React Select components
 * @param context - The context for which year groups are needed
 * @returns Array formatted for React Select
 */
export function getYearGroupSelectOptions(context: 'standard' | 'extended' | 'personal' = 'standard') {
  return getYearGroupOptions(context).map(option => ({
    value: option.value,
    label: option.label
  }));
}

/**
 * Get year group options for HTML select elements
 * @param context - The context for which year groups are needed
 * @returns Array formatted for HTML select
 */
export function getYearGroupHtmlOptions(context: 'standard' | 'extended' | 'personal' = 'standard') {
  return getYearGroupOptions(context).map(option => ({
    value: option.value,
    children: option.label
  }));
}

/**
 * Convert year group data from database format to application format
 * Handles both old year_group string and new year_groups array fields
 * @param yearGroup - The old year_group string field
 * @param yearGroups - The new year_groups array field
 * @returns Array of year groups, prioritizing the new array field
 */
export function getYearGroupsFromDatabase(yearGroup?: string | null, yearGroups?: string[] | null): string[] {
  // If year_groups array is available and not empty, use it
  if (yearGroups && yearGroups.length > 0) {
    return yearGroups;
  }
  
  // Fall back to the old year_group string field
  if (yearGroup) {
    return [yearGroup];
  }
  
  // Default to empty array
  return [];
}

/**
 * Convert year group data to database format
 * @param yearGroups - Array of year groups
 * @returns Object with both old and new fields for backward compatibility
 */
export function convertYearGroupsToDatabase(yearGroups: string[]): {
  year_group?: string;
  year_groups?: string[];
} {
  if (!yearGroups || yearGroups.length === 0) {
    return {
      year_group: undefined,
      year_groups: undefined
    };
  }
  
  return {
    year_group: yearGroups[0], // Keep first value in old field for backward compatibility
    year_groups: yearGroups
  };
}

/**
 * Get the primary year group (first one) from an array
 * Useful for display purposes where you need a single value
 * @param yearGroups - Array of year groups
 * @returns The first year group or undefined
 */
export function getPrimaryYearGroup(yearGroups: string[]): string | undefined {
  return yearGroups && yearGroups.length > 0 ? yearGroups[0] : undefined;
}

/**
 * Check if a year group is included in an array of year groups
 * @param targetYearGroup - The year group to check for
 * @param yearGroups - Array of year groups to search in
 * @returns True if the year group is found
 */
export function isYearGroupIncluded(targetYearGroup: string, yearGroups: string[]): boolean {
  return yearGroups && yearGroups.includes(targetYearGroup);
}

/**
 * Merge year groups arrays, removing duplicates
 * @param yearGroupsArrays - Arrays of year groups to merge
 * @returns Merged array with unique values
 */
export function mergeYearGroups(...yearGroupsArrays: (string[] | undefined | null)[]): string[] {
  const allYearGroups = yearGroupsArrays
    .filter((arr): arr is string[] => arr !== undefined && arr !== null)
    .flat();
  
  return [...new Set(allYearGroups)];
}

/**
 * Check if an event matches a selected year group filter
 * @param event - The event to check
 * @param selectedYearGroup - The selected year group filter
 * @returns True if the event matches the filter
 */
export function eventMatchesYearGroupFilter(event: any, selectedYearGroup: string): boolean {
  if (selectedYearGroup === 'All') return true;
  
  // Get year groups from the event (handles both old and new fields)
  const yearGroups = getYearGroupsFromDatabase(
    typeof event.yearGroup === 'string' ? event.yearGroup : undefined,
    event.yearGroups
  );
  
  // Check if the selected year group is in the event's year groups
  return yearGroups.includes(selectedYearGroup) || 
         yearGroups.includes('All') || 
         yearGroups.includes('Parents');
}

/**
 * Parse compound year groups into individual year groups
 * Examples: "Year 2-4" -> ["Year 2", "Year 3", "Year 4"]
 *          "Year 1, Year 3-5" -> ["Year 1", "Year 3", "Year 4", "Year 5"]
 * @param yearGroupString - The year group string to parse
 * @returns Array of individual year groups
 */
export function parseCompoundYearGroups(yearGroupString: string): string[] {
  if (!yearGroupString) return [];
  
  const yearGroups: string[] = [];
  const parts = yearGroupString.split(/[,\s]+/).filter(Boolean);
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    // Check if it's a range like "Year 2-4"
    const rangeMatch = trimmed.match(/^Year\s+(\d+)-(\d+)$/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      
      if (start <= end && start >= 1 && end <= 13) { // Reasonable year range
        for (let year = start; year <= end; year++) {
          yearGroups.push(`Year ${year}`);
        }
        continue;
      }
    }
    
    // Check if it's a single year like "Year 2"
    const singleMatch = trimmed.match(/^Year\s+(\d+)$/i);
    if (singleMatch) {
      const year = parseInt(singleMatch[1]);
      if (year >= 1 && year <= 13) {
        yearGroups.push(`Year ${year}`);
        continue;
      }
    }
    
    // Check for other special year groups
    const specialGroups = [
      'All', 'Reception', 'Kindergarten', 'Parents', 'Staff',
      'Upper School', 'Lower School', 'EYFS', 'Under 11', 
      'Junior School', 'Trip Participants'
    ];
    
    if (specialGroups.some(group => 
      trimmed.toLowerCase() === group.toLowerCase()
    )) {
      yearGroups.push(trimmed);
      continue;
    }
    
    // If no pattern matches, add as-is
    yearGroups.push(trimmed);
  }
  
  // Remove duplicates and return
  return [...new Set(yearGroups)];
} 