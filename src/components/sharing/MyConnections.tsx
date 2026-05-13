import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Calendar,
  AlertCircle,
  UserCheck,
  UserPlus,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Search
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SharingService from "@/services/sharingService";
import { formatDistanceToNow } from "date-fns";
import { ConnectWithTeacherButton } from "../shared/ConnectWithTeacherButton";

export function MyConnections() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [connectionType, setConnectionType] = useState<'teacher' | 'parent' | null>(null);
  const [showConnections, setShowConnections] = useState(true); // Start expanded by default
  
  // Connect by email state
  const [connectionEmail, setConnectionEmail] = useState("");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  
  // Search functionality state
  const [searchForm, setSearchForm] = useState({
    role: "",
    name: "",
    email: "",
    relationship: "" // For student/friend connections
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState(false);
  
  // Dialog state for connection request
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [dialogUser, setDialogUser] = useState<any>(null);
  const [dialogMessage, setDialogMessage] = useState("");
  
  const { toast } = useToast();

  // Helper function to check if user is already connected
  const isUserAlreadyConnected = (userId: string) => {
    return connections.some(connection => 
      connection.requester_id === userId || connection.recipient_id === userId
    );
  };

  const fetchConnections = async () => {
    console.log('🔵 MyConnections: fetchConnections called');
    try {
      console.log('🔵 MyConnections: About to call SharingService.getMyConnections()');
      const myConnections = await SharingService.getMyConnections();
      console.log('🔵 MyConnections received data:', myConnections);
      setConnections(myConnections);
    } catch (error) {
      console.error('🔴 Error fetching connections:', error);
    } finally {
      console.log('🔵 MyConnections: Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔵 MyConnections: useEffect triggered');
    fetchConnections();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that name is provided (mandatory for privacy)
    if (!searchForm.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the person's first name or full name to search",
        variant: "destructive",
      });
      return;
    }

    // Name should be at least 2 characters to prevent overly broad searches
    if (searchForm.name.trim().length < 2) {
      toast({
        title: "Name too short",
        description: "Please enter at least 2 characters (first name or full name)",
        variant: "destructive",
      });
      return;
    }

    // For student/friend connections, relationship is required
    if (connectionType === 'parent' && !searchForm.relationship) {
      toast({
        title: "Relationship required",
        description: "Please select whether you're connecting with a student or friend",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      // Use the new field-based search method
      const result = await SharingService.searchUsersByFields({
        role: searchForm.role || undefined,
        name: searchForm.name.trim() || undefined,
        email: searchForm.email.trim() || undefined
      });
      
      if (result.success) {
        setSearchResults(result.users || []);
        if (result.users && result.users.length === 0) {
          toast({
            title: "No users found",
            description: "Try adjusting your search criteria",
          });
        }
      } else {
        toast({
          title: "Search failed",
          description: result.error || "Could not search users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Search failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleUserSelect = async (user: any) => {
    setSelectedUser(user);
    setSearchResults([]); // Hide search results after selection
  };

  const handleDialogConnect = async () => {
    if (!dialogUser) return;

    // For student/friend connections, relationship must be selected
    if (connectionType === 'parent' && !searchForm.relationship) {
      toast({
        title: "Relationship required",
        description: "Please select whether you're connecting with a student or friend",
        variant: "destructive",
      });
      return;
    }

    setEmailLoading(true);
    try {
      // Include relationship info in message for student/friend connections
      let fullMessage = dialogMessage.trim();
      if (connectionType === 'parent' && searchForm.relationship) {
        const relationshipPrefix = `Connecting as ${searchForm.relationship === 'student' ? 'a student' : 'a friend'}`;
        fullMessage = fullMessage 
          ? `${relationshipPrefix}. ${fullMessage}` 
          : relationshipPrefix;
      }
      
      const result = await SharingService.sendConnectionRequest(
        dialogUser.id,
        fullMessage
      );
      
      if (result.success) {
        setSuccess(true);
        const userName = dialogUser.full_name || dialogUser.name || 'the user';
        setSuccessMessage(`Once ${userName} approves, you can see them in your connections and start sharing music profiles!`);
        toast({
          title: "Connection request sent!",
          description: `Once ${userName} approves, you can see them in your connections and start sharing music profiles!`,
        });
        // Close dialog and refresh connections
        setShowConnectDialog(false);
        setDialogUser(null);
        setDialogMessage("");
        fetchConnections();
      } else {
        toast({
          title: "Error sending request",
          description: result.error || "Could not send connection request. Please try again.",
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
      setEmailLoading(false);
    }
  };

  const handleEmailConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast({
        title: "Select a user",
        description: "Please search and select a user to connect with",
        variant: "destructive",
      });
      return;
    }

    // For student/friend connections, relationship must be selected
    if (connectionType === 'parent' && !searchForm.relationship) {
      toast({
        title: "Relationship required",
        description: "Please select whether you're connecting with a student or friend",
        variant: "destructive",
      });
      return;
    }

    setEmailLoading(true);
    try {
      // NEW: Send user-to-user connection request (not learner-specific)
      // Include relationship info in message for student/friend connections
      let fullMessage = connectionMessage.trim();
      if (connectionType === 'parent' && searchForm.relationship) {
        const relationshipPrefix = `Connecting as ${searchForm.relationship === 'student' ? 'a student' : 'a friend'}`;
        fullMessage = fullMessage 
          ? `${relationshipPrefix}. ${fullMessage}` 
          : relationshipPrefix;
      }
      
      const result = await SharingService.sendConnectionRequest(
        selectedUser.id,
        fullMessage
      );
      
      if (result.success) {
        setSuccess(true);
        const userName = selectedUser.full_name || selectedUser.name || 'the user';
        setSuccessMessage(result.message || `Connection request sent to ${userName}!`);
        toast({
          title: "Connection request sent!",
          description: result.message,
        });
        // Refresh connections after successful request
        fetchConnections();
      } else {
        toast({
          title: "Error sending request",
          description: result.error || "Could not send connection request. Please try again.",
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
      setEmailLoading(false);
    }
  };

  const resetForm = () => {
    setConnectionEmail("");
    setConnectionMessage("");
    setSearchForm({ role: "", name: "", email: "", relationship: "" });
    setSearchResults([]);
    setHasSearched(false);
    setSelectedUser(null);
    setSuccess(false);
    setSuccessMessage("");
    setShowAddConnection(false);
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

  // Create reusable form component
  const renderAddConnectionForm = () => {
    const isTeacher = connectionType === 'teacher';
    const isFriend = connectionType === 'parent';
    
    return (
    <div className="space-y-4">
      {/* Minimalist Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <UserPlus className={`h-5 w-5 ${
            isTeacher ? 'text-blue-600' : isFriend ? 'text-green-600' : 'text-purple-600'
          }`} />
          <h3 className={`text-lg font-semibold ${
            isTeacher ? 'text-blue-900' : isFriend ? 'text-green-900' : 'text-purple-900'
          }`}>
            {isTeacher ? 'Connect with Teacher' : isFriend ? 'Connect with Student/Friend' : 'Add New Connection'}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowAddConnection(false);
            setConnectionType(null);
          }}
          className="hover:bg-gray-100"
        >
          ✕
        </Button>
      </div>

      {!success ? (
        <div className="space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            {/* Auto-set role field (hidden) */}
            <input 
              type="hidden" 
              value={isTeacher ? 'teacher' : isFriend ? 'parent' : searchForm.role}
              onChange={() => {}} // No-op since it's auto-set
            />
            
            {/* Name Input Field with Inline Search Button */}
            <div className="space-y-2">
              <Label htmlFor="searchName" className="text-sm text-gray-700">
                Name <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="searchName"
                  type="text"
                  placeholder={`${isTeacher ? 'Teacher' : isFriend ? 'Student/Friend' : 'User'}'s first or full name`}
                  value={searchForm.name}
                  onChange={(e) => {
                    setSearchForm(prev => ({
                      ...prev, 
                      name: e.target.value,
                      role: isTeacher ? 'teacher' : isFriend ? 'parent' : prev.role
                    }));
                  }}
                  className="h-9 text-sm flex-1"
                />
                <Button 
                  type="submit" 
                  className={`h-9 px-4 ${
                    isTeacher 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : isFriend 
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  disabled={searching}
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Relationship field for Student/Friend connections */}
            {isFriend && (
              <div className="space-y-2">
                <Label htmlFor="relationship" className="text-sm text-gray-700">
                  Relationship <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={searchForm.relationship} 
                  onValueChange={(value) => setSearchForm(prev => ({...prev, relationship: value}))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form>

          {/* Search Results */}
          {hasSearched && searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Search Results</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((user: any) => {
                  const alreadyConnected = isUserAlreadyConnected(user.id);
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        alreadyConnected 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{user.full_name || user.name || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500">
                          {user.email || 'No email'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(user.role_type)}>
                          {user.role_type || 'user'}
                        </Badge>
                        {alreadyConnected ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            Connected
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setDialogUser(user);
                              setDialogMessage("");
                              setShowConnectDialog(true);
                            }}
                            className={`${
                              isTeacher 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : isFriend 
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connection Dialog */}
          <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className={`h-5 w-5 ${
                    isTeacher ? 'text-blue-600' : isFriend ? 'text-green-600' : 'text-purple-600'
                  }`} />
                  Connect with {dialogUser?.full_name || dialogUser?.name || 'User'}
                </DialogTitle>
                <DialogDescription>
                  Send a connection request to {dialogUser?.full_name || dialogUser?.name || 'this user'}.
                  {connectionType === 'parent' && searchForm.relationship && (
                    <span className="text-green-600 font-medium">
                      {' '}You'll be connecting as a {searchForm.relationship}.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{dialogUser?.full_name || dialogUser?.name || 'Unknown User'}</div>
                    <div className="text-xs text-gray-500">{dialogUser?.email || 'No email'}</div>
                  </div>
                  <Badge className={getRoleColor(dialogUser?.role_type)}>
                    {dialogUser?.role_type || 'user'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dialogMessage" className="text-sm">
                    Personal Message <span className="text-gray-500">(optional)</span>
                  </Label>
                  <Input
                    id="dialogMessage"
                    placeholder="Add a personal message to introduce yourself..."
                    value={dialogMessage}
                    onChange={(e) => setDialogMessage(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConnectDialog(false);
                    setDialogUser(null);
                    setDialogMessage("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDialogConnect}
                  disabled={emailLoading}
                  className={`${
                    isTeacher 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : isFriend 
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Send Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="text-center py-6 space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <UserCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Connection Request Sent!</h3>
          <p className="text-sm text-gray-500">
            {successMessage}
          </p>
          <Button
            onClick={() => {
              setShowAddConnection(false);
              setConnectionType(null);
              setSuccess(false);
              setSuccessMessage("");
              setSearchForm({ role: "", name: "", email: "", relationship: "" });
              setSelectedUser(null);
              setConnectionMessage("");
              setHasSearched(false);
              fetchConnections();
            }}
            className={`${
              isTeacher 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : isFriend 
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            Done
          </Button>
        </div>
      )}
    </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Connect</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <ConnectWithTeacherButton
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 flex-1 sm:flex-none touch-manipulation"
                buttonText="Connect with Teacher"
                onSuccess={() => {
                  fetchConnections(); // Refresh connections after successful connection
                }}
              />
              <Button 
                onClick={() => {
                  setConnectionType('parent');
                  setShowAddConnection(true);
                }}
                className="bg-green-600 hover:bg-green-700 active:bg-green-800 flex-1 sm:flex-none touch-manipulation"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-sm">Connect with Student/Friend</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showAddConnection && connectionType && (
          <CardContent className={`border-t pt-4 ${
            connectionType === 'teacher' ? 'bg-blue-50/50' : 'bg-green-50/50'
          }`}>
            {renderAddConnectionForm()}
          </CardContent>
        )}
        
        <CardContent>
          {/* My Connections Section Header */}
          <div 
            className="flex items-center justify-between p-3 mb-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setShowConnections(!showConnections)}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">My Connections</h3>
              <Badge variant="outline" className="text-xs">
                Loading...
              </Badge>
            </div>
            <div className="text-gray-500">
              {showConnections ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
          
          {showConnections && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                Loading connections...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Connect</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <ConnectWithTeacherButton
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 flex-1 sm:flex-none touch-manipulation"
                buttonText="Connect with Teacher"
                onSuccess={() => {
                  fetchConnections(); // Refresh connections after successful connection
                }}
              />
              <Button 
                onClick={() => {
                  setConnectionType('parent');
                  setShowAddConnection(true);
                }}
                className="bg-green-600 hover:bg-green-700 active:bg-green-800 flex-1 sm:flex-none touch-manipulation"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-sm">Connect with Student/Friend</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showAddConnection && connectionType && (
          <CardContent className={`border-t pt-4 ${
            connectionType === 'teacher' ? 'bg-blue-50/50' : 'bg-green-50/50'
          }`}>
            {renderAddConnectionForm()}
          </CardContent>
        )}
        
        <CardContent>
          {/* My Connections Section Header */}
          <div 
            className="flex items-center justify-between p-3 mb-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setShowConnections(!showConnections)}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">My Connections</h3>
              <Badge variant="outline" className="text-xs">
                0 connections
              </Badge>
            </div>
            <div className="text-gray-500">
              {showConnections ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
          
          {showConnections && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-500">
                When you connect with other users, they'll appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      {showAddConnection && connectionType && (
        <CardContent className={`border-t pt-4 ${
          connectionType === 'teacher' ? 'bg-blue-50/50' : 'bg-green-50/50'
        }`}>
          {renderAddConnectionForm()}
        </CardContent>
      )}
      
      <CardContent className="p-6">
        {/* Connect Section */}
        <div className="mb-6">
          {/* Add Connection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/30 hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center text-center min-h-[120px] group">
              <div className="p-2 bg-blue-100 rounded-full mb-2 group-hover:bg-blue-200 transition-colors">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-1">Connect with Teacher</h4>
              <p className="text-xs text-blue-700 mb-3">Find and connect with teachers</p>
              <ConnectWithTeacherButton
                variant="outline"
                size="sm"
                buttonText="Find Teacher"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onSuccess={() => {
                  fetchConnections(); // Refresh connections after successful connection
                }}
              />
            </div>

            <div 
              className="p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50/30 hover:bg-green-50/50 cursor-pointer transition-colors flex flex-col items-center justify-center text-center min-h-[120px] group"
              onClick={() => {
                setConnectionType('parent');
                setShowAddConnection(true);
              }}
            >
              <div className="p-2 bg-green-100 rounded-full mb-2 group-hover:bg-green-200 transition-colors">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-900 mb-1">Connect with Friend</h4>
              <p className="text-xs text-green-700">Find and connect with students or friends</p>
            </div>
          </div>
        </div>

        {/* My Connections Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-gray-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">My Connections</h3>
            <Badge variant="secondary" className="text-xs">
              {connections.length}
            </Badge>
          </div>

          {connections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <div key={connection.id} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 min-h-[120px] flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-green-100 rounded-full">
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">{connection.other_user_name || 'Unknown User'}</h4>
                    <Badge className={`${getRoleColor(connection.other_user_role)} text-xs mb-2`}>
                      {connection.other_user_role || 'user'}
                    </Badge>
                    
                    <div className="text-xs text-gray-600 mb-2">
                      {connection.isOutgoing ? 'You connected' : 'They connected'}
                    </div>
                    
                    {connection.message && (
                      <div className="text-xs text-gray-500 italic line-clamp-2 mb-2">
                        "{connection.message}"
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="mx-auto h-8 w-8 mb-3 text-gray-400" />
              <p className="text-sm">No connections yet. Start by connecting with teachers or friends!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MyConnections;