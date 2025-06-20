/**
 * Version History Management with Plan-Based Limits
 * Manages document versioning with different limits for each subscription plan
 */

export interface VersionHistoryConfig {
  planType: string;
  documentType: string;
  userId: string;
}

export interface VersionLimits {
  maxVersions: number;
  allowedDocumentTypes: string[];
  retentionDays: number;
}

// Plan-based version history limits (matches your pricing page)
const VERSION_LIMITS: Record<string, VersionLimits> = {
  free: {
    maxVersions: 3,
    allowedDocumentTypes: ['cover_letter'], // Only cover letters as per pricing page
    retentionDays: 30
  },
  professional: {
    maxVersions: 50,
    allowedDocumentTypes: ['cover_letter', 'personal_statement', 'sop', 'cv'], // All document types
    retentionDays: 90
  },
  elite: {
    maxVersions: 100,
    allowedDocumentTypes: ['cover_letter', 'personal_statement', 'sop', 'cv'], // All document types
    retentionDays: 365
  }
};

/**
 * Check if version history is allowed for this plan and document type
 */
export function isVersionHistoryAllowed(config: VersionHistoryConfig): {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
} {
  const limits = VERSION_LIMITS[config.planType] || VERSION_LIMITS.free;
  
  if (!limits.allowedDocumentTypes.includes(config.documentType)) {
    return {
      allowed: false,
      reason: `Version history for ${config.documentType} is not available on the ${config.planType} plan. Upgrade to Professional for complete version history.`,
      upgradeRequired: true
    };
  }
  
  return { allowed: true };
}

/**
 * Get version limits for a specific plan
 */
export function getVersionLimits(planType: string): VersionLimits {
  return VERSION_LIMITS[planType] || VERSION_LIMITS.free;
}

/**
 * Smart version creation with plan-based limits
 */
export async function createVersionSnapshot(
  supabase: any,
  config: VersionHistoryConfig,
  documentId: string | number,
  content: string,
  isSignificantChange = false,
  existingVersions: any[] = []
): Promise<{
  success: boolean;
  versionCreated: boolean;
  message?: string;
  upgradeRequired?: boolean;
}> {
  try {
    // Check if version history is allowed
    const allowanceCheck = isVersionHistoryAllowed(config);
    if (!allowanceCheck.allowed) {
      return {
        success: false,
        versionCreated: false,
        message: allowanceCheck.reason,
        upgradeRequired: allowanceCheck.upgradeRequired
      };
    }

    const limits = getVersionLimits(config.planType);

    // Only create versions for significant changes to save database space
    if (!isSignificantChange && existingVersions.length > 0) {
      // Check if content has changed significantly (more than 50 characters different)
      const lastVersion = existingVersions[0];
      const contentDiff = Math.abs(content.length - lastVersion.content.length);
      const wordDiff = Math.abs(content.split(' ').length - lastVersion.content.split(' ').length);
      
      // Skip version if changes are very minor (less than 10 chars OR less than 2 words different)
      if (contentDiff < 10 || wordDiff < 2) {
        console.log('Skipping version creation - changes too minor', { contentDiff, wordDiff });
        return {
          success: true,
          versionCreated: false,
          message: 'Changes too minor for new version'
        };
      }
    }

    // Check if we're at the version limit
    if (existingVersions.length >= limits.maxVersions) {
      // Delete oldest versions to make room (keep newest versions up to limit)
      const versionsToDelete = existingVersions.slice(limits.maxVersions - 1);
      for (const oldVersion of versionsToDelete) {
        await supabase
          .from('document_versions')
          .delete()
          .eq('id', oldVersion.id);
      }
      
      console.log(`Cleaned up ${versionsToDelete.length} old versions for ${config.planType} plan`);
    }

    // Get next version number
    const nextVersionNumber = existingVersions.length > 0 
      ? Math.max(...existingVersions.map(v => v.version_number)) + 1 
      : 1;

    // Convert documentId to string to handle both integer and UUID IDs
    const documentIdStr = documentId.toString();

    // Create new version
    const { error } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentIdStr,
        document_type: config.documentType,
        version_number: nextVersionNumber,
        content: content,
        changes_summary: isSignificantChange ? 'Manual save' : 'Auto-saved version',
        word_count: content.split(/\s+/).filter(w => w.length > 0).length,
        created_by: config.userId,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating version:', error);
      return {
        success: false,
        versionCreated: false,
        message: 'Failed to create version'
      };
    }

    return {
      success: true,
      versionCreated: true,
      message: `Version ${nextVersionNumber} created successfully`
    };

  } catch (error) {
    console.error('Error in createVersionSnapshot:', error);
    return {
      success: false,
      versionCreated: false,
      message: 'Failed to create version snapshot'
    };
  }
}

