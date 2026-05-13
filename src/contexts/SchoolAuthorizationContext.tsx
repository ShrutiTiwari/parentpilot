import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { schoolAuthorizationService } from '@/services/schoolAuthorizationService';
import { Database } from '@/types/database.types';

type SchoolAuthorization = Database['public']['Tables']['school_authorizations']['Row'] & {
  schools?: {
    id: string;
    name: string;
    address: string | null;
  };
};

interface SchoolAuthorizationContextType {
  authorizedSchools: SchoolAuthorization[];
  loading: boolean;
  refreshAuthorizations: () => Promise<void>;
}

const SchoolAuthorizationContext = createContext<SchoolAuthorizationContextType | undefined>(undefined);

export function SchoolAuthorizationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: authorizedSchools = [], isLoading: loading } = useQuery({
    queryKey: ['schoolAuthorizations'],
    queryFn: async () => {
      return schoolAuthorizationService.getAuthorizedSchools();
    },
  });

  const refreshAuthorizations = async () => {
    await queryClient.invalidateQueries({ queryKey: ['schoolAuthorizations'] });
  };

  return (
    <SchoolAuthorizationContext.Provider
      value={{
        authorizedSchools,
        loading,
        refreshAuthorizations,
      }}
    >
      {children}
    </SchoolAuthorizationContext.Provider>
  );
}

export function useSchoolAuthorizations() {
  const context = useContext(SchoolAuthorizationContext);
  if (context === undefined) {
    throw new Error('useSchoolAuthorizations must be used within a SchoolAuthorizationProvider');
  }
  return context;
} 