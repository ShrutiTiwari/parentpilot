import { supabase } from '@/lib/supabase';
import { Database } from '../types/database.types';

type Child = Database['public']['Tables']['children']['Row'] & {
  schools?: {
    id: string;
    name: string;
    address: string | null;
    term_dates_url?: string | null;
  };
};

type School = Database['public']['Tables']['schools']['Row'];

export interface CreateChildProfileInput {
  name: string;
  schoolId: string;
  yearGroup: string;
}

export interface UpdateChildProfileInput {
  name?: string;
  schoolId?: string;
  yearGroup?: string;
}

// Generate a random 6-digit alphanumeric code
function generateSchoolCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const childProfileService = {
  // Get all children for the current user
  async getChildren(): Promise<Child[]> {
    const { data: profile } = await supabase.auth.getUser();
    if (!profile.user) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }
    // First get the child IDs for this user
    const { data: childIds, error: childIdsError } = await supabase
      .from('child_users')
      .select('child_id')
      .eq('user_id', profile.user.id);
    if (childIdsError) {
      console.error('Error fetching child IDs:', childIdsError);
      throw childIdsError;
    }
    if (!childIds || childIds.length === 0) {
      return [];
    }
    // Then get the full child data
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        schools (
          id,
          name,
          address,
          duplicate_of,
          term_dates_url
        )
      `)
      .in('id', childIds.map(c => c.child_id))
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
    // For any child whose school is a duplicate, fetch the original school and use its name/address
    const children = await Promise.all((data || []).map(async (child) => {
      let school = child.schools;
      if (school && school.duplicate_of) {
        const { data: originalSchool } = await supabase
          .from('schools')
          .select('id, name, address, term_dates_url')
          .eq('id', school.duplicate_of)
          .single();
        if (originalSchool) {
          school = originalSchool;
        }
      }
      return {
        ...child,
        schools: school
      };
    }));
    
    return children;
  },

  // Get a single child by ID
  async getChild(id: string): Promise<Child | null> {
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        schools (
          id,
          name,
          address,
          duplicate_of,
          term_dates_url
        )
      `)
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching child:', error);
      throw error;
    }
    let school = data.schools;
    if (school && school.duplicate_of) {
      const { data: originalSchool } = await supabase
        .from('schools')
        .select('id, name, address, term_dates_url')
        .eq('id', school.duplicate_of)
        .single();
      if (originalSchool) {
        school = originalSchool;
      }
    }
    return {
      ...data,
      schools: school
    };
  },

  // Create a new child profile
  async createChildProfile(input: CreateChildProfileInput): Promise<Child> {
    
    // First check if we're authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: ' + sessionError.message);
    }
    
    if (!session) {
      console.error('No active session found');
      throw new Error('No active session');
    }

    // First create the child
    const { data: child, error: childError } = await supabase
      .from('children')
      .insert({
        name: input.name,
        school_id: input.schoolId,
        year_group: input.yearGroup,
      })
      .select()
      .single();

    if (childError) {
      console.error('Error creating child profile:', childError);
      console.error('Error details:', {
        code: childError.code,
        message: childError.message,
        details: childError.details,
        hint: childError.hint
      });
      throw childError;
    }

    // Then create the child-user relationship
    const { error: relationshipError } = await supabase
      .from('child_users')
      .insert({
        child_id: child.id,
        user_id: session.user.id,
      });

    if (relationshipError) {
      console.error('Error creating child-user relationship:', relationshipError);
      console.error('Relationship error details:', {
        code: relationshipError.code,
        message: relationshipError.message,
        details: relationshipError.details,
        hint: relationshipError.hint
      });
      // If relationship creation fails, delete the child
      await supabase.from('children').delete().eq('id', child.id);
      throw relationshipError;
    }
    return child;
  },

  // Update a child profile
  async updateChildProfile(id: string, input: UpdateChildProfileInput): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .update({
        name: input.name,
        school_id: input.schoolId,
        year_group: input.yearGroup,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating child profile:', error);
      throw error;
    }

    return data;
  },

  // Delete a child profile
  async deleteChildProfile(id: string): Promise<void> {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting child profile:', error);
      throw error;
    }
  },

  // Get all schools
  async getSchools(): Promise<School[]> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching schools:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching schools:', error);
      return [];
    }
  },

  // Create a new school
  async createSchool(name: string, address?: string, city?: string, country?: string): Promise<School> {
    // Check for duplicate school name
    const { data: existingSchool, error: checkError } = await supabase
      .from('schools')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    if (checkError) {
      console.error('Error checking for duplicate school:', checkError);
      throw checkError;
    }
    if (existingSchool) {
      throw new Error('A school with this name already exists. Please choose a different name.');
    }
    const schoolCode = generateSchoolCode();
    const { data, error } = await supabase
      .from('schools')
      .insert({
        name,
        address,
        city,
        country: country || 'United Kingdom',
        school_code: schoolCode,
      })
      .select()
      .single();
    if (error) {
      console.error('Error creating school:', error);
      throw error;
    }

    // Create a folder for the school under public/data/schools (Node.js only)
    if (typeof window === 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        // Use the same naming convention as event data loading (e.g., snake_case)
        const folderName = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const dirPath = path.join(process.cwd(), 'public', 'data', 'schools', folderName);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      } catch (err) {
        console.error('Error creating school data folder:', err);
      }
    }

    return data;
  },

  // Get unique countries from schools
  async getCountries(): Promise<string[]> {
    
    // Fallback countries for unauthenticated users or when database access fails
    const fallbackCountries = [
      'United Kingdom',
      'United States',
      'Canada',
      'Australia',
      'New Zealand',
      'Ireland',
      'South Africa',
      'India',
      'Singapore',
      'Hong Kong',
      'United Arab Emirates',
      'Germany',
      'France',
      'Netherlands',
      'Sweden',
      'Norway',
      'Denmark',
      'Switzerland',
      'Austria',
      'Belgium'
    ];

    try {
      const { data, error } = await supabase
        .from('schools')
        .select('country')
        .not('country', 'is', null)
        .order('country');

      if (error) {
        console.error('Error fetching countries:', error);
        return fallbackCountries;
      }
      // Get unique countries and sort them
      const countries = [...new Set(data.map(school => school.country))].filter(Boolean);
      
      // If no countries found in database, use fallback
      if (countries.length === 0) {
        return fallbackCountries;
      }
      
      return countries;
    } catch (error) {
      console.error('Exception fetching countries:', error);
      return fallbackCountries;
    }
  },

  // Get cities for a specific country
  async getCities(country: string): Promise<string[]> {
    // Fallback cities for common countries when database access fails
    const fallbackCities: Record<string, string[]> = {
      'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Sheffield', 'Edinburgh', 'Glasgow', 'Bristol', 'Cardiff', 'Newcastle', 'Belfast'],
      'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville'],
      'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
      'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'],
      'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
      'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
      'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen'],
      'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'],
      'Norway': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg'],
      'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde']
    };

    try {
      const { data, error } = await supabase
        .from('schools')
        .select('city')
        .eq('country', country)
        .not('city', 'is', null)
        .order('city');

      if (error) {
        console.error('Error fetching cities:', error);
        return fallbackCities[country] || [];
      }

      // Get unique cities and sort them
      const cities = [...new Set(data.map(school => school.city))].filter(Boolean);
      
      // If no cities found in database, use fallback
      if (cities.length === 0) {
        return fallbackCities[country] || [];
      }
      
      return cities;
    } catch (error) {
      console.error('Exception fetching cities:', error);
      return fallbackCities[country] || [];
    }
  },

  // Get schools without term dates imported
  async getSchoolsWithoutTermDates(): Promise<School[]> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .or('term_dates_url.is.null,website_url.is.null')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching schools without term dates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching schools without term dates:', error);
      return [];
    }
  },

  // Get schools by country and city
  async getSchoolsByLocation(country?: string, city?: string): Promise<School[]> {
    // Fallback schools for unauthenticated users or when database access fails
    const fallbackSchools: Record<string, Record<string, School[]>> = {
      'United Kingdom': {
        'London': [
          { id: 'fallback-1', name: 'St. Paul\'s School', address: 'London', city: 'London', country: 'United Kingdom', school_code: 'STPAUL', created_at: '', updated_at: '' },
          { id: 'fallback-2', name: 'Westminster School', address: 'London', city: 'London', country: 'United Kingdom', school_code: 'WESTMIN', created_at: '', updated_at: '' },
          { id: 'fallback-3', name: 'Eton College', address: 'Eton', city: 'London', country: 'United Kingdom', school_code: 'ETON', created_at: '', updated_at: '' }
        ],
        'Manchester': [
          { id: 'fallback-4', name: 'Manchester Grammar School', address: 'Manchester', city: 'Manchester', country: 'United Kingdom', school_code: 'MGS', created_at: '', updated_at: '' },
          { id: 'fallback-5', name: 'Withington Girls\' School', address: 'Manchester', city: 'Manchester', country: 'United Kingdom', school_code: 'WGS', created_at: '', updated_at: '' }
        ],
        'Birmingham': [
          { id: 'fallback-6', name: 'King Edward\'s School', address: 'Birmingham', city: 'Birmingham', country: 'United Kingdom', school_code: 'KES', created_at: '', updated_at: '' }
        ]
      },
      'United States': {
        'New York': [
          { id: 'fallback-7', name: 'Stuyvesant High School', address: 'New York', city: 'New York', country: 'United States', school_code: 'STUY', created_at: '', updated_at: '' },
          { id: 'fallback-8', name: 'Bronx High School of Science', address: 'New York', city: 'New York', country: 'United States', school_code: 'BRONX', created_at: '', updated_at: '' }
        ],
        'Los Angeles': [
          { id: 'fallback-9', name: 'Los Angeles Center for Enriched Studies', address: 'Los Angeles', city: 'Los Angeles', country: 'United States', school_code: 'LACES', created_at: '', updated_at: '' }
        ]
      },
      'Canada': {
        'Toronto': [
          { id: 'fallback-10', name: 'University of Toronto Schools', address: 'Toronto', city: 'Toronto', country: 'Canada', school_code: 'UTS', created_at: '', updated_at: '' }
        ]
      }
    };

    try {
      let query = supabase
        .from('schools')
        .select('*')
        .order('name');

      if (country) {
        query = query.eq('country', country);
      }
      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching schools by location:', error);
        
        // Return fallback schools if available for the selected country and city
        if (country && city && fallbackSchools[country] && fallbackSchools[country][city]) {
          return fallbackSchools[country][city];
        }
        
        // If no specific fallback, return empty array
        return [];
      }

      // If no schools found in database, try fallback
      if (!data || data.length === 0) {
        if (country && city && fallbackSchools[country] && fallbackSchools[country][city]) {
          return fallbackSchools[country][city];
        }
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching schools by location:', error);
      
      // Return fallback schools if available for the selected country and city
      if (country && city && fallbackSchools[country] && fallbackSchools[country][city]) {
        return fallbackSchools[country][city];
      }
      
      return [];
    }
  }
};
