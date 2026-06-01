import React, { useEffect, useState } from 'react';
import { X, RefreshCw, Sparkles } from 'lucide-react';
import { versionChecker, type VersionInfo } from '../services/versionChecker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface VersionUpdateNotificationProps {
  autoShow?: boolean; // Automatically show when update detected (default: true)
  position?: 'top' | 'bottom'; // Position of notification (default: bottom)
  allowDismiss?: boolean; // Allow user to dismiss (default: true)
  autoReloadDelay?: number; // Auto reload after X seconds (0 = disabled, default: 0)
}

export function VersionUpdateNotification({
  autoShow = true,
  position = 'bottom',
  allowDismiss = true,
  autoReloadDelay = 0
}: VersionUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);
  const [oldVersion, setOldVersion] = useState<VersionInfo | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    // Initialize version checker on page load
    versionChecker.initialize();

    // Subscribe to version changes
    const unsubscribe = versionChecker.onVersionChange((newVer, oldVer) => {

      setNewVersion(newVer);
      setOldVersion(oldVer);

      if (autoShow) {
        setIsVisible(true);
      }

      // Start auto-reload countdown if configured
      if (autoReloadDelay > 0) {
        setCountdown(autoReloadDelay);
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [autoShow, autoReloadDelay]);

  // Handle countdown for auto-reload
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      if (countdown === 1) {
        handleReload();
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleReload = () => {
    setIsReloading(true);

    // Save any pending data to localStorage as backup
    const pendingData = {
      timestamp: new Date().toISOString(),
      message: 'App reloaded for update'
    };
    localStorage.setItem('pre_reload_backup', JSON.stringify(pendingData));

    // Small delay for visual feedback
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setCountdown(null); // Cancel auto-reload
  };

  if (!isVisible || !newVersion || !oldVersion) {
    return null;
  }

  const positionClasses = position === 'top'
    ? 'top-4 animate-slide-down'
    : 'bottom-4 animate-slide-up';

  const formatBuildTime = (buildTime: string) => {
    const date = new Date(buildTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`fixed left-1/2 transform -translate-x-1/2 z-50 ${positionClasses} w-full max-w-lg px-4`}
      role="alert"
      aria-live="polite"
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
              <h3 className="text-lg font-semibold text-gray-800">
                New Version Available!
              </h3>
            </div>
            {allowDismiss && !isReloading && (
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Version Info */}
          <div className="mb-4 space-y-2">            
            <div className="text-xs text-gray-500">
              Built: {formatBuildTime(newVersion.buildTime)}
              {newVersion.gitCommit && (
                <span className="ml-2">({newVersion.gitCommit})</span>
              )}
            </div>
          </div>

          {/* Benefits message */}
          <div className="mb-4 p-3 bg-white/60 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              🐛 <strong>Bug fixes and improvements are available!</strong>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Reload the page to get the latest updates and fixes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleReload}
              disabled={isReloading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isReloading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reloading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Now
                  {countdown !== null && countdown > 0 && (
                    <span className="ml-2 text-xs">({countdown}s)</span>
                  )}
                </>
              )}
            </Button>

            {allowDismiss && !isReloading && !countdown && (
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="border-gray-300"
              >
                Later
              </Button>
            )}
          </div>

          {/* Auto-reload warning */}
          {countdown !== null && countdown > 0 && (
            <div className="mt-3 text-xs text-center text-orange-600">
              ⏱️ Auto-reloading in {countdown} seconds...
            </div>
          )}

          {/* Detection info */}
          <div className="mt-3 text-xs text-center text-gray-500">
            💡 Updates are checked when you load or refresh any page
          </div>
        </div>
      </Card>
    </div>
  );
}

// Styles for animations (add to your global CSS or Tailwind config)
const animationStyles = `
@keyframes slide-up {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes slide-down {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
`;

// Export animation styles for inclusion in global CSS
export { animationStyles };