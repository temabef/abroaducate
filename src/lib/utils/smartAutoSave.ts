/**
 * Smart Auto-Save System with Rate Limiting
 * Manages document auto-saving with intelligent rate limiting based on user plans
 */

interface AutoSaveConfig {
  planType: string;
  isEditing: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

interface AutoSaveLimits {
  maxSavesPerHour: number;
  minSaveInterval: number; // seconds
  batchSaveDelay: number; // seconds
}

const PLAN_LIMITS: Record<string, AutoSaveLimits> = {
  free: {
    maxSavesPerHour: 10,    // Conservative for database usage
    minSaveInterval: 60,     // 1 minute minimum between saves
    batchSaveDelay: 5        // 5 seconds batching
  },
  professional: {
    maxSavesPerHour: 30,    // More generous
    minSaveInterval: 20,     // 20 seconds minimum
    batchSaveDelay: 3        // 3 seconds batching
  },
  elite: {
    maxSavesPerHour: 100,   // Very generous
    minSaveInterval: 5,      // 5 seconds minimum
    batchSaveDelay: 2        // 2 seconds batching
  }
};

class SmartAutoSave {
  private saveQueue: Set<string> = new Set();
  private saveHistory: Date[] = [];
  private pendingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Check if auto-save is allowed based on rate limits
   */
  canAutoSave(config: AutoSaveConfig): boolean {
    const limits = PLAN_LIMITS[config.planType] || PLAN_LIMITS.free;
    
    // Check hourly limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSaves = this.saveHistory.filter(date => date > oneHourAgo);
    
    if (recentSaves.length >= limits.maxSavesPerHour) {
      console.log(`Auto-save blocked: hourly limit reached (${recentSaves.length}/${limits.maxSavesPerHour})`);
      return false;
    }
    
    // Check minimum interval
    if (config.lastSaved) {
      const timeSinceLastSave = (Date.now() - config.lastSaved.getTime()) / 1000;
      if (timeSinceLastSave < limits.minSaveInterval) {
        console.log(`Auto-save blocked: minimum interval not met (${timeSinceLastSave}s < ${limits.minSaveInterval}s)`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Schedule an intelligent auto-save with batching
   */
  scheduleAutoSave(
    documentId: string, 
    saveFunction: () => Promise<void>, 
    config: AutoSaveConfig
  ): void {
    const limits = PLAN_LIMITS[config.planType] || PLAN_LIMITS.free;
    
    // Clear existing timeout for this document
    const existingTimeout = this.pendingTimeouts.get(documentId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Add to save queue
    this.saveQueue.add(documentId);
    
    // Schedule batched save
    const timeout = setTimeout(async () => {
      if (this.saveQueue.has(documentId) && this.canAutoSave(config)) {
        try {
          await saveFunction();
          this.recordSave();
          this.saveQueue.delete(documentId);
          console.log(`Auto-saved document: ${documentId} (plan: ${config.planType})`);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
      this.pendingTimeouts.delete(documentId);
    }, limits.batchSaveDelay * 1000);
    
    this.pendingTimeouts.set(documentId, timeout);
  }
  
  /**
   * Force save (bypasses some limits but still respects hourly caps)
   */
  async forceSave(
    documentId: string,
    saveFunction: () => Promise<void>,
    config: AutoSaveConfig
  ): Promise<boolean> {
    const limits = PLAN_LIMITS[config.planType] || PLAN_LIMITS.free;
    
    // Check absolute hourly limit (can't bypass this)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSaves = this.saveHistory.filter(date => date > oneHourAgo);
    
    if (recentSaves.length >= limits.maxSavesPerHour * 1.5) { // 50% grace allowance
      console.warn('Force save blocked: absolute limit exceeded');
      return false;
    }
    
    try {
      await saveFunction();
      this.recordSave();
      this.saveQueue.delete(documentId);
      console.log(`Force-saved document: ${documentId}`);
      return true;
    } catch (error) {
      console.error('Force save failed:', error);
      return false;
    }
  }
  
  /**
   * Get save statistics for user feedback
   */
  getSaveStats(planType: string): {
    remainingHourlySaves: number;
    nextSaveAvailable: Date | null;
    isNearLimit: boolean;
  } {
    const limits = PLAN_LIMITS[planType] || PLAN_LIMITS.free;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSaves = this.saveHistory.filter(date => date > oneHourAgo);
    
    const remainingHourlySaves = Math.max(0, limits.maxSavesPerHour - recentSaves.length);
    const isNearLimit = remainingHourlySaves <= 2;
    
    // Calculate next available save time
    let nextSaveAvailable: Date | null = null;
    if (recentSaves.length > 0) {
      const oldestRecentSave = recentSaves[0];
      nextSaveAvailable = new Date(oldestRecentSave.getTime() + 60 * 60 * 1000);
    }
    
    return {
      remainingHourlySaves,
      nextSaveAvailable,
      isNearLimit
    };
  }
  
  /**
   * Clean up pending saves for a document
   */
  cancelPendingSaves(documentId: string): void {
    const timeout = this.pendingTimeouts.get(documentId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingTimeouts.delete(documentId);
    }
    this.saveQueue.delete(documentId);
  }
  
  /**
   * Clean up old save history
   */
  private cleanupHistory(): void {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.saveHistory = this.saveHistory.filter(date => date > twentyFourHoursAgo);
  }
  
  /**
   * Record a successful save
   */
  private recordSave(): void {
    this.saveHistory.push(new Date());
    this.cleanupHistory();
  }
}

// Export singleton instance
export const smartAutoSave = new SmartAutoSave();

// Export utilities for frontend
export function getAutoSaveMessage(planType: string, isNearLimit: boolean): string {
  if (isNearLimit) {
    return planType === 'free' 
      ? '⚠️ Auto-save limit nearly reached. Consider upgrading for more saves.'
      : '⚠️ Auto-save limit nearly reached this hour.';
  }
  
  return planType === 'free'
    ? '💾 Auto-save enabled (limited). Upgrade for unlimited saves.'
    : '💾 Auto-save enabled.';
}

export { PLAN_LIMITS }; 