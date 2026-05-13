/**
 * Music Exam Board Constants
 * Centralized configuration for exam board names and URLs
 */

export const MUSIC_BOARDS = {
  ABRSM: 'abrsm',
  // Future boards can be added here:
  // TRINITY: 'trinity',
  // LCM: 'lcm',
  // ROCKSCHOOL: 'rockschool',
} as const;

export const DEFAULT_BOARD = MUSIC_BOARDS.ABRSM;

/**
 * Default grade for music learners when no grade is specified
 */
export const DEFAULT_GRADE = 3;
export const INITIAL_GRADE = 0;

/**
 * Music modules (regular grades)
 * Central source of truth for module route segments
 */
export const MUSIC_MODULES = {
  SCALES: 'scales',
  PIECES: 'pieces',
  SIGHT_READING: 'sightreading',
  AURAL: 'aural',
  THEORY: 'theory',
  STATS: 'stats',
} as const;

export type MusicModule = typeof MUSIC_MODULES[keyof typeof MUSIC_MODULES];

/**
 * Post Grade 8 modules
 */
export const POST_GRADE8_MODULES = {
  REPERTOIRE: 'repertoire',
  GOALS: 'goals',
  NOTES: 'notes',
  STATS: 'stats',
} as const;

export type PostGrade8Module = typeof POST_GRADE8_MODULES[keyof typeof POST_GRADE8_MODULES];

export const BOARD_DISPLAY_NAMES = {
  [MUSIC_BOARDS.ABRSM]: 'ABRSM',
  // [MUSIC_BOARDS.TRINITY]: 'Trinity',
  // [MUSIC_BOARDS.LCM]: 'LCM',
  // [MUSIC_BOARDS.ROCKSCHOOL]: 'Rockschool',
} as const;

export const BOARD_DESCRIPTIONS = {
  [MUSIC_BOARDS.ABRSM]: 'Associated Board of the Royal Schools of Music',
  // [MUSIC_BOARDS.TRINITY]: 'Trinity College London',
  // [MUSIC_BOARDS.LCM]: 'London College of Music',
  // [MUSIC_BOARDS.ROCKSCHOOL]: 'Rockschool',
} as const;

/**
 * URL path segments for boards
 */
export const BOARD_URL_SEGMENTS = {
  [MUSIC_BOARDS.ABRSM]: 'abrsm',
  // [MUSIC_BOARDS.TRINITY]: 'trinity',
  // [MUSIC_BOARDS.LCM]: 'lcm',
  // [MUSIC_BOARDS.ROCKSCHOOL]: 'rockschool',
} as const;

/**
 * Get the URL segment for a specific board
 */
export const getBoardUrlSegment = (board: keyof typeof MUSIC_BOARDS): string => {
  return BOARD_URL_SEGMENTS[board];
};

/**
 * Get the display name for a specific board
 */
export const getBoardDisplayName = (board: keyof typeof MUSIC_BOARDS): string => {
  return BOARD_DISPLAY_NAMES[board];
};

/**
 * Get the description for a specific board
 */
export const getBoardDescription = (board: keyof typeof MUSIC_BOARDS): string => {
  return BOARD_DESCRIPTIONS[board];
}; 