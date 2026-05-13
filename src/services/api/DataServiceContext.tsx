import React, { createContext, useContext } from 'react';
import { Event } from '@/utils/dateGrouping';

interface DataService {
  getEvents: () => Promise<Event[]>;
  getYearGroups: () => Promise<string[]>;
}

const DataServiceContext = createContext<DataService | undefined>(undefined);

export function useDataService() {
  const context = useContext(DataServiceContext);
  if (!context) {
    throw new Error('useDataService must be used within a DataServiceProvider');
  }
  return context;
}

interface DataServiceProviderProps {
  children: React.ReactNode;
  service: DataService;
}

export function DataServiceProvider({ children, service }: DataServiceProviderProps) {
  return (
    <DataServiceContext.Provider value={service}>
      {children}
    </DataServiceContext.Provider>
  );
}

// Default implementation of the data service
export class DefaultDataService implements DataService {
  async getEvents(): Promise<Event[]> {
    // In a real application, this would fetch from an API
    // For now, return mock data
    return [
      {
        id: '1',
        title: 'School Assembly',
        description: 'Weekly school assembly',
        date: new Date().toISOString(),
        yearGroup: 'All',
        category: 'Assembly',
        location: 'Main Hall'
      },
      // Add more mock events as needed
    ];
  }

  async getYearGroups(): Promise<string[]> {
    return ['All', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Parents'];
  }
} 