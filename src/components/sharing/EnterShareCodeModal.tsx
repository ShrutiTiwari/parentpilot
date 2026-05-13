import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SharingService from "@/services/sharingService";

interface EnterShareCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EnterShareCodeModal({ 
  open, 
  onOpenChange,
  onSuccess 
}: EnterShareCodeModalProps) {
  const [shareCode, setShareCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shareCode.trim()) {
      toast({
        title: "Enter share code",
        description: "Please enter the share code you received",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await SharingService.submitShareCode(shareCode.trim().toUpperCase());
      
      if (result.success) {
        setSuccess(true);
        setSuccessMessage(result.message || "Access request sent successfully!");
        toast({
          title: "Request sent!",
          description: result.message,
        });
        onSuccess?.();
      } else {
        toast({
          title: "Invalid code",
          description: result.error || "The share code is invalid or has expired",
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
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShareCode("");
    setSuccess(false);
    setSuccessMessage("");
    onOpenChange(false);
  };

  const formatShareCode = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Add hyphen after SHARE if it's not there
    if (cleaned.startsWith('SHARE') && cleaned.length > 5 && !cleaned.startsWith('SHARE-')) {
      return 'SHARE-' + cleaned.substring(5);
    }
    
    return cleaned;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatShareCode(e.target.value);
    setShareCode(formatted);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#1EAEDB]" />
            Add Learner Access
          </DialogTitle>
          <DialogDescription>
            Enter the share code you received to request access to a student's progress.
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shareCode">Share Code</Label>
              <Input
                id="shareCode"
                placeholder="SHARE-ABC123"
                value={shareCode}
                onChange={handleCodeChange}
                className="font-mono text-center text-lg tracking-wider"
                disabled={loading}
                autoFocus
              />
              <p className="text-sm text-gray-500">
                Format: SHARE-ABC123 (case insensitive)
              </p>
            </div>

            <Card className="bg-blue-50 border-[#1EAEDB]/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#1EAEDB] mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">How this works:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600">
                      <li>Enter the code you received</li>
                      <li>A request will be sent to the student's parent/guardian</li>
                      <li>Once approved, you'll see the student in your dashboard</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!shareCode.trim() || loading}
                className="bg-[#1EAEDB] hover:bg-[#1EAEDB]/90 flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Access
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Request Sent!</h3>
              <p className="text-gray-600 mb-4">{successMessage}</p>
              <p className="text-sm text-gray-500">
                You'll be notified when the parent approves your request. 
                The student will then appear in your dashboard.
              </p>
            </div>

            <Button 
              onClick={handleClose}
              className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB]/90"
            >
              Got it
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EnterShareCodeModal;