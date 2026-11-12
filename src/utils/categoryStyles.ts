type CategoryStyle = {
  gradient: string;
  textColor: string;
  borderColor: string;
  tagBg: string;
  tagText: string;
};

type CategoryStyleMap = {
  [key: string]: CategoryStyle;
};

export const categoryStyles: CategoryStyleMap = {
  // Medical appointments (vaccinations, GP, dentist) previously fell back to
  // `general`'s neutral style and were visually indistinguishable from any
  // other event. First pass used a saturated red, which read as "alarm"
  // rather than "medical" — switched to a calmer clinical slate-blue,
  // distinct from swimming's brighter sky blue (#0EA5E9), paired with a
  // larger, more prominent stethoscope icon so it still stands out clearly.
  medical: {
    gradient: 'bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE]',
    textColor: 'text-[#2563EB]',
    borderColor: 'border-[#60A5FA]/30',
    tagBg: 'bg-[#DBEAFE]/60',
    tagText: 'text-[#2563EB]',
  },
  holiday: {
    gradient: 'bg-white/10',
    textColor: 'text-[#F97316]',
    borderColor: 'border-[#FEC6A1]/20',
    tagBg: 'bg-[#FEC6A1]/10',
    tagText: 'text-[#F97316]',
  },
  swimming: {
    gradient: 'bg-gradient-to-r from-[#D3E4FD] to-[#E5F5FF]',
    textColor: 'text-[#0EA5E9]',
    borderColor: 'border-[#1EAEDB]/20',
    tagBg: 'bg-[#D3E4FD]/10',
    tagText: 'text-[#0EA5E9]',
  },
  sports: {
    gradient: 'bg-gradient-to-r from-[#F2FCE2] to-[#DCFCE7]',
    textColor: 'text-[#22C55E]',
    borderColor: 'border-[#86EFAC]/20',
    tagBg: 'bg-[#F2FCE2]/10',
    tagText: 'text-[#22C55E]',
  },
  music: {
    gradient: 'bg-gradient-to-r from-[#E5DEFF] to-[#F3E8FF]',
    textColor: 'text-[#8B5CF6]',
    borderColor: 'border-[#C4B5FD]/20',
    tagBg: 'bg-[#E5DEFF]/10',
    tagText: 'text-[#8B5CF6]',
  },
  drama: {
    gradient: 'bg-gradient-to-r from-[#FFE4E1] to-[#FFDAB9]',
    textColor: 'text-[#E11D48]',
    borderColor: 'border-[#FB7185]/20',
    tagBg: 'bg-[#FFE4E1]/10',
    tagText: 'text-[#E11D48]',
  },
  dance: {
    gradient: 'bg-gradient-to-r from-[#FFDEE2] to-[#FDE1D3]',
    textColor: 'text-[#D946EF]',
    borderColor: 'border-[#FDA4AF]/20',
    tagBg: 'bg-[#FFDEE2]/10',
    tagText: 'text-[#D946EF]',
  },
  birthday: {
    gradient: 'bg-gradient-to-r from-[#FEF7CD] to-[#FEC6A1]',
    textColor: 'text-[#F97316]',
    borderColor: 'border-[#FEC6A1]/20',
    tagBg: 'bg-[#FFE29F]/10',
    tagText: 'text-[#F97316]',
  },
  'parent event': {
    gradient: 'bg-white/10',
    textColor: 'text-[#D946EF]',
    borderColor: 'border-[#FDA4AF]/20',
    tagBg: 'bg-[#FFDEE2]/10',
    tagText: 'text-[#D946EF]',
  },
  trip: {
    gradient: 'bg-white/10',
    textColor: 'text-[#F97316]',
    borderColor: 'border-[#FEC6A1]/20',
    tagBg: 'bg-[#FFE29F]/10',
    tagText: 'text-[#F97316]',
  },
  general: {
    gradient: 'bg-white/10',
    textColor: 'text-[#221F26]',
    borderColor: 'border-[#1EAEDB]/10',
    tagBg: 'bg-[#D3E4FD]/10',
    tagText: 'text-[#1EAEDB]',
  },
};

export const getEventStyle = (category: string): CategoryStyle => {
  // Make sure to handle case-insensitive matching
  const normalizedCategory = category.toLowerCase();
  
  return categoryStyles[normalizedCategory] || categoryStyles.general;
};
