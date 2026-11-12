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
    // Was identical to holiday/trip's orange (#F97316) — all three
    // indistinguishable at a glance. Shifted to pink/magenta, which also
    // reads more "party" than "orange" does.
    gradient: 'bg-gradient-to-r from-[#FEF7CD] to-[#FBCFE8]',
    textColor: 'text-[#DB2777]',
    borderColor: 'border-[#F472B6]/30',
    tagBg: 'bg-[#FCE7F3]/60',
    tagText: 'text-[#DB2777]',
  },
  'parent event': {
    gradient: 'bg-white/10',
    textColor: 'text-[#D946EF]',
    borderColor: 'border-[#FDA4AF]/20',
    tagBg: 'bg-[#FFDEE2]/10',
    tagText: 'text-[#D946EF]',
  },
  trip: {
    // Was identical to holiday's orange (#F97316). Shifted to brown/tan —
    // suitcase/travel-coded, distinct from both holiday and birthday now.
    gradient: 'bg-gradient-to-r from-[#FAF0E6] to-[#F0DFC8]',
    textColor: 'text-[#92400E]',
    borderColor: 'border-[#D6A86A]/30',
    tagBg: 'bg-[#F5E6D3]/60',
    tagText: 'text-[#92400E]',
  },
  // The categories below previously had no dedicated style at all — any
  // event with one of these category values silently fell back to
  // `general`'s plain look, which made the category picker and the actual
  // card contradict each other (you could select "Exam" but the card
  // never looked any different). Colors chosen to not collide with any
  // existing category above.
  exam: {
    gradient: 'bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A]',
    textColor: 'text-[#D97706]',
    borderColor: 'border-[#FBBF24]/30',
    tagBg: 'bg-[#FEF3C7]/60',
    tagText: 'text-[#D97706]',
  },
  club: {
    gradient: 'bg-gradient-to-r from-[#CCFBF1] to-[#99F6E4]',
    textColor: 'text-[#0D9488]',
    borderColor: 'border-[#2DD4BF]/30',
    tagBg: 'bg-[#CCFBF1]/60',
    tagText: 'text-[#0D9488]',
  },
  meeting: {
    gradient: 'bg-gradient-to-r from-[#F1F5F9] to-[#E2E8F0]',
    textColor: 'text-[#64748B]',
    borderColor: 'border-[#94A3B8]/30',
    tagBg: 'bg-[#F1F5F9]/60',
    tagText: 'text-[#64748B]',
  },
  academic: {
    gradient: 'bg-gradient-to-r from-[#E0E7FF] to-[#C7D2FE]',
    textColor: 'text-[#4F46E5]',
    borderColor: 'border-[#818CF8]/30',
    tagBg: 'bg-[#E0E7FF]/60',
    tagText: 'text-[#4F46E5]',
  },
  competition: {
    // Was too close to exam's amber (#D97706 vs #CA8A04 — both gold/amber,
    // hard to tell apart at a glance). Shifted toward a deeper, more
    // "trophy gold" bronze tone instead.
    gradient: 'bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7]',
    textColor: 'text-[#A16207]',
    borderColor: 'border-[#EAB308]/40',
    tagBg: 'bg-[#FEF9C3]/70',
    tagText: 'text-[#A16207]',
  },
  parents: {
    gradient: 'bg-gradient-to-r from-[#EDE9FE] to-[#DDD6FE]',
    textColor: 'text-[#7C3AED]',
    borderColor: 'border-[#A78BFA]/30',
    tagBg: 'bg-[#EDE9FE]/60',
    tagText: 'text-[#7C3AED]',
  },
  report: {
    gradient: 'bg-gradient-to-r from-[#CFFAFE] to-[#A5F3FC]',
    textColor: 'text-[#0891B2]',
    borderColor: 'border-[#22D3EE]/30',
    tagBg: 'bg-[#CFFAFE]/60',
    tagText: 'text-[#0891B2]',
  },
  other: {
    gradient: 'bg-white/10',
    textColor: 'text-[#6B7280]',
    borderColor: 'border-[#9CA3AF]/20',
    tagBg: 'bg-[#F3F4F6]/40',
    tagText: 'text-[#6B7280]',
  },
  family: {
    // Dusty lavender-gray — distinct from sports' green and from trip's
    // brown (which shares this same warm-tone family at a glance).
    gradient: 'bg-gradient-to-r from-[#F5F3FF] to-[#E9E4F7]',
    textColor: 'text-[#6D5B9E]',
    borderColor: 'border-[#A78BCF]/30',
    tagBg: 'bg-[#F5F3FF]/60',
    tagText: 'text-[#6D5B9E]',
  },
  // "appointment" intentionally has no dedicated style here — it's meant to
  // stay the plain, neutral catch-all for non-medical personal appointments
  // now that "medical" exists specifically to stand out from it.
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
