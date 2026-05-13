import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface CountryData {
  name: string;
  percentage: number;
  users: number;
  cities: number;
  flagEmoji: string;
  coordinates: [number, number]; // [longitude, latitude]
}

const countryData: CountryData[] = [
  { name: 'United Kingdom', percentage: 64, users: 324, cities: 1700, flagEmoji: '🇬🇧', coordinates: [-2, 54] },
  { name: 'United States', percentage: 15, users: 78, cities: 304, flagEmoji: '🇺🇸', coordinates: [-95, 37] },
  { name: 'Malaysia', percentage: 3, users: 14, cities: 123, flagEmoji: '🇲🇾', coordinates: [102, 4] },
  { name: 'Singapore', percentage: 3, users: 14, cities: 35, flagEmoji: '🇸🇬', coordinates: [104, 1] },
  { name: 'Australia', percentage: 2, users: 10, cities: 34, flagEmoji: '🇦🇺', coordinates: [133, -27] },
  { name: 'Germany', percentage: 1, users: 7, cities: 28, flagEmoji: '🇩🇪', coordinates: [10, 51] },
  { name: 'Canada', percentage: 1, users: 6, cities: 13, flagEmoji: '🇨🇦', coordinates: [-106, 56] },
  { name: 'France', percentage: 1, users: 6, cities: 19, flagEmoji: '🇫🇷', coordinates: [2, 46] },
  { name: 'Hong Kong', percentage: 1, users: 6, cities: 12, flagEmoji: '🇭🇰', coordinates: [114, 22] },
  { name: 'Ireland', percentage: 1, users: 5, cities: 11, flagEmoji: '🇮🇪', coordinates: [-8, 53] },
  { name: 'India', percentage: 1, users: 5, cities: 25, flagEmoji: '🇮🇳', coordinates: [77, 28] },
  { name: 'Colombia', percentage: 1, users: 4, cities: 8, flagEmoji: '🇨🇴', coordinates: [-74, 4] },
  { name: 'Bulgaria', percentage: 1, users: 3, cities: 5, flagEmoji: '🇧🇬', coordinates: [25, 43] },
  { name: 'South Africa', percentage: 1, users: 3, cities: 26, flagEmoji: '🇿🇦', coordinates: [22, -30] },
  { name: 'Argentina', percentage: 0.5, users: 2, cities: 2, flagEmoji: '🇦🇷', coordinates: [-64, -34] },
  { name: 'Finland', percentage: 0.5, users: 2, cities: 2, flagEmoji: '🇫🇮', coordinates: [26, 64] },
  { name: 'Russia', percentage: 0.5, users: 2, cities: 18, flagEmoji: '🇷🇺', coordinates: [105, 61] },
  { name: 'Saudi Arabia', percentage: 0.5, users: 2, cities: 11, flagEmoji: '🇸🇦', coordinates: [45, 24] },
];

const additionalCountries = [
  { name: 'Belgium', users: 1, cities: 8, flagEmoji: '🇧🇪', coordinates: [4, 50] },
  { name: 'Switzerland', users: 1, cities: 1, flagEmoji: '🇨🇭', coordinates: [8, 47] },
  { name: 'Hungary', users: 1, cities: 9, flagEmoji: '🇭🇺', coordinates: [20, 47] },
  { name: 'Italy', users: 1, cities: 11, flagEmoji: '🇮🇹', coordinates: [12, 42] },
  { name: 'Japan', users: 1, cities: 1, flagEmoji: '🇯🇵', coordinates: [138, 36] },
  { name: 'Kenya', users: 1, cities: 1, flagEmoji: '🇰🇪', coordinates: [37, 0] },
  { name: 'South Korea', users: 1, cities: 6, flagEmoji: '🇰🇷', coordinates: [128, 36] },
  { name: 'Morocco', users: 1, cities: 2, flagEmoji: '🇲🇦', coordinates: [-7, 32] },
  { name: 'Netherlands', users: 1, cities: 1, flagEmoji: '🇳🇱', coordinates: [5, 52] },
  { name: 'Norway', users: 1, cities: 1, flagEmoji: '🇳🇴', coordinates: [9, 62] },
  { name: 'Sweden', users: 1, cities: 1, flagEmoji: '🇸🇪', coordinates: [15, 62] },
  { name: 'Thailand', users: 1, cities: 1, flagEmoji: '🇹🇭', coordinates: [100, 15] },
  { name: 'Vietnam', users: 1, cities: 1, flagEmoji: '🇻🇳', coordinates: [108, 14] },
];

export const GlobalReachMap: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  
  const totalUsers = countryData.reduce((sum, country) => sum + country.users, 0) + 
                    additionalCountries.reduce((sum, country) => sum + country.users, 0);
  
  const totalCountries = countryData.length + additionalCountries.length;
  
  const totalCities = countryData.reduce((sum, country) => sum + country.cities, 0) + 
                     additionalCountries.reduce((sum, country) => sum + country.cities, 0);

  // Combine and sort all countries by users (descending)
  const allCountries = [...countryData, ...additionalCountries.map(country => ({
    ...country,
    percentage: 0.5,
    flagEmoji: country.flagEmoji
  }))].sort((a, b) => b.users - a.users);

  const displayedCountries = showAll ? allCountries : allCountries.slice(0, 10);

  const getCountrySize = (percentage: number, users: number) => {
    if (percentage >= 15) return 'large';
    if (percentage >= 3 || users >= 10) return 'medium';
    if (percentage >= 1 || users >= 5) return 'small';
    return 'tiny';
  };

  const getCountryColor = (percentage: number, users: number) => {
    if (percentage >= 15) return 'bg-purple-600';
    if (percentage >= 3 || users >= 10) return 'bg-purple-500';
    if (percentage >= 1 || users >= 5) return 'bg-purple-400';
    return 'bg-purple-300';
  };

  return (
    <section className="py-4 md:py-6 bg-gradient-to-br from-purple-50/20 to-pink-50/20">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="text-center mb-3 md:mb-4">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Globe className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Global Reach</h2>
          </div>
          <p className="text-sm md:text-base text-gray-700 max-w-2xl mx-auto px-2">
            PowerParent is growing fast with <span className="font-bold text-purple-600">200+ families</span> across 
            <span className="font-bold text-purple-600"> {totalCountries} countries</span> worldwide
          </p>
        </div>

        {/* Countries List */}
        <Card className="overflow-hidden bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg">
          <CardContent className="p-3">
            {/* Countries Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 md:gap-2">
              {displayedCountries.map((country) => (
                <div key={country.name} className="flex items-center gap-1 p-1.5 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <span className="text-sm md:text-base flex-shrink-0">{country.flagEmoji}</span>
                  <span className="font-medium text-gray-800 text-xs truncate flex-1">{country.name}</span>
                </div>
              ))}
            </div>

            {/* Show More/Less Button */}
            {allCountries.length > 10 && (
              <div className="text-center mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs px-3 py-1 h-7 text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Show All {allCountries.length} Countries
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
    </section>
  );
};