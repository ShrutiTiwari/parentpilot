import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface School {
  id: string;
  name: string;
  location?: string;
  website_url?: string;
  logo_url?: string;
  student_count?: number;
  established_year?: number;
}

interface IntegratedSchoolsRollerProps {
  variant?: 'landing' | 'dashboard';
  className?: string;
}

// Mock integrated schools data - this should come from API/database
const integratedSchools: School[] = [
  {
    id: '1',
    name: 'Dartford Grammar School for Girls',
    location: 'Dartford, Kent',
    website_url: 'https://www.dartfordgrammargirls.org.uk/',
    student_count: 1200,
    established_year: 1904
  },
  {
    id: '2',
    name: 'Blackheath Preparatory School',
    location: 'Blackheath, London',
    website_url: 'https://www.blackheathprep.com/',
    student_count: 450,
    established_year: 1895
  },
  {
    id: '3',
    name: 'Tiffin Girls School',
    location: 'Kingston upon Thames',
    website_url: 'https://www.tiffingirls.org.uk/',
    student_count: 1400,
    established_year: 1943
  },
  {
    id: '4',
    name: 'St. Mary\'s Catholic Primary',
    location: 'Greenwich, London',
    student_count: 320,
    established_year: 1856
  },
  {
    id: '5',
    name: 'The Royal Grammar School',
    location: 'Guildford, Surrey',
    student_count: 950,
    established_year: 1509
  },
  {
    id: '6',
    name: 'Colfe\'s School',
    location: 'Lee, London',
    student_count: 1100,
    established_year: 1652
  },
  {
    id: '7',
    name: 'Bexley Grammar School',
    location: 'Bexley, Kent',
    student_count: 1050,
    established_year: 1955
  }
];

export function IntegratedSchoolsRoller({ variant = 'dashboard', className }: IntegratedSchoolsRollerProps) {
  const isLanding = variant === 'landing';

  // Get school initials for logo fallback
  const getSchoolInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
  };

  // Create duplicate array for seamless loop
  const schoolsForRolling = [...integratedSchools, ...integratedSchools];

  return (
    <div className={cn(
      "relative overflow-hidden",
      isLanding ? "py-16 bg-gradient-to-r from-blue-50 via-white to-purple-50" : "py-8",
      className
    )}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className={cn(
          "font-bold mb-2",
          isLanding ? "text-3xl md:text-4xl text-gray-900" : "text-2xl text-gray-800"
        )}>
          Trusted by Schools Across the UK
        </h2>
        <p className={cn(
          "text-gray-600",
          isLanding ? "text-lg max-w-2xl mx-auto" : "text-base"
        )}>
          {isLanding
            ? "Join hundreds of schools and thousands of families using PowerParent to stay organized and connected."
            : "Your school events are automatically synchronized with our integrated partners."
          }
        </p>
      </div>

      {/* Rolling Animation Container */}
      <div className="relative">
        <div className="flex animate-scroll gap-6">
          {schoolsForRolling.map((school, index) => (
            <Card
              key={`${school.id}-${index}`}
              className={cn(
                "flex-shrink-0 p-4 transition-all hover:shadow-lg cursor-pointer",
                isLanding ? "w-80 bg-white/80 backdrop-blur-sm" : "w-72 bg-white",
                "border border-gray-200 hover:border-blue-300"
              )}
            >
              <div className="flex items-start gap-4">
                {/* School Logo/Initials */}
                <div className={cn(
                  "flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-white",
                  isLanding ? "w-12 h-12 text-lg" : "w-10 h-10 text-sm",
                  "bg-gradient-to-br from-blue-600 to-blue-800"
                )}>
                  {school.logo_url ? (
                    <img
                      src={school.logo_url}
                      alt={`${school.name} logo`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    getSchoolInitials(school.name)
                  )}
                </div>

                {/* School Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold text-gray-900 mb-1 leading-tight",
                    isLanding ? "text-base" : "text-sm"
                  )}>
                    {school.name}
                  </h3>

                  {school.location && (
                    <p className={cn(
                      "text-gray-600 mb-2",
                      isLanding ? "text-sm" : "text-xs"
                    )}>
                      📍 {school.location}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {school.student_count && (
                      <span>👥 {school.student_count.toLocaleString()} students</span>
                    )}
                    {school.established_year && (
                      <span>🏛️ Est. {school.established_year}</span>
                    )}
                  </div>

                  {isLanding && school.website_url && (
                    <a
                      href={school.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
              </div>

              {/* Integration Status Badge */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className={cn(
                  "inline-block px-2 py-1 rounded-full text-xs font-medium",
                  "bg-green-100 text-green-800"
                )}>
                  ✓ Fully Integrated
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Fade overlays for seamless effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      </div>

      {/* Stats Footer */}
      {isLanding && (
        <div className="mt-12 text-center">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {integratedSchools.length}+
              </div>
              <div className="text-sm text-gray-600">Schools</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {integratedSchools.reduce((acc, school) => acc + (school.student_count || 0), 0).toLocaleString()}+
              </div>
              <div className="text-sm text-gray-600">Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-1">98%</div>
              <div className="text-sm text-gray-600">Satisfaction</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}