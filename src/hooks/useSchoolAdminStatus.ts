import { useEffect, useState } from 'react';
import { schoolAuthorizationService } from '@/services/schoolAuthorizationService';

export function useSchoolAdminStatus(schoolId?: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(!!schoolId);

  useEffect(() => {
    let isMounted = true;
    if (!schoolId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    schoolAuthorizationService.isUserSchoolAdmin(schoolId)
      .then(result => {
        if (isMounted) setIsAdmin(result);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [schoolId]);

  return { isAdmin, loading };
} 