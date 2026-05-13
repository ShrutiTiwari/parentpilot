
export interface AgeTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    cardBackground: string;
    text: string;
    border: string;
  };
  styles: {
    borderRadius: string;
    cardShadow: string;
    buttonStyle: string;
    fontWeight: string;
  };
  animations: {
    hover: string;
    transition: string;
  };
}

export const ageThemes: Record<string, AgeTheme> = {
  early: {
    name: 'Playful Primary',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE6E6 100%)',
      cardBackground: '#FFFFFF',
      text: '#2D3436',
      border: '#FFB4B4',
    },
    styles: {
      borderRadius: '16px',
      cardShadow: '0 8px 25px rgba(255, 107, 107, 0.15)',
      buttonStyle: 'rounded-full',
      fontWeight: '600',
    },
    animations: {
      hover: 'hover:scale-105',
      transition: 'transition-all duration-300 ease-in-out',
    },
  },
  middle: {
    name: 'Adventure Explorer',
    colors: {
      primary: '#6C5CE7',
      secondary: '#00B894',
      accent: '#FDCB6E',
      background: 'linear-gradient(135deg, #F0F8FF 0%, #E6F3FF 100%)',
      cardBackground: '#FFFFFF',
      text: '#2D3436',
      border: '#A29BFE',
    },
    styles: {
      borderRadius: '12px',
      cardShadow: '0 6px 20px rgba(108, 92, 231, 0.12)',
      buttonStyle: 'rounded-lg',
      fontWeight: '500',
    },
    animations: {
      hover: 'hover:scale-102',
      transition: 'transition-all duration-250 ease-in-out',
    },
  },
  senior: {
    name: 'Focused Scholar',
    colors: {
      primary: '#0984E3',
      secondary: '#00B894',
      accent: '#E17055',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
      cardBackground: '#FFFFFF',
      text: '#2D3436',
      border: '#74B9FF',
    },
    styles: {
      borderRadius: '8px',
      cardShadow: '0 4px 15px rgba(9, 132, 227, 0.1)',
      buttonStyle: 'rounded-md',
      fontWeight: '500',
    },
    animations: {
      hover: 'hover:scale-101',
      transition: 'transition-all duration-200 ease-in-out',
    },
  },
  default: {
    name: 'Classic',
    colors: {
      primary: '#1EAEDB',
      secondary: '#00B894',
      accent: '#FDCB6E',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
      cardBackground: '#FFFFFF',
      text: '#2D3436',
      border: '#DDD',
    },
    styles: {
      borderRadius: '8px',
      cardShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      buttonStyle: 'rounded-md',
      fontWeight: '400',
    },
    animations: {
      hover: 'hover:scale-101',
      transition: 'transition-all duration-200 ease-in-out',
    },
  },
};

export const getAgeGroupFromYearGroup = (yearGroup: string): string => {
  if (!yearGroup) return 'default';
  
  const year = yearGroup.toLowerCase();
  
  // Early years (Reception, Year 1-2, Nursery)
  if (year.includes('reception') || year.includes('nursery') || 
      year.includes('year 1') || year.includes('year 2') ||
      year.includes('y1') || year.includes('y2')) {
    return 'early';
  }
  
  // Middle years (Year 3-6)
  if (year.includes('year 3') || year.includes('year 4') || 
      year.includes('year 5') || year.includes('year 6') ||
      year.includes('y3') || year.includes('y4') || 
      year.includes('y5') || year.includes('y6')) {
    return 'middle';
  }
  
  // Senior years (Year 7+)
  if (year.includes('year 7') || year.includes('year 8') || 
      year.includes('year 9') || year.includes('year 10') ||
      year.includes('year 11') || year.includes('year 12') ||
      year.includes('y7') || year.includes('y8') || 
      year.includes('y9') || year.includes('y10') ||
      year.includes('y11') || year.includes('y12')) {
    return 'senior';
  }
  
  return 'default';
};

export const getThemeForChild = (yearGroup: string): AgeTheme => {
  const ageGroup = getAgeGroupFromYearGroup(yearGroup);
  return ageThemes[ageGroup] || ageThemes.default;
};
