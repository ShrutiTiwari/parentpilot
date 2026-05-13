import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Cookies from "js-cookie";
import { PowerParentAnalytics } from "@/utils/analytics";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Store returnTo parameter in localStorage for OAuth flows
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get('returnTo');
    console.log('🔍 AUTH.TSX USEEFFECT START - URL:', window.location.href);
    console.log('🔍 AUTH.TSX: returnTo from URL params:', returnTo);
    console.log('🔍 AUTH.TSX: Current localStorage authReturnTo:', localStorage.getItem('authReturnTo'));

    // ALWAYS store the current origin (subdomain info) for OAuth flows
    const currentOrigin = window.location.origin;
    localStorage.setItem('authOrigin', currentOrigin);
    console.log('🔍 AUTH.TSX: Stored origin:', currentOrigin);

    if (returnTo) {
      console.log('🔍 AUTH.TSX: ✅ PROCESSING returnTo:', returnTo);

      // Smart storage: Clean URLs to valid routes
      let urlToStore = returnTo;

      // Check if URL contains default grade (grade/3) or board-specific URL without grade
      if (returnTo.includes('/grade/3/') || returnTo.includes('/abrsm/') || returnTo.includes('/trinity/')) {
        // Extract the module from the URL (scales, pieces, aural, theory, sightreading, overview)
        const moduleMatch = returnTo.match(/\/(scales|pieces|aural|theory|sightreading|overview)$/);
        if (moduleMatch) {
          urlToStore = `/music/${moduleMatch[1]}`;
        } else {
          urlToStore = '/music';
        }
      }

      console.log('🔍 AUTH.TSX: ✅ STORING cleaned returnTo in localStorage:', urlToStore);
      localStorage.setItem('authReturnTo', urlToStore);
      console.log('🔍 AUTH.TSX: ✅ STORED! Verification read:', localStorage.getItem('authReturnTo'));
    } else {
      console.log('🔍 AUTH.TSX: ❌ No returnTo in URL params');
    }

    // Check if there's an active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Helper to get cookie value
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
          return null;
        };

        // Check for returnTo from multiple sources
        const urlParams = new URLSearchParams(window.location.search);
        const cookieReturnTo = getCookie('authReturnTo');
        const cookieOrigin = getCookie('authOrigin');
        const storedReturnTo = localStorage.getItem('authReturnTo');
        const storedOrigin = localStorage.getItem('authOrigin');

        const returnTo = urlParams.get('returnTo') || cookieReturnTo || storedReturnTo || '/events';
        const targetOrigin = cookieOrigin || storedOrigin;

        console.log('🔍 Auth.tsx existing session redirect:', { returnTo, targetOrigin, currentOrigin: window.location.origin });

        // If target origin differs from current, do full page redirect
        if (targetOrigin && targetOrigin !== window.location.origin) {
          console.log('🔍 Auth.tsx: Redirecting to different origin:', `${targetOrigin}${returnTo}`);
          window.location.href = `${targetOrigin}${returnTo}`;
        } else {
          navigate(returnTo);
        }
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          // Don't navigate if we're on the callback page - let callback handle it
          if (window.location.pathname === '/auth/callback') {
            console.log('🔍 Auth.tsx: Skipping navigation - callback will handle it');
            return;
          }

          // Save parent name in cookie if available
          if (session.user?.user_metadata?.full_name) {
            Cookies.set('parentName', session.user.user_metadata.full_name);
          }

          // Check for returnTo parameter
          const urlParams = new URLSearchParams(window.location.search);
          const storedReturnTo = localStorage.getItem('authReturnTo');
          const storedOrigin = localStorage.getItem('authOrigin');
          const returnTo = urlParams.get('returnTo') || storedReturnTo || '/events';

          console.log('🔍 Auth.tsx auth state change redirect:', {
            fromUrl: urlParams.get('returnTo'),
            fromStorage: storedReturnTo,
            storedOrigin: storedOrigin,
            finalReturnTo: returnTo,
            currentPath: window.location.pathname,
            currentOrigin: window.location.origin
          });

          // Only clean up if we're using it from URL (email login)
          // For OAuth, let the callback handle cleanup
          if (urlParams.get('returnTo')) {
            localStorage.removeItem('authReturnTo');
            localStorage.removeItem('authOrigin');
          }

          // If we have a stored origin different from current, do a full page redirect
          if (storedOrigin && storedOrigin !== window.location.origin) {
            const fullUrl = `${storedOrigin}${returnTo}`;
            console.log('🔍 Auth.tsx: Redirecting to different origin:', fullUrl);
            window.location.href = fullUrl;
          } else {
            navigate(returnTo);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

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

      // Track successful signup
      PowerParentAnalytics.trackSignUp('email');

      // In local development, show simple toast and allow immediate login
      // In production, show email verification screen
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalhost) {
        // Local dev: Simple toast
        toast({
          title: "Success!",
          description: "Account created! You can now sign in. (Email verification skipped in local dev)",
          duration: 7000,
        });
      } else {
        // Production: Show email verification screen
        setVerificationEmail(email);
        setShowEmailVerification(true);
      }
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

  const handleResendVerification = async () => {
    try {
      setResendLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail
      });

      if (error) throw error;

      toast({
        title: "Email Sent!",
        description: "Verification email has been resent. Please check your inbox.",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
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

      // Track successful login
      PowerParentAnalytics.trackLogin('email');
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

      // Get returnTo parameter to pass through OAuth flow
      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('returnTo');
      const storedReturnTo = localStorage.getItem('authReturnTo');

      console.log('🔍 GOOGLE SIGNIN START');
      console.log('🔍 GOOGLE: returnTo from URL:', returnTo);
      console.log('🔍 GOOGLE: returnTo from localStorage:', storedReturnTo);
      console.log('🔍 GOOGLE: Will use for callback:', returnTo || storedReturnTo);

      // Include returnTo in the callback URL if it exists and is not null
      const finalReturnTo = returnTo || storedReturnTo;
      const callbackUrl = finalReturnTo && finalReturnTo !== 'null'
        ? `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(finalReturnTo)}`
        : `${window.location.origin}/auth/callback`;

      console.log('🔍 GOOGLE OAuth redirectTo:', callbackUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      // Track Google OAuth attempt (success will be tracked in callback)
      // Add a small delay to ensure gtag is fully loaded
      setTimeout(() => {
        PowerParentAnalytics.trackEvent('oauth_attempt', {
          event_category: 'authentication',
          method: 'google',
        });
      }, 100);

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

  // Show email verification screen if needed
  if (showEmailVerification) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-[#D3E4FD] to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-5xl">📧</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#1EAEDB]">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-base">
              We sent a verification link to:
            </CardDescription>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-semibold text-blue-900">{verificationEmail}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Please click the verification link in the email to activate your account.
              </p>
              
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>Don't see the email?</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                    <li>Check your <strong>spam/junk folder</strong></li>
                    <li>Check <strong>promotions tab</strong> (Gmail users)</li>
                    <li>Wait a few minutes - it may be delayed</li>
                    <li>Make sure you entered the correct email</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleResendVerification}
                disabled={resendLoading}
                variant="outline"
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
              
              <Button
                onClick={() => {
                  setShowEmailVerification(false);
                  setVerificationEmail("");
                }}
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>
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
            Power Parent
          </CardTitle>
          <CardDescription className="text-center">
            Stay on top of your child's music practice
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
