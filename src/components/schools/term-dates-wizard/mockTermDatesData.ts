// Mock data for Dartford Grammar Girls School term dates
export const mockExtractedEvents = [
  {
    title: "STAFF TRAINING DAY",
    startDate: "2025-09-01",
    endDate: "2025-09-01",
    type: "training" as const,
    description: "Staff training day - school closed to students"
  },
  {
    title: "STAFF TRAINING DAY",
    startDate: "2025-09-02",
    endDate: "2025-09-02",
    type: "training" as const,
    description: "Staff training day - school closed to students"
  },
  {
    title: "TERM 1",
    startDate: "2025-09-03",
    endDate: "2025-10-24",
    type: "term" as const,
    description: "First term of the academic year"
  },
  {
    title: "STAFF TRAINING DAY",
    startDate: "2025-10-03",
    endDate: "2025-10-03",
    type: "training" as const,
    description: "Staff training day - school closed to students"
  },
  {
    title: "Half Term Holiday",
    startDate: "2025-10-27",
    endDate: "2025-11-04",
    type: "holiday" as const,
    description: "October half term break"
  },
  {
    title: "STAFF TRAINING DAY",
    startDate: "2025-11-05",
    endDate: "2025-11-05",
    type: "training" as const,
    description: "Staff training day - school closed to students"
  },
  {
    title: "TERM 2",
    startDate: "2025-11-06",
    endDate: "2025-12-19",
    type: "term" as const,
    description: "Second term"
  },
  {
    title: "Christmas Holiday",
    startDate: "2025-12-22",
    endDate: "2026-01-02",
    type: "holiday" as const,
    description: "Christmas and New Year break"
  },
  {
    title: "TERM 3",
    startDate: "2026-01-05",
    endDate: "2026-02-13",
    type: "term" as const,
    description: "Third term"
  },
  {
    title: "February Half Term",
    startDate: "2026-02-16",
    endDate: "2026-02-20",
    type: "holiday" as const,
    description: "February half term break"
  },
  {
    title: "TERM 4",
    startDate: "2026-02-23",
    endDate: "2026-04-02",
    type: "term" as const,
    description: "Fourth term"
  },
  {
    title: "Easter Holiday",
    startDate: "2026-04-03",
    endDate: "2026-04-15",
    type: "holiday" as const,
    description: "Easter break"
  },
  {
    title: "TERM 5",
    startDate: "2026-04-16",
    endDate: "2026-05-22",
    type: "term" as const,
    description: "Fifth term"
  },
  {
    title: "Bank Holiday",
    startDate: "2026-05-04",
    endDate: "2026-05-04",
    type: "holiday" as const,
    description: "May Day bank holiday"
  },
  {
    title: "May Half Term",
    startDate: "2026-05-25",
    endDate: "2026-05-29",
    type: "holiday" as const,
    description: "May half term break"
  },
  {
    title: "TERM 6",
    startDate: "2026-06-01",
    endDate: "2026-07-17",
    type: "term" as const,
    description: "Final term of the academic year"
  },
  {
    title: "STAFF TRAINING DAY",
    startDate: "2026-07-20",
    endDate: "2026-07-20",
    type: "training" as const,
    description: "Staff training day - school closed to students"
  },
  {
    title: "STAFF TRAINING DAY",
    startDate: "2026-07-21",
    endDate: "2026-07-21",
    type: "training" as const,
    description: "Staff training day - school closed to students"
  }
];

export const mockRawDataSample = `Term Dates 2025-2026
STAFF TRAINING DAY Monday 1st September 2025
STAFF TRAINING DAY Tuesday 2nd September 2025
TERM 1 Wednesday 3rd September 2025 to Friday 24th October 2025
STAFF TRAINING DAY Friday 3rd October 2025
HOLIDAY Monday 27th October 2025 to Tuesday 4th November 2025
STAFF TRAINING DAY Wednesday 5th November 2025
TERM 2 Thursday 6th November 2025 to Friday 19th December 2025
HOLIDAY Monday 22nd December 2025 to Friday 2nd January 2026
TERM 3 Monday 5th January 2026 to Friday 13th February 2026
HOLIDAY Monday 16th February 2026 to Friday 20th February 2026
TERM 4 Monday 23th February 2026 to Thursday 2nd April 2026
HOLIDAY Friday 3rd April 2026 to Wednesday 15th April 2026
TERM 5 Thursday 16th April 2026 to Friday 22nd May 2026
HOLIDAY Monday 4th May 2026 – Bank Holiday
HOLIDAY Monday 25th May 2026 to Friday 29th May 2026
TERM 6 Monday 1st June 2026 to Friday 17th July 2026
STAFF TRAINING DAY Monday 20th July 2026
STAFF TRAINING DAY Tuesday 21st July 2026`;