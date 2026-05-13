import { useState, useEffect } from 'react';
import SharingService, { ShareRequest } from '@/services/sharingService';

export function useSharing() {
  const [pendingRequests, setPendingRequests] = useState<ShareRequest[]>([]);
  const [sharedStudents, setSharedStudents] = useState<any[]>([]);
  const [myShares, setMyShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [requests, students, shares] = await Promise.all([
        SharingService.getPendingRequests(),
        SharingService.getSharedStudents(),
        SharingService.getMyShares()
      ]);
      
      setPendingRequests(requests);
      setSharedStudents(students);
      setMyShares(shares);
    } catch (err) {
      setError('Failed to load sharing data');
      console.error('Error fetching sharing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = () => {
    fetchData();
  };

  const createShareCode = async (learnerId: string, resourceType: 'music' | 'events' | 'both' = 'music') => {
    const result = await SharingService.createShareCode(learnerId, resourceType);
    if (result.success) {
      refreshData(); // Refresh to show new share
    }
    return result;
  };

  const submitShareCode = async (shareCode: string) => {
    const result = await SharingService.submitShareCode(shareCode);
    if (result.success) {
      refreshData(); // Refresh to show new request
    }
    return result;
  };

  const approveRequest = async (requestId: string) => {
    const result = await SharingService.approveShareRequest(requestId);
    if (result.success) {
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      // Refresh shares to show new active share
      refreshData();
    }
    return result;
  };

  const rejectRequest = async (requestId: string) => {
    const result = await SharingService.rejectShareRequest(requestId);
    if (result.success) {
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    }
    return result;
  };

  const revokeAccess = async (accessId: string) => {
    const result = await SharingService.revokeAccess(accessId);
    if (result.success) {
      refreshData(); // Refresh to update status
    }
    return result;
  };

  return {
    // Data
    pendingRequests,
    sharedStudents,
    myShares,
    loading,
    error,
    
    // Actions
    createShareCode,
    submitShareCode,
    approveRequest,
    rejectRequest,
    revokeAccess,
    refreshData,
    
    // Computed values
    hasPendingRequests: pendingRequests.length > 0,
    hasSharedStudents: sharedStudents.length > 0,
    hasActiveShares: myShares.filter(share => share.status === 'active').length > 0,
  };
}

export default useSharing;