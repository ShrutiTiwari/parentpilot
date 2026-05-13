import { Event } from './dateGrouping';

// Festival theme definitions
export const festivalThemes = {
  christmas: {
    name: 'Christmas',
    emoji: '🎄',
    colors: {
      background: 'from-red-600 to-red-800',
      cardBg: 'bg-gradient-to-br from-red-600 to-red-800',
      text: 'text-white',
      accent: 'text-red-100',
      border: 'border-red-400',
      shadow: 'shadow-lg shadow-red-500/30',
    },
    effects: {
      sparkles: '✨',
      glow: 'ring-2 ring-red-400/20 ring-offset-2',
      specialBadge: true,
    }
  },
  easter: {
    name: 'Easter',
    emoji: '🐰',
    colors: {
      background: 'from-purple-500 to-pink-500',
      cardBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
      text: 'text-white',
      accent: 'text-purple-100',
      border: 'border-purple-400',
      shadow: 'shadow-lg shadow-purple-500/30',
    },
    effects: {
      sparkles: '🌸',
      glow: 'ring-2 ring-purple-400/20 ring-offset-2',
      specialBadge: true,
    }
  },
  halloween: {
    name: 'Halloween',
    emoji: '🎃',
    colors: {
      background: 'from-orange-600 to-gray-900',
      cardBg: 'bg-gradient-to-br from-orange-600 to-gray-900',
      text: 'text-white',
      accent: 'text-orange-100',
      border: 'border-orange-400',
      shadow: 'shadow-lg shadow-orange-500/30',
    },
    effects: {
      sparkles: '👻',
      glow: 'ring-2 ring-orange-400/20 ring-offset-2',
      specialBadge: true,
    }
  },
  diwali: {
    name: 'Diwali',
    emoji: '🪔',
    colors: {
      background: 'from-yellow-500 to-orange-600',
      cardBg: 'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600',
      text: 'text-white',
      accent: 'text-yellow-100',
      border: 'border-yellow-400',
      shadow: 'shadow-lg shadow-yellow-500/30',
    },
    effects: {
      sparkles: '✨',
      glow: 'ring-2 ring-yellow-400/30 ring-offset-2',
      specialBadge: true,
    }
  },
  holi: {
    name: 'Holi',
    emoji: '🎨',
    colors: {
      background: 'from-pink-500 to-purple-600',
      cardBg: 'bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500',
      text: 'text-white',
      accent: 'text-pink-100',
      border: 'border-pink-400',
      shadow: 'shadow-lg shadow-pink-500/30',
    },
    effects: {
      sparkles: '🌈',
      glow: 'ring-2 ring-pink-400/30 ring-offset-2',
      specialBadge: true,
    }
  },
  eid: {
    name: 'Eid',
    emoji: '🌙',
    colors: {
      background: 'from-emerald-500 to-teal-600',
      cardBg: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600',
      text: 'text-white',
      accent: 'text-emerald-100',
      border: 'border-emerald-400',
      shadow: 'shadow-lg shadow-emerald-500/30',
    },
    effects: {
      sparkles: '⭐',
      glow: 'ring-2 ring-emerald-400/30 ring-offset-2',
      specialBadge: true,
    }
  },
  holiday: {
    name: 'School Holiday',
    emoji: '🏖️',
    colors: {
      background: 'from-sky-400 to-blue-600',
      cardBg: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
      text: 'text-white',
      accent: 'text-sky-100',
      border: 'border-sky-400',
      shadow: 'shadow-xl shadow-sky-500/40',
    },
    effects: {
      sparkles: '🌟',
      glow: 'ring-4 ring-sky-400/40 ring-offset-4',
      specialBadge: true,
    }
  },
  summerHoliday: {
    name: 'Summer Holiday',
    emoji: '☀️',
    colors: {
      background: 'from-yellow-400 to-orange-500',
      cardBg: 'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500',
      text: 'text-white',
      accent: 'text-yellow-100',
      border: 'border-yellow-400',
      shadow: 'shadow-xl shadow-orange-500/40',
    },
    effects: {
      sparkles: '🌴',
      glow: 'ring-4 ring-yellow-400/40 ring-offset-4',
      specialBadge: true,
    }
  },
  default: {
    name: 'Default',
    emoji: '',
    colors: {
      background: '',
      cardBg: '',
      text: '',
      accent: '',
      border: '',
      shadow: '',
    },
    effects: {
      sparkles: '',
      glow: '',
      specialBadge: false,
    }
  }
} as const;

