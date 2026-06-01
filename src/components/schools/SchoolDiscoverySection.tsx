import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, School, Users, ChevronRight, Sparkles, TrendingUp, MapPin, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { childProfileService } from '@/services/childProfileService';

interface School {
  id: string;
  name: string;
  location: string;
  userCount: number;
  isIntegrated: boolean;
  hasPublicEvents: boolean;
  recentActivity?: {
    joinedThisWeek: number;
    eventsThisMonth: number;
  };
}

interface SchoolDiscoverySectionProps {
  onSignUp?: (schoolId?: string) => void;
  onSignIn?: () => void;
  className?: string;
}

// Mock data for demonstration - TODO: Replace with real API
const mockPopularSchools: School[] = [
  {
    id: '1',
    name: 'Dartford Grammar School for Girls',
    location: 'Dartford, Kent',
    userCount: 127,
    isIntegrated: true,
    hasPublicEvents: true,
    recentActivity: {
      joinedThisWeek: 8,
      eventsThisMonth: 23
    }
  },
  {
    id: '2',
    name: 'Blackheath Preparatory School',
    location: 'Blackheath, London',
    userCount: 89,
    isIntegrated: true,
    hasPublicEvents: true,
    recentActivity: {
      joinedThisWeek: 5,
      eventsThisMonth: 18
    }
  },
  {
    id: '3',
    name: 'Tiffin Girls School',
    location: 'Kingston upon Thames',
    userCount: 156,
    isIntegrated: true,
    hasPublicEvents: true,
    recentActivity: {
      joinedThisWeek: 12,
      eventsThisMonth: 31
    }
  },
  {
    id: '4',
    name: 'Heath House Preparatory School',
    location: 'Greenwich, London',
    userCount: 73,
    isIntegrated: true,
    hasPublicEvents: true,
    recentActivity: {
      joinedThisWeek: 6,
      eventsThisMonth: 15
    }
  },
  {
    id: '5',
    name: 'Colfe\'s School',
    location: 'Lee, London',
    userCount: 94,
    isIntegrated: true,
    hasPublicEvents: true,
    recentActivity: {
      joinedThisWeek: 4,
      eventsThisMonth: 19
    }
  },
  {
    id: '6',
    name: 'Bexley Grammar School',
    location: 'Bexley, Kent',
    userCount: 112,
    isIntegrated: true,
    hasPublicEvents: true,
    recentActivity: {
      joinedThisWeek: 7,
      eventsThisMonth: 22
    }
  },
  {
    id: '7',
    name: 'St Olave\'s Grammar School',
    location: 'Orpington, Kent',
    userCount: 143,
    isIntegrated: true,
    hasPublicEvents: true,
    recentActivity: {
      joinedThisWeek: 9,
      eventsThisMonth: 26
    }
  }
];


export function SchoolDiscoverySection({ onSignUp, onSignIn, className }: SchoolDiscoverySectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<School | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const schools = await childProfileService.getSchools();
      const found = schools.find(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (found) {
        setSearchResult({
          id: found.id,
          name: found.name,
          location: [found.city, found.country].filter(Boolean).join(', ') || 'Your area',
          userCount: 0,
          isIntegrated: true,
          hasPublicEvents: true,
        });
      } else {
        setSearchResult({
          id: 'new',
          name: searchQuery,
          location: 'Your area',
          userCount: 0,
          isIntegrated: false,
          hasPublicEvents: false,
        });
      }
    } catch {
      setSearchResult({
        id: 'new',
        name: searchQuery,
        location: 'Your area',
        userCount: 0,
        isIntegrated: false,
        hasPublicEvents: false,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Discovery Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 border-blue-200">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 self-start sm:self-auto">
                <School className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">Is Your School Already Using PowerParent?</CardTitle>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Join your school community and never miss an event</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-4 sm:px-6">
          {/* Search Box */}
          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for your school..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 pr-4 h-10 sm:h-12 text-base sm:text-lg bg-white"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="h-10 sm:h-12 px-4 sm:px-6 w-full sm:w-auto"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {hasSearched && searchResult && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              {searchResult.isIntegrated ? (
                // School Found Card
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="p-2 bg-green-100 rounded-full flex-shrink-0 self-start">
                        <CheckCircle className="h-5 sm:h-6 w-5 sm:w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-green-900 mb-2">
                          Great news! {searchResult.name} is already integrated!
                        </h3>
                        <div className="space-y-2 text-sm sm:text-base text-green-800">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span className="break-words">{searchResult.userCount} parents from your school are using PowerParent</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 flex-shrink-0" />
                            <span>{searchResult.recentActivity?.joinedThisWeek} joined this week</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{searchResult.recentActivity?.eventsThisMonth} school events this month</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => onSignUp?.(searchResult.id)}
                          className="mt-4 w-full bg-green-600 hover:bg-green-700"
                        >
                          Join {searchResult.name} Parents
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // School Not Found Card
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="p-2 bg-purple-100 rounded-full flex-shrink-0 self-start">
                        <Sparkles className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-purple-900 mb-2">
                          Be the first from {searchResult.name}!
                        </h3>
                        <div className="space-y-2 text-sm sm:text-base text-purple-800">
                          <p>You have the opportunity to be a pioneer parent at your school!</p>
                          <ul className="space-y-1 ml-2 sm:ml-4">
                            <li>• We'll help you set up your school</li>
                            <li>• Invite other parents and grow your community</li>
                            <li>• Get exclusive early adopter benefits</li>
                            <li>• Free premium features for 6 months</li>
                          </ul>
                        </div>

                        <Button
                          onClick={() => onSignUp?.(searchResult.id)}
                          className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
                        >
                          Set Up {searchResult.name}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Popular Schools */}
          {!hasSearched && (
            <div className="space-y-3">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">Popular schools nearby:</h3>
              <div className="grid gap-2 sm:gap-3">
                {mockPopularSchools.map((school) => (
                  <div
                    key={school.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      setSearchQuery(school.name);
                      setSearchResult(school);
                      setHasSearched(true);
                    }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{school.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{school.location}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm sm:text-base text-blue-600">{school.userCount}</p>
                      <p className="text-xs text-gray-500">families</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-green-500" />
          <span>No credit card required</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-green-500" />
          <span>30-day free trial</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-green-500" />
          <span>Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}