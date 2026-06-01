import { API_ENDPOINTS } from '../config/api';

export interface DiscoverWebsiteRequest {
  schoolName: string;
  city?: string;
  country?: string;
}

export interface DiscoverWebsiteResponse {
  suggestedUrl: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface DiscoverTermDatesPageRequest {
  schoolWebsiteUrl: string;
}

export interface TermDatesPageSuggestion {
  url: string;
  title: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface DiscoverTermDatesPageResponse {
  suggestedPages: TermDatesPageSuggestion[];
}

export interface ExtractTermDatesRequest {
  termDatesPageUrl: string;
}

export interface ExtractedEvent {
  title: string;
  date: string;
  time_start: string;
  time_end: string;
  year_group: string;
  year_groups: string[];
  category: 'holiday' | 'general' | 'exam' | 'parent';
  source: string;
  venue: string | null;
  school_code_required: boolean;
  visibility: string;
}

export interface ExtractTermDatesResponse {
  success: boolean;
  extractedEvents: ExtractedEvent[];
  rawData?: string;
  error?: string;
}

export interface CreateSchoolWithEventsRequest {
  schoolData: {
    name: string;
    city?: string;
    country?: string;
    address?: string;
    websiteUrl?: string;
    termDatesPageUrl?: string;
  };
  events: ExtractedEvent[];
  userId: string;
}

export interface CreateSchoolWithEventsResponse {
  success: boolean;
  school: {
    id: string;
    name: string;
    schoolCode: string;
    eventsCount: number;
  };
  error?: string;
}

/**
 * Service for school term dates discovery and import
 */
export const schoolDiscoveryService = {
  /**
   * Discover school website using AI
   */
  async discoverWebsite(request: DiscoverWebsiteRequest): Promise<DiscoverWebsiteResponse> {
    try {

      const response = await fetch(API_ENDPOINTS.schools.discoverWebsite, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to discover school website');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error discovering school website:', error);
      throw error;
    }
  },

  /**
   * Discover term dates page from school website
   */
  async discoverTermDatesPage(
    request: DiscoverTermDatesPageRequest
  ): Promise<DiscoverTermDatesPageResponse> {
    try {

      const response = await fetch(API_ENDPOINTS.schools.discoverTermDatesPage, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // Check content type to ensure we got JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response. Please check backend logs.');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to discover term dates page');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error discovering term dates page:', error);
      throw error;
    }
  },

  /**
   * Extract term dates from page
   */
  async extractTermDates(
    request: ExtractTermDatesRequest
  ): Promise<ExtractTermDatesResponse> {
    try {

      const response = await fetch(API_ENDPOINTS.schools.extractTermDates, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // Check content type to ensure we got JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response. Please check backend logs.');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extract term dates');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error extracting term dates:', error);
      throw error;
    }
  },

  /**
   * Create school only (without events)
   */
  async createSchool(request: {
    schoolData: {
      name: string;
      city?: string;
      country?: string;
      address?: string;
      websiteUrl?: string;
      termDatesPageUrl?: string;
    };
  }): Promise<{
    success: boolean;
    school: {
      id: string;
      name: string;
      schoolCode: string;
      city?: string;
      country?: string;
      address?: string;
      termDatesUrl?: string;
    };
    error?: string;
  }> {
    try {

      const response = await fetch(API_ENDPOINTS.schools.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create school');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating school:', error);
      throw error;
    }
  },

  /**
   * Add events to existing school
   */
  async addEventsToSchool(request: {
    schoolId: string;
    events: ExtractedEvent[];
    userId: string | null;
    termDatesPageUrl?: string;
  }): Promise<{
    success: boolean;
    eventsCount: number;
    error?: string;
  }> {
    try {

      const response = await fetch(API_ENDPOINTS.schools.addEvents(request.schoolId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: request.events,
          userId: request.userId,
          termDatesPageUrl: request.termDatesPageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add events');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding events to school:', error);
      throw error;
    }
  },

  /**
   * Create school with events (legacy - kept for backward compatibility)
   */
  async createSchoolWithEvents(
    request: CreateSchoolWithEventsRequest
  ): Promise<CreateSchoolWithEventsResponse> {
    try {

      const response = await fetch(API_ENDPOINTS.schools.createWithEvents, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create school');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating school with events:', error);
      throw error;
    }
  },
};
