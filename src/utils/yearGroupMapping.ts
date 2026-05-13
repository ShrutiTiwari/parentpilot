import { YearGroup } from '../components/dashboard/EventFilters';

const yearGroupMap: Record<string, YearGroup> = {
  'all': YearGroup.All,
  'reception': YearGroup.Reception,
  'year 1': YearGroup.Year1,
  'year 2': YearGroup.Year2,
  'year 3': YearGroup.Year3,
  'year 4': YearGroup.Year4,
  'year 5': YearGroup.Year5,
  'year 6': YearGroup.Year6,
  'parents': YearGroup.Parents,
  'kindergarten': YearGroup.Kindergarten,
  'upper school': YearGroup.UpperSchool,
  'lower school': YearGroup.LowerSchool,
  'eyfs': YearGroup.EYFS,
  'under 11': YearGroup.Under11,
  'staff': YearGroup.Staff,
  'junior school': YearGroup.JuniorSchool,
  'trip participants': YearGroup.TripParticipants,
};

export function mapToStandardYearGroup(input: string | string[]): YearGroup {
  if (Array.isArray(input)) {
    // If array, return the first mapped value or 'Other'
    for (const val of input) {
      const mapped = yearGroupMap[val.trim().toLowerCase()];
      if (mapped) return mapped;
    }
    return 'Other' as YearGroup;
  }
  const normalized = input.trim().toLowerCase();
  return yearGroupMap[normalized] || ('Other' as YearGroup);
} 