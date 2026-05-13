import { useState, useEffect } from 'react';

/**
 * Generic hook for persisting state to localStorage
 * Automatically syncs state with localStorage and handles expiration
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  expirationHours: number = 24
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsed = JSON.parse(item);

      // Check expiration
      if (parsed.timestamp) {
        const ageInHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
        if (ageInHours > expirationHours) {
          window.localStorage.removeItem(key);
          return initialValue;
        }
      }

      return parsed.value ?? initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const item = {
        value: valueToStore,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  };

  // Clear localStorage for this key
  const clearValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, clearValue];
}
