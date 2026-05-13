
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AgeTheme, getThemeForChild, ageThemes } from '../utils/ageThemes';
import { useChildProfiles } from './ChildProfileContext';

interface AgeThemeContextValue {
  currentTheme: AgeTheme;
  setTheme: (theme: AgeTheme) => void;
  availableThemes: AgeTheme[];
}

const AgeThemeContext = createContext<AgeThemeContextValue | undefined>(undefined);

export const AgeThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { selectedProfile } = useChildProfiles();
  const [currentTheme, setCurrentTheme] = useState<AgeTheme>(ageThemes.default);

  useEffect(() => {
    if (selectedProfile?.yearGroup) {
      const theme = getThemeForChild(selectedProfile.yearGroup);
      setCurrentTheme(theme);
    } else {
      setCurrentTheme(ageThemes.default);
    }
  }, [selectedProfile]);

  const setTheme = (theme: AgeTheme) => {
    setCurrentTheme(theme);
  };

  const availableThemes = Object.values(ageThemes);

  const value: AgeThemeContextValue = {
    currentTheme,
    setTheme,
    availableThemes,
  };

  return (
    <AgeThemeContext.Provider value={value}>
      {children}
    </AgeThemeContext.Provider>
  );
};

export const useAgeTheme = () => {
  const context = useContext(AgeThemeContext);
  if (context === undefined) {
    throw new Error('useAgeTheme must be used within an AgeThemeProvider');
  }
  return context;
};
