import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  UserPlus,
  Loader2,
  Plus,
  Search,
  UserCheck,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SharingService from "@/services/sharingService";

interface ConnectWithTeacherButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  buttonText?: string;
  onSuccess?: () => void;
}

export function ConnectWithTeacherButton({
  variant = "default",
  size = "default",
  className = "",
  buttonText = "Connect with Teacher",
  onSuccess
}: ConnectWithTeacherButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchForm, setSearchForm] = useState({
    name: "",
    email: ""
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSearchFormExpanded, setIsSearchFormExpanded] = useState(true);

  // Dialog state for connection request
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [dialogUser, setDialogUser] = useState<any>(null);
  const [dialogMessage, setDialogMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const { toast } = useToast();

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that name is provided (mandatory for privacy)
    if (!searchForm.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the teacher's first name or full name to search",
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

    setSearching(true);
    setHasSearched(true);
    try {
      const result = await SharingService.searchUsersByFields({
        role: 'teacher',
        name: searchForm.name.trim() || undefined,
        email: searchForm.email.trim() || undefined
      });

      if (result.success) {
        // Filter to only show teachers
        const teacherResults = (result.users || []).filter((user: any) =>
          user.role_type === 'teacher'
        );
        setSearchResults(teacherResults);

        if (teacherResults.length === 0) {
          toast({
            title: "No teachers found",
            description: "Try adjusting your search criteria or ask your teacher to sign up first",
          });
        } else {
          // Collapse search form when results are found
          setIsSearchFormExpanded(false);
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

  const handleDialogConnect = async () => {
    if (!dialogUser) return;

    setEmailLoading(true);
    try {
      const result = await SharingService.sendConnectionRequest(
        dialogUser.id,
        dialogMessage.trim()
      );

      if (result.success) {
        setSuccess(true);
        const userName = dialogUser.full_name || dialogUser.name || 'the teacher';
        setSuccessMessage(`Once ${userName} approves, you can see them in your connections and they can write personalized notes for you!`);
        toast({
          title: "Connection request sent!",
          description: `Request sent to ${userName}. They'll be able to write practice notes once they accept!`,
        });

        // Close dialogs
        setShowConnectDialog(false);
        setDialogUser(null);
        setDialogMessage("");

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
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
    setSearchForm({ name: "", email: "" });
    setSearchResults([]);
    setHasSearched(false);
    setSuccess(false);
    setSuccessMessage("");
    setIsSearchFormExpanded(true);
    setIsOpen(false);
  };

  const getRoleColor = (role: string | undefined | null) => {
    if (role === 'teacher') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`${className} bg-purple-600 hover:bg-purple-700 text-white`}
        onClick={() => setIsOpen(true)}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsOpen(open);
      }}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              Connect with Teacher
            </DialogTitle>
            <DialogDescription>
              Search for your teacher by name to connect with them.
            </DialogDescription>
          </DialogHeader>

          {!success ? (
            <div className="space-y-4">
              {/* Collapsible Search Form */}
              <Collapsible open={isSearchFormExpanded} onOpenChange={setIsSearchFormExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto"
                    type="button"
                  >
                    <span className="text-sm sm:text-base font-medium text-gray-700">
                      {hasSearched && searchResults.length > 0 ? 'Search Again' : 'Search for Teacher'}
                    </span>
                    {isSearchFormExpanded ? (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-3 mt-3">
                  <form onSubmit={handleSearchSubmit} className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacherName" className="text-sm sm:text-base text-gray-700">
                        Teacher's Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="teacherName"
                          type="text"
                          placeholder="Teacher's first or full name"
                          value={searchForm.name}
                          onChange={(e) => setSearchForm(prev => ({...prev, name: e.target.value}))}
                          className="h-9 sm:h-10 text-sm sm:text-base flex-1"
                        />
                        <Button
                          type="submit"
                          className="h-9 sm:h-10 px-3 sm:px-4 bg-purple-600 hover:bg-purple-700 flex-shrink-0"
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

                    <div className="space-y-2">
                      <Label htmlFor="teacherEmail" className="text-sm sm:text-base text-gray-700">
                        Teacher's Email <span className="text-gray-500">(optional)</span>
                      </Label>
                      <Input
                        id="teacherEmail"
                        type="email"
                        placeholder="teacher@example.com"
                        value={searchForm.email}
                        onChange={(e) => setSearchForm(prev => ({...prev, email: e.target.value}))}
                        className="h-9 sm:h-10 text-sm sm:text-base"
                      />
                    </div>
                  </form>
                </CollapsibleContent>
              </Collapsible>

              {/* Search Results */}
              {hasSearched && searchResults.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700">Teachers Found</h4>
                  <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto">
                    {searchResults.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border bg-white hover:bg-gray-50 gap-2 sm:gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base truncate">{user.full_name || user.name || 'Unknown Teacher'}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {user.email || 'No email'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`${getRoleColor(user.role_type)} text-xs sm:text-sm`}>
                            {user.role_type || 'user'}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              setDialogUser(user);
                              setDialogMessage("");
                              setShowConnectDialog(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Connect
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results message with signup link - More prominent and responsive */}
              {hasSearched && searchResults.length === 0 && !searching && (
                <div className="border-2 border-amber-300 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 p-3 sm:p-4">
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="text-2xl sm:text-3xl">👨‍🏫</div>
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1 text-sm sm:text-base">Teacher Not Found</h4>
                      <p className="text-sm sm:text-base text-amber-700 mb-3">
                        Your teacher might not have signed up yet. Share this link with them:
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-amber-200">
                      <div className="flex flex-col sm:flex-row gap-2 mb-2">
                        <input
                          type="text"
                          value={window.location.origin}
                          readOnly
                          className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm border rounded bg-gray-50 text-gray-700 min-w-0"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin);
                            toast({
                              title: "Link copied!",
                              description: "Share this website link with your teacher so they can sign up",
                            });
                          }}
                          className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200 flex-shrink-0 px-3 sm:px-4 h-8 sm:h-9 text-xs sm:text-sm"
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-600">
                        Once your teacher signs up, you can search for them again and connect!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3 sm:space-y-4">
              <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <UserCheck className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900">Connection Request Sent!</h3>
              <p className="text-sm sm:text-base text-gray-500 px-2">
                {successMessage}
              </p>
              <Button
                onClick={() => resetForm()}
                className="bg-purple-600 hover:bg-purple-700 h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base"
              >
                Done
              </Button>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            {!success && (
              <Button
                variant="outline"
                onClick={() => resetForm()}
                className="h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base"
              >
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connection Request Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              Connect with {dialogUser?.full_name || dialogUser?.name || 'Teacher'}
            </DialogTitle>
            <DialogDescription>
              Send a connection request to {dialogUser?.full_name || dialogUser?.name || 'this teacher'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base truncate">{dialogUser?.full_name || dialogUser?.name || 'Unknown Teacher'}</div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">{dialogUser?.email || 'No email'}</div>
              </div>
              <Badge className={`${getRoleColor(dialogUser?.role_type)} text-xs sm:text-sm flex-shrink-0`}>
                {dialogUser?.role_type || 'user'}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialogMessage" className="text-sm sm:text-base">
                Personal Message <span className="text-gray-500">(optional)</span>
              </Label>
              <Input
                id="dialogMessage"
                placeholder="Hi! I'd like to connect so you can help with my music practice..."
                value={dialogMessage}
                onChange={(e) => setDialogMessage(e.target.value)}
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConnectDialog(false);
                setDialogUser(null);
                setDialogMessage("");
              }}
              className="h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogConnect}
              disabled={emailLoading}
              className="bg-purple-600 hover:bg-purple-700 h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base"
            >
              {emailLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Sending...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Send Request</span>
                  <span className="sm:hidden">Send</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}