/**
 * Clean up old versions based on retention policy
 */
export async function cleanupOldVersions(
  supabase: any,
  userId: string,
  planType: string
): Promise<number> {
  try {
    const limits = getVersionLimits(planType);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - limits.retentionDays);

    const { data: deletedVersions, error } = await supabase
      .from('document_versions')
      .delete()
      .eq('created_by', userId)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up old versions:', error);
      return 0;
    }

    const deletedCount = deletedVersions?.length || 0;
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired versions for user ${userId}`);
    }

    return deletedCount;
  } catch (error) {
    console.error('Error in cleanupOldVersions:', error);
    return 0;
  }
}

/**
 * Get version history for a document with plan-based limits
 */
export async function getVersionHistory(
  supabase: any,
  config: VersionHistoryConfig,
  documentId: string | number
): Promise<{
  versions: any[];
  hasAccess: boolean;
  upgradeMessage?: string;
  planType: string;
}> {
  try {
    // Check if version history is allowed
    const allowanceCheck = isVersionHistoryAllowed(config);
    
    if (!allowanceCheck.allowed) {
      return {
        versions: [],
        hasAccess: false,
        upgradeMessage: allowanceCheck.reason,
        planType: config.planType
      };
    }

    // Convert documentId to string to handle both integer and UUID IDs
    const documentIdStr = documentId.toString();

    // Get versions for this document
    const { data: versions, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentIdStr)
      .eq('document_type', config.documentType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading version history:', error);
      return {
        versions: [],
        hasAccess: true,
        planType: config.planType
      };
    }

    const limits = getVersionLimits(config.planType);

    // Apply plan limits to versions
    const limitedVersions = versions ? versions.slice(0, limits.maxVersions) : [];

    return {
      versions: limitedVersions,
      hasAccess: true,
      planType: config.planType
    };

  } catch (error) {
    console.error('Error in getVersionHistory:', error);
    return {
      versions: [],
      hasAccess: false,
      upgradeMessage: 'Error loading version history',
      planType: config.planType
    };
  }
}

/**
 * Get version usage statistics for display
 */
export function getVersionUsageStats(
  planType: string,
  currentVersionCount: number
): {
  usage: string;
  percentage: number;
  isNearLimit: boolean;
  upgradeRecommended: boolean;
} {
  const limits = getVersionLimits(planType);
  const percentage = (currentVersionCount / limits.maxVersions) * 100;
  
  return {
    usage: `${currentVersionCount} / ${limits.maxVersions}`,
    percentage: Math.min(100, percentage),
    isNearLimit: percentage >= 80,
    upgradeRecommended: planType === 'free' && percentage >= 70
  };
}

/**
 * Generate plan comparison message for version history
 */
export function getVersionHistoryUpgradeMessage(currentPlan: string, documentType: string): string {
  if (currentPlan === 'free') {
    if (documentType !== 'cover_letter') {
      return `📚 Version history for ${documentType}s is available with Professional plan. Upgrade to track changes across all your documents!`;
    } else {
      return `📚 Upgrade to Professional for 10 versions instead of 3, plus version history for all document types!`;
    }
  } else if (currentPlan === 'professional') {
    return `🚀 Elite plan offers 20 versions with 1-year retention vs your current 10 versions with 90-day retention.`;
  }
  
  return '';
} 