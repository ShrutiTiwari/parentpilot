/**
 * Version Checker Service
 * Checks for version changes on page load and notifies users of new deployments
 */

interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit?: string;
}

type VersionChangeCallback = (newVersion: VersionInfo, oldVersion: VersionInfo) => void;

class VersionChecker {
  private currentVersion: VersionInfo | null = null;
  private isChecking = false;
  private callbacks: Set<VersionChangeCallback> = new Set();
  private hasCheckedThisSession = false;
  private isInitialCheck = true; // Track if this is the first check after page load
  private checkInterval: NodeJS.Timeout | null = null;

  // Storage key for persisting version across sessions
  private readonly STORAGE_KEY = 'app_version_info';

  constructor() {
    // Load stored version from localStorage
    this.loadStoredVersion();
  }

  /**
   * Initialize version checking on page load
   */
  async initialize(): Promise<void> {
    // Only check once per page session to avoid multiple checks from hot reloads
    if (this.hasCheckedThisSession) {
      return;
    }

    this.hasCheckedThisSession = true;

    // Do initial check (won't notify on first check)
    await this.checkVersion();

    // After initial check, mark as not initial anymore
    this.isInitialCheck = false;

    // Start periodic checking every 2 hours
    this.startPeriodicCheck(2 * 60 * 60 * 1000); // 2 hours
  }

  /**
   * Start periodic version checking
   */
  private startPeriodicCheck(intervalMs: number): void {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.checkVersion();
    }, intervalMs);
  }

  /**
   * Stop periodic checking
   */
  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Subscribe to version changes
   */
  onVersionChange(callback: VersionChangeCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get current version info
   */
  getCurrentVersion(): VersionInfo | null {
    return this.currentVersion;
  }

  /**
   * Load stored version from localStorage
   */
  private loadStoredVersion(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.currentVersion = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stored version:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Save version to localStorage
   */
  private saveStoredVersion(version: VersionInfo): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(version));
    } catch (error) {
      console.error('Error saving version:', error);
    }
  }

  /**
   * Check version from server
   */
  private async checkVersion(): Promise<boolean> {
    // Prevent concurrent checks
    if (this.isChecking) {
      return false;
    }

    this.isChecking = true;

    try {
      // Fetch version.json with cache busting
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch version info:', response.statusText);
        return false;
      }

      const newVersion: VersionInfo = await response.json();

      // If no stored version, this is first load - just store it
      if (!this.currentVersion) {
        this.currentVersion = newVersion;
        this.saveStoredVersion(newVersion);
        return false;
      }

      // Check if version has changed
      const hasChanged = this.hasVersionChanged(this.currentVersion, newVersion);

      if (hasChanged) {

        const oldVersion = this.currentVersion;
        this.currentVersion = newVersion;
        this.saveStoredVersion(newVersion);

        // Only notify callbacks if this is NOT the initial check
        // On initial page load, we're already running the new version
        if (!this.isInitialCheck) {

          // Notify all callbacks
          this.callbacks.forEach(callback => {
            try {
              callback(newVersion, oldVersion);
            } catch (error) {
              console.error('Error in version change callback:', error);
            }
          });

          return true;
        } else {
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error checking version:', error);
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Check if version has changed
   */
  private hasVersionChanged(oldVersion: VersionInfo, newVersion: VersionInfo): boolean {
    // Check version string first
    if (oldVersion.version !== newVersion.version) {
      return true;
    }

    // Also check build time to catch same-version redeployments
    if (oldVersion.buildTime !== newVersion.buildTime) {
      return true;
    }

    // Check git commit if available
    if (oldVersion.gitCommit && newVersion.gitCommit && oldVersion.gitCommit !== newVersion.gitCommit) {
      return true;
    }

    return false;
  }

  /**
   * Clear stored version (useful for testing)
   */
  clearStoredVersion(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentVersion = null;
    this.hasCheckedThisSession = false;
  }
}

// Export singleton instance
export const versionChecker = new VersionChecker();

// Export class and types for custom usage
export { VersionChecker, type VersionInfo, type VersionChangeCallback };