import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  UserCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SharingService from "@/services/sharingService";
import { formatDistanceToNow } from "date-fns";

interface ConnectionSharingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    learner_id: string;
    learner_name?: string;
    learner_instrument?: string;
    learner_grade?: number;
  } | null;
  onSuccess?: () => void;
}

export function ConnectionSharingModal({ 
  open, 
  onOpenChange, 
  student,
  onSuccess 
}: ConnectionSharingModalProps) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConnections = async () => {
    if (!open) return;
    
    setLoading(true);
    try {
      const myConnections = await SharingService.getMyConnections();
      setConnections(myConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: "Error",
        description: "Failed to load your connections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchConnections();
    }
  }, [open]);

  const handleShareWithConnection = async (connectionId: string, connectionName: string) => {
    if (!student) return;

    setSharing(connectionId);
    try {
      // TODO: This method doesn't exist yet - we'll create it next
      const result = await SharingService.shareWithConnection(student.learner_id, connectionId);
      
      if (result.success) {
        toast({
          title: "Shared successfully!",
          description: `${student.learner_name || 'Student'}'s progress is now shared with ${connectionName}`,
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: "Sharing failed",
          description: result.error || "Failed to share with connection",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sharing with connection:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSharing(null);
    }
  };

  const getRoleColor = (role: string | undefined | null) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share with Connections
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {student && (
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="font-medium text-blue-900">
                Sharing: {student.learner_name || `Student #${student.learner_id.slice(-4)}`}
              </div>
              {student.learner_instrument && (
                <div className="text-sm text-blue-700">
                  {student.learner_instrument} • Grade {student.learner_grade || 'N/A'}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading connections...</span>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connections found</h3>
              <p className="text-gray-500">
                You need to connect with other users first before sharing progress.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <h4 className="font-medium text-gray-900">Choose a connection to share with:</h4>
              
              {connections.map((connection, index) => (
                <React.Fragment key={connection.id}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <strong className="text-sm">{connection.other_user_name || 'Unknown User'}</strong>
                        <Badge className={getRoleColor(connection.other_user_role)}>
                          {connection.other_user_role || 'user'}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Connected {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleShareWithConnection(connection.id, connection.other_user_name)}
                      disabled={sharing === connection.id}
                      size="sm"
                      className="ml-3"
                    >
                      {sharing === connection.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Share'
                      )}
                    </Button>
                  </div>
                  
                  {index < connections.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={!!sharing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConnectionSharingModal;