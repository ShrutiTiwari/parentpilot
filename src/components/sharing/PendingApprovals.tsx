import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Music, 
  Calendar, 
  Users,
  AlertCircle 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SharingService, { ShareRequest, ConnectionRequest } from "@/services/sharingService";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";

export function PendingApprovals() {
  const [pendingRequests, setPendingRequests] = useState<ShareRequest[]>([]);
  const [pendingConnections, setPendingConnections] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchPendingRequests = async () => {
    try {
      // Fetch both learner share requests and connection requests
      const [requests, connections] = await Promise.all([
        SharingService.getPendingRequests(),
        SharingService.getPendingConnectionRequests()
      ]);
      
      // Fetch learner names for each share request
      const requestsWithNames = await Promise.all(
        requests.map(async (request) => {
          try {
            const { data: learner } = await supabase
              .from('music_learners')
              .select('name')
              .eq('id', request.learner_id)
              .single();
            
            return {
              ...request,
              learner_name: learner?.name || `Student #${request.learner_id.slice(-4)}`
            };
          } catch (error) {
            return {
              ...request,
              learner_name: `Student #${request.learner_id.slice(-4)}`
            };
          }
        })
      );
      
      setPendingRequests(requestsWithNames);
      setPendingConnections(connections);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId: string, learnerName: string, requesterName: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      const result = await SharingService.approveShareRequest(requestId);
      
      if (result.success) {
        toast({
          title: "Access approved!",
          description: `${requesterName} can now see ${learnerName}'s progress`,
        });
        // Remove from pending list
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string, learnerName: string, requesterName: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      const result = await SharingService.rejectShareRequest(requestId);
      
      if (result.success) {
        toast({
          title: "Request declined",
          description: `${requesterName}'s request to view ${learnerName}'s progress has been declined`,
        });
        // Remove from pending list
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleAcceptConnection = async (connectionId: string, requesterName: string) => {
    setProcessingIds(prev => new Set(prev).add(connectionId));
    
    try {
      const result = await SharingService.acceptConnectionRequest(connectionId);
      
      if (result.success) {
        toast({
          title: "Connection accepted!",
          description: `You are now connected with ${requesterName}`,
        });
        // Remove from pending list
        setPendingConnections(prev => prev.filter(req => req.id !== connectionId));
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to accept connection",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const handleRejectConnection = async (connectionId: string, requesterName: string) => {
    setProcessingIds(prev => new Set(prev).add(connectionId));
    
    try {
      const result = await SharingService.rejectConnectionRequest(connectionId);
      
      if (result.success) {
        toast({
          title: "Connection declined",
          description: `${requesterName}'s connection request has been declined`,
        });
        // Remove from pending list
        setPendingConnections(prev => prev.filter(req => req.id !== connectionId));
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject connection",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'music':
        return <Music className="h-4 w-4" />;
      case 'events':
        return <Calendar className="h-4 w-4" />;
      case 'both':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getResourceLabel = (resourceType: string) => {
    switch (resourceType) {
      case 'music':
        return 'Music Progress';
      case 'events':
        return 'School Events';
      case 'both':
        return 'Full Access';
      default:
        return 'Progress';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'parent':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-gray-500">
              Loading pending requests...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0 && pendingConnections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
            <p className="text-gray-500">
              When someone sends you a connection request or uses your share code, their request will appear here for approval.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Approvals
          <Badge variant="secondary" className="ml-2">
            {pendingRequests.length + pendingConnections.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Requests */}
          {pendingConnections.map((connection, index) => (
            <React.Fragment key={`connection-${connection.id}`}>
              <div className={`p-4 rounded-lg border-l-4 ${
                connection.isOutgoing 
                  ? 'bg-yellow-50 border-yellow-500' 
                  : 'bg-blue-50 border-blue-500'
              }`}>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-lg">{connection.other_user_name}</strong>
                    <Badge className={getRoleColor(connection.other_user_role)}>
                      {connection.other_user_role}
                    </Badge>
                    <Badge variant="outline" className={
                      connection.isOutgoing 
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : "bg-blue-100 text-blue-800 border-blue-200"
                    }>
                      {connection.isOutgoing ? 'Request Sent' : 'Connection Request'}
                    </Badge>
                  </div>
                  
                  <div className="text-gray-600">
                    {connection.isOutgoing 
                      ? 'You sent a connection request'
                      : 'wants to connect with you'
                    }
                    {connection.message && (
                      <div className="text-sm text-gray-500 mt-1 italic">
                        Message: "{connection.message}"
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      User Connection
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Only show approve/decline buttons if this is an incoming request */}
                  {!connection.isOutgoing && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectConnection(connection.id, connection.other_user_name)}
                        disabled={processingIds.has(connection.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptConnection(connection.id, connection.other_user_name)}
                        disabled={processingIds.has(connection.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}

                  {/* Show "Pending" status for outgoing requests */}
                  {connection.isOutgoing && (
                    <div className="flex items-center gap-2 pt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Waiting for {connection.other_user_name} to respond</span>
                    </div>
                  )}
                </div>
              </div>
              
              {(index < pendingConnections.length - 1 || pendingRequests.length > 0) && <Separator />}
            </React.Fragment>
          ))}

          {/* Learner Share Requests */}
          {pendingRequests.map((request, index) => (
            <React.Fragment key={`request-${request.id}`}>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-lg">{request.requester_name}</strong>
                    <Badge className={getRoleColor(request.requester_role)}>
                      {request.requester_role}
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Progress Sharing
                    </Badge>
                  </div>
                  
                  <div className="text-gray-600">
                    wants to view <strong>{request.learner_name}</strong>'s progress
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      {getResourceIcon(request.shared_resource)}
                      {getResourceLabel(request.shared_resource)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request.id, request.learner_name, request.requester_name)}
                      disabled={processingIds.has(request.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id, request.learner_name, request.requester_name)}
                      disabled={processingIds.has(request.id)}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
              
              {index < pendingRequests.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default PendingApprovals;