export type FestivalThemeType = keyof typeof festivalThemes;

// Festival detection logic
export const detectFestivalTheme = (event: Event): FestivalThemeType => {
  const title = event.title.toLowerCase();
  const date = new Date(event.date);
  const month = date.getMonth() + 1; // 1-based month
  const day = date.getDate();

  // Helper function to check for whole word matches
  const hasWord = (text: string, word: string): boolean => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  };

  // Christmas detection
  if (
    title.includes('christmas') ||
    title.includes('xmas') ||
    title.includes('nativity') ||
    title.includes('boxing day') ||
    (month === 12 && (day === 24 || day === 25 || day === 26))
  ) {
    return 'christmas';
  }

  // Easter detection (basic - could be enhanced with proper Easter date calculation)
  if (
    title.includes('easter') ||
    title.includes('egg hunt') ||
    title.includes('bunny') ||
    title.includes('good friday') ||
    title.includes('easter monday')
  ) {
    return 'easter';
  }

  // Halloween detection
  if (
    title.includes('halloween') ||
    title.includes('trick or treat') ||
    title.includes('pumpkin') ||
    title.includes('spooky') ||
    (month === 10 && day === 31)
  ) {
    return 'halloween';
  }

  // Diwali detection
  if (
    title.includes('diwali') ||
    title.includes('deepavali') ||
    title.includes('deepawali') ||
    title.includes('festival of lights') ||
    title.includes('lakshmi puja')
  ) {
    return 'diwali';
  }

  // Holi detection
  if (
    hasWord(title, 'holi') ||
    title.includes('festival of colors') ||
    title.includes('festival of colour') ||
    hasWord(title, 'rang') ||
    hasWord(title, 'gulal')
  ) {
    return 'holi';
  }

  // Eid detection
  if (
    hasWord(title, 'eid') ||
    title.includes('eid al-fitr') ||
    title.includes('eid al-adha') ||
    title.includes('eid ul-fitr') ||
    title.includes('eid ul-adha') ||
    title.includes('ramadan')
  ) {
    return 'eid';
  }

  // Summer Holiday detection
  if (
    title.includes('summer holiday') ||
    title.includes('summer break') ||
    title.includes('summer vacation') ||
    (month === 7 || month === 8) && (
      title.includes('holiday') ||
      title.includes('break') ||
      title.includes('vacation')
    )
  ) {
    return 'summerHoliday';
  }

  // General Holiday detection (half term, winter break, spring break etc.)
  if (
    title.includes('half term') ||
    title.includes('winter holiday') ||
    title.includes('winter break') ||
    title.includes('spring holiday') ||
    title.includes('spring break') ||
    title.includes('autumn holiday') ||
    title.includes('autumn break') ||
    title.includes('term break') ||
    title.includes('term ends') ||
    title.includes('school holiday') ||
    (event.category === 'holiday' && !title.includes('christmas') && !title.includes('easter'))
  ) {
    return 'holiday';
  }

  return 'default';
};

// Get festival theme for event
export const getFestivalTheme = (event: Event) => {
  const themeType = detectFestivalTheme(event);
  const theme = festivalThemes[themeType];
  const isFestival = themeType !== 'default';

  return {
    themeType,
    theme,
    isFestival,
    emoji: theme.emoji,
    name: theme.name,
    colors: theme.colors,
    effects: theme.effects,
  };
};