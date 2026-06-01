import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsCheckingSession(true);

        // Check for hash parameters first (in case we got redirected with tokens in URL)
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (access_token && refresh_token && type === 'recovery') {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (error) {
              console.error("Failed to set session from hash:", error);
            } else {
              setIsValidSession(true);
              setIsCheckingSession(false);
              // Clear the hash from URL for security
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          }
        }

        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check error:", error);
          toast({
            title: "Error",
            description: "Invalid or expired reset link",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        if (!session) {
          toast({
            title: "Error",
            description: "Please use the link from your email to reset your password",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        setIsValidSession(true);
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {

      // Don't redirect away if we're in password recovery mode
      if (sessionStorage.getItem('password_recovery_active') === 'true') {
        if (session) {
          setIsValidSession(true);
          setIsCheckingSession(false);
        }
        return;
      }

      // Handle session loss when not in recovery mode
      if (!session && !resetComplete) {
        // Session expired or invalid
        toast({
          title: "Session Expired",
          description: "Please request a new password reset link",
          variant: "destructive",
        });
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast, resetComplete]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        title: "Invalid Password",
        description: passwordError,
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both password fields match",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setResetComplete(true);

      // Clear the recovery flag now that password is updated
      sessionStorage.removeItem('password_recovery_active');

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated",
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-[#D3E4FD] to-white">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1EAEDB]" />
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-[#D3E4FD] to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#1EAEDB]">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetComplete ? (
            <div className="text-center space-y-4">
              <div className="rounded-lg bg-green-50 p-6 border border-green-200">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Password Updated Successfully!
                </h3>
                <p className="text-sm text-green-700">
                  Redirecting you to the dashboard...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1EAEDB] text-white hover:bg-[#1EAEDB]/90"
                disabled={loading || !isValidSession}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-sm"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}