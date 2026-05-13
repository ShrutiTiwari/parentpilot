// utils/displayEvent.js

/**
 * Checks whether the user is allowed to see events.
 * @param {object} user - The user object (may be null/undefined).
 * @returns {boolean} - True if the user can see events.
 */
export const displayEvent = (user) => {
    return user?.email === 'skierti@gmail.com';
  };
  