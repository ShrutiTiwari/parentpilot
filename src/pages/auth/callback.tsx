import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  console.log("AuthCallback component rendered. Location:", window.location.href);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log("handleAuthCallback: Starting auth callback processing");
      console.log("handleAuthCallback: Full URL:", window.location.href);
      console.log("handleAuthCallback: Search params:", window.location.search);
      console.log("handleAuthCallback: Hash:", window.location.hash);

      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);

      // Check for recovery type in URL params or hash
      const typeFromSearch = searchParams.get('type');
      const typeFromHash = hash ? new URLSearchParams(hash.substring(1)).get('type') : null;
      const isRecovery = typeFromSearch === 'recovery' || typeFromHash === 'recovery';

      // Handle password recovery flow
      if (isRecovery || hash.includes('type=recovery')) {
        console.log("handleAuthCallback: Password recovery flow detected");

        // Handle the hash parameters for password recovery
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (access_token && refresh_token && type === 'recovery') {
            console.log("handleAuthCallback: Setting recovery session with tokens");

            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (error) {
              console.error("Password recovery session error:", error);
              navigate('/auth');
              return;
            }

            console.log("handleAuthCallback: Password recovery session established, redirecting to reset form");
            // Store recovery flag to prevent auto-login
            sessionStorage.setItem('password_recovery_active', 'true');
            navigate('/reset-password');
            return;
          }
        }

        // Fallback: Try to get existing session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Password recovery session error:", error);
          navigate('/auth');
          return;
        }

        if (session) {
          console.log("handleAuthCallback: Password recovery session found, redirecting to reset form");
          // Store recovery flag to prevent auto-login
          sessionStorage.setItem('password_recovery_active', 'true');
          navigate('/reset-password');
          return;
        } else {
          console.log("handleAuthCallback: No session for password recovery");
          navigate('/auth');
          return;
        }
      }

      // Handle OAuth flow (existing logic)
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        console.log("handleAuthCallback: Tokens found:", {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token
        });

        if (access_token && refresh_token) {
          console.log("handleAuthCallback: Setting session with tokens");
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.error("OAuth login error:", error.message);

            // Preserve returnTo parameter in error redirect
            const urlParams = new URLSearchParams(window.location.search);
            const returnTo = urlParams.get('returnTo');
            const authUrl = returnTo ? `/auth?returnTo=${encodeURIComponent(returnTo)}` : '/auth';

            navigate(authUrl);
          } else {
            console.log("handleAuthCallback: Session set successfully");

            // Check for returnTo parameter in URL, cookies, sessionStorage, or localStorage
            const urlParams = new URLSearchParams(window.location.search);

            // Helper to get cookie value
            const getCookie = (name: string) => {
              const value = `; ${document.cookie}`;
              const parts = value.split(`; ${name}=`);
              if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
              return null;
            };

            const cookieReturnTo = getCookie('authReturnTo');
            const cookieOrigin = getCookie('authOrigin');
            const sessionReturnTo = sessionStorage.getItem('authReturnTo');
            const sessionOrigin = sessionStorage.getItem('authOrigin');
            const storedReturnTo = localStorage.getItem('authReturnTo');
            const storedOrigin = localStorage.getItem('authOrigin');

            console.log("🔍 CALLBACK.TSX: OAuth session established!");
            console.log("🔍 CALLBACK.TSX: Current URL:", window.location.href);
            console.log("🔍 CALLBACK.TSX: URL search params:", window.location.search);
            console.log("🔍 CALLBACK.TSX: returnTo from URL params:", urlParams.get('returnTo'));
            console.log("🔍 CALLBACK.TSX: origin from URL params:", urlParams.get('origin'));
            console.log("🔍 CALLBACK.TSX: returnTo from cookie:", cookieReturnTo);
            console.log("🔍 CALLBACK.TSX: origin from cookie:", cookieOrigin);
            console.log("🔍 CALLBACK.TSX: returnTo from sessionStorage:", sessionReturnTo);
            console.log("🔍 CALLBACK.TSX: origin from sessionStorage:", sessionOrigin);
            console.log("🔍 CALLBACK.TSX: returnTo from localStorage:", storedReturnTo);
            console.log("🔍 CALLBACK.TSX: origin from localStorage:", storedOrigin);

            // IMPORTANT: Prioritize cookies (work across subdomains), then sessionStorage, then localStorage, then URL params
            // Filter out 'null' string values
            const urlReturnTo = urlParams.get('returnTo');
            const urlOrigin = urlParams.get('origin');
            const validUrlReturnTo = urlReturnTo && urlReturnTo !== 'null' ? urlReturnTo : null;
            const validUrlOrigin = urlOrigin && urlOrigin !== 'null' ? urlOrigin : null;
            const validCookieReturnTo = cookieReturnTo && cookieReturnTo !== 'null' ? cookieReturnTo : null;
            const validCookieOrigin = cookieOrigin && cookieOrigin !== 'null' ? cookieOrigin : null;
            const validSessionReturnTo = sessionReturnTo && sessionReturnTo !== 'null' ? sessionReturnTo : null;
            const validSessionOrigin = sessionOrigin && sessionOrigin !== 'null' ? sessionOrigin : null;
            const validStoredReturnTo = storedReturnTo && storedReturnTo !== 'null' ? storedReturnTo : null;
            const validStoredOrigin = storedOrigin && storedOrigin !== 'null' ? storedOrigin : null;

            const returnTo = validCookieReturnTo || validSessionReturnTo || validUrlReturnTo || validStoredReturnTo || '/';
            const targetOrigin = validCookieOrigin || validSessionOrigin || validUrlOrigin || validStoredOrigin;

            console.log("🔍 CALLBACK.TSX: Final decisions:", { returnTo, targetOrigin });

            // Clean up cookies and storage
            setTimeout(() => {
              console.log("🔍 CALLBACK.TSX: Removing auth data from all storage");
              localStorage.removeItem('authReturnTo');
              localStorage.removeItem('authOrigin');
              sessionStorage.removeItem('authReturnTo');
              sessionStorage.removeItem('authOrigin');

              // Delete cookies
              let domain;
              if (window.location.hostname.includes('powerparent.co.uk')) {
                domain = '.powerparent.co.uk';
              } else if (window.location.hostname.includes('.localhost')) {
                domain = '.localhost';
              } else {
                domain = window.location.hostname;
              }
              document.cookie = `authOrigin=; path=/; domain=${domain}; max-age=0`;
              document.cookie = `authReturnTo=; path=/; domain=${domain}; max-age=0`;
            }, 100);

            // If we have a target origin different from current, redirect to that origin with the path
            if (targetOrigin && targetOrigin !== window.location.origin) {
              const fullUrl = `${targetOrigin}${returnTo}`;
              console.log("🔍 CALLBACK.TSX: ✅ FULL PAGE REDIRECT TO:", fullUrl);
              window.location.href = fullUrl;
            } else {
              // Navigate to the return URL (same origin)
              console.log("🔍 CALLBACK.TSX: ✅ NAVIGATING TO:", returnTo);
              navigate(returnTo);
            }
          }
        } else {
          console.log("handleAuthCallback: No tokens found in hash, redirecting to auth");

          // Preserve returnTo parameter in error redirect
          const urlParams = new URLSearchParams(window.location.search);
          const returnTo = urlParams.get('returnTo');
          const authUrl = returnTo ? `/auth?returnTo=${encodeURIComponent(returnTo)}` : '/auth';

          navigate(authUrl);
        }
      } else {
        console.log("handleAuthCallback: No hash found, redirecting to auth");

        // Preserve returnTo parameter in error redirect
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('returnTo');
        const authUrl = returnTo ? `/auth?returnTo=${encodeURIComponent(returnTo)}` : '/auth';

        navigate(authUrl);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return <p className="text-center mt-10">Finishing login, please wait...</p>;
}
