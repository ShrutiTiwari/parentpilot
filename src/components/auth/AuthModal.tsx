import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Cookies from "js-cookie";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  customMessage?: string;
}

export function AuthModal({ open, onOpenChange, onSuccess, customMessage }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { toast } = useToast();

  // Store current location when modal opens for return URL
  useEffect(() => {
    if (open) {
      const currentPath = window.location.pathname + window.location.search;
      const currentOrigin = window.location.origin;
      localStorage.setItem('authReturnTo', currentPath);
      localStorage.setItem('authOrigin', currentOrigin);
      console.log('🔍 AuthModal: Stored auth data:', { currentPath, currentOrigin });
    }
  }, [open]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Check your email to confirm your account",
      });
      
      // Close modal and call success callback
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Close modal and call success callback
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        // If no success callback, check for stored return URL and origin
        const storedReturnTo = localStorage.getItem('authReturnTo');
        const storedOrigin = localStorage.getItem('authOrigin');
        const currentPath = window.location.pathname + window.location.search;

        if (storedReturnTo && storedReturnTo !== currentPath && storedReturnTo !== 'null') {
          localStorage.removeItem('authReturnTo');
          localStorage.removeItem('authOrigin');

          // If origin differs, do full page redirect
          if (storedOrigin && storedOrigin !== window.location.origin) {
            window.location.href = `${storedOrigin}${storedReturnTo}`;
          } else {
            window.location.href = storedReturnTo;
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Invalid login credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleError(null);
      setLoading(true);

      // Preserve the current location for post-auth redirect
      const currentPath = window.location.pathname + window.location.search;
      const currentOrigin = window.location.origin;

      // Store in localStorage AND sessionStorage (as backup)
      localStorage.setItem('authReturnTo', currentPath);
      localStorage.setItem('authOrigin', currentOrigin);
      sessionStorage.setItem('authReturnTo', currentPath);
      sessionStorage.setItem('authOrigin', currentOrigin);

      // Also store in cookie that works across subdomains
      let domain;
      if (window.location.hostname.includes('powerparent.co.uk')) {
        domain = '.powerparent.co.uk';  // Works for all powerparent subdomains
      } else if (window.location.hostname.includes('.localhost')) {
        domain = '.localhost';  // Works for events.localhost, music.localhost, etc.
      } else {
        domain = window.location.hostname; // For plain localhost:8080
      }

      document.cookie = `authOrigin=${encodeURIComponent(currentOrigin)}; path=/; domain=${domain}; max-age=600; SameSite=Lax`;
      document.cookie = `authReturnTo=${encodeURIComponent(currentPath)}; path=/; domain=${domain}; max-age=600; SameSite=Lax`;

      const redirectUrl = `${window.location.origin}/auth/callback`;

      console.log('🔍 AuthModal Google OAuth: Stored auth data in multiple places:', {
        currentPath,
        currentOrigin,
        cookieDomain: domain,
        redirectUrl: redirectUrl
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("Google sign in error:", error);
        if (error.message.includes("provider is not enabled")) {
          setGoogleError("Google authentication is not enabled. Please contact the administrator.");
        } else {
          throw error;
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred with Google sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#1EAEDB]">
            Power Parent
          </DialogTitle>
          <DialogDescription className="text-center">
            {customMessage || "Sign up or sign in to save your school events"}
          </DialogDescription>
        </DialogHeader>
        
        {googleError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {googleError}
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          variant="outline" 
          className="w-full mb-4 flex items-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Sign in with Google
        </Button>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Tabs defaultValue="sign-in" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sign-in">
            {!showForgotPassword ? (
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="parent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-[#1EAEDB] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#1EAEDB] text-white hover:bg-[#1EAEDB]/90"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            ) : (
              <div className="space-y-4 mt-4">
                {!resetEmailSent ? (
                  <>
                    <div className="text-center mb-4">
                      <h3 className="font-semibold">Reset your password</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password
                      </p>
                    </div>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="parent@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetEmail("");
                          }}
                          disabled={loading}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-[#1EAEDB] text-white hover:bg-[#1EAEDB]/90"
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Send Reset Link
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                      <h3 className="font-semibold text-green-800">Email Sent!</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Check your email for password reset instructions
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                        setResetEmail("");
                      }}
                      className="w-full"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sign-up">
            <form onSubmit={handleSignUp} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Password</Label>
                <Input
                  id="password-signup"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#1EAEDB] text-white hover:bg-[#1EAEDB]/90"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 