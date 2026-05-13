/**
 * Utility function to generate personalized titles
 * @param sectionName - The name of the section (e.g., "Scales", "Practice Progress")
 * @param learnerName - The full name of the learner (optional)
 * @param isDemoMode - Whether the app is in demo mode (optional)
 * @returns Personalized title string
 */
export function getPersonalizedTitle(
  sectionName: string,
  learnerName?: string,
  isDemoMode: boolean = false
): string {
  // In demo mode or when no learner name is provided, use "Your"
  if (isDemoMode || !learnerName) {
    return `Your ${sectionName}`;
  }
  
  // Extract first name and create personalized title
  const firstName = learnerName.split(' ')[0];
  return `${firstName}'s ${sectionName}`;
}

/**
 * Convenience function specifically for practice-related sections
 * @param sectionName - The name of the practice section
 * @param learnerName - The full name of the learner (optional)
 * @param isDemoMode - Whether the app is in demo mode (optional)
 * @returns Personalized practice title string
 */
export function getPracticeTitle(
  sectionName: string,
  learnerName?: string,
  isDemoMode: boolean = false
): string {
  return getPersonalizedTitle(sectionName, learnerName, isDemoMode);
}