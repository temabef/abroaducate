import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Create admin client for bulk operations
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ImportRequest {
  emails: string[];
  source: string;
  overwriteExisting?: boolean;
  validateEmails?: boolean;
}

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  invalid: number;
  errors: string[];
  details: {
    new_subscribers: number;
    updated_subscribers: number;
    skipped_invalid: number;
  };
}

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

// Check if email domain is disposable/temporary
function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    '10minutemail.com', 'guerrillamail.com', 'tempmail.org', 
    'mailinator.com', 'yopmail.com', 'throwaway.email'
  ];
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

// Clean and normalize email
function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Check admin authorization using the same system as admin layout
async function checkAdminAccess(supabaseClient: any): Promise<boolean> {
  try {
    // Check if user can manage content (newsletter is content management)
    const { data: canManageContent, error } = await supabaseClient.rpc('can_manage_content');
    
    if (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
    
    return !!canManageContent;
  } catch (error) {
    console.error('Error in admin access check:', error);
    return false;
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Authentication check
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Admin access check
    const isAdmin = await checkAdminAccess(locals.supabase);
    if (!isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const requestData: ImportRequest = await request.json();
    const { emails, source, overwriteExisting = false, validateEmails = true } = requestData;

    // Validate request data
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return json({ error: 'Email array is required and cannot be empty' }, { status: 400 });
    }

    if (!source || source.trim().length === 0) {
      return json({ error: 'Source is required' }, { status: 400 });
    }

    if (emails.length > 10000) {
      return json({ error: 'Maximum 10,000 emails per import' }, { status: 400 });
    }

    console.log(`📧 Starting import of ${emails.length} emails from source: ${source}`);

    const result: ImportResult = {
      total: emails.length,
      imported: 0,
      duplicates: 0,
      invalid: 0,
      errors: [],
      details: {
        new_subscribers: 0,
        updated_subscribers: 0,
        skipped_invalid: 0
      }
    };

    // Process emails in batches of 100
    const batchSize = 100;
    const validEmails: Array<{email: string, source: string}> = [];
    
    // Step 1: Validate and clean emails, removing duplicates within the batch
    const emailSet = new Set<string>();
    const duplicatesInBatch = new Set<string>();
    
    for (const emailRaw of emails) {
      if (typeof emailRaw !== 'string') {
        result.invalid++;
        result.details.skipped_invalid++;
        continue;
      }

      const email = cleanEmail(emailRaw);
      
      // Check for duplicates within this batch
      if (emailSet.has(email)) {
        duplicatesInBatch.add(email);
        result.duplicates++;
        continue;
      }
      
      // Validate email format
      if (validateEmails && !isValidEmail(email)) {
        result.invalid++;
        result.details.skipped_invalid++;
        result.errors.push(`Invalid email format: ${email}`);
        continue;
      }

      // Check for disposable emails
      if (validateEmails && isDisposableEmail(email)) {
        result.invalid++;
        result.details.skipped_invalid++;
        result.errors.push(`Disposable email blocked: ${email}`);
        continue;
      }

      emailSet.add(email);
      validEmails.push({ email, source: source.trim() });
    }

    if (duplicatesInBatch.size > 0) {
      console.log(`🔄 Removed ${duplicatesInBatch.size} duplicate emails within the batch`);
    }

    console.log(`✅ Validated ${validEmails.length} emails out of ${emails.length}`);

    // Step 2: Check for existing subscribers
    const existingEmails = new Set<string>();
    if (validEmails.length > 0) {
      const emailAddresses = validEmails.map(e => e.email);
      
      // Check in batches
      for (let i = 0; i < emailAddresses.length; i += batchSize) {
        const batch = emailAddresses.slice(i, i + batchSize);
        
        const { data: existing } = await supabase
          .from('newsletter_subscribers')
          .select('email')
          .in('email', batch);
        
        existing?.forEach(sub => existingEmails.add(sub.email));
      }
    }

    console.log(`📊 Found ${existingEmails.size} existing subscribers`);

    // Step 3: Prepare data for insertion/update
    const newSubscribers: Array<{email: string, source: string}> = [];
    const updateSubscribers: Array<{email: string, source: string}> = [];

    for (const emailData of validEmails) {
      if (existingEmails.has(emailData.email)) {
        if (overwriteExisting) {
          updateSubscribers.push(emailData);
        } else {
          result.duplicates++;
        }
      } else {
        newSubscribers.push(emailData);
      }
    }

    // Step 4: Insert new subscribers in batches
    if (newSubscribers.length > 0) {
      console.log(`📥 Inserting ${newSubscribers.length} new subscribers`);
      
      for (let i = 0; i < newSubscribers.length; i += batchSize) {
        const batch = newSubscribers.slice(i, i + batchSize);
        
        // Use upsert to handle any remaining duplicates gracefully
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .upsert(
            batch.map(emailData => ({
              email: emailData.email,
              source: emailData.source,
              scholarship_digest: true,
              weekly_updates: true,
              status: 'active',
              subscribed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })),
            { 
              onConflict: 'email',
              ignoreDuplicates: false // Update existing records
            }
          )
          .select('id');

        if (error) {
          console.error(`❌ Error upserting batch ${i}-${i + batch.length}:`, error);
          result.errors.push(`Batch upsert error: ${error.message}`);
          // Continue processing other batches even if one fails
        } else {
          const batchImported = data?.length || 0;
          result.details.new_subscribers += batchImported;
          result.imported += batchImported;
          console.log(`✅ Successfully processed batch ${i}-${i + batch.length}: ${batchImported} records`);
        }
      }
    }

    // Step 5: Update existing subscribers if requested
    if (updateSubscribers.length > 0 && overwriteExisting) {
      console.log(`🔄 Updating ${updateSubscribers.length} existing subscribers`);
      
      for (const emailData of updateSubscribers) {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({
            source: emailData.source,
            updated_at: new Date().toISOString(),
            status: 'active' // Reactivate if previously unsubscribed
          })
          .eq('email', emailData.email);

        if (error) {
          result.errors.push(`Update error for ${emailData.email}: ${error.message}`);
        } else {
          result.details.updated_subscribers++;
          result.imported++;
        }
      }
    }

    // Step 6: Log the import activity
    try {
      await supabase
        .from('newsletter_campaigns')
        .insert({
          campaign_name: `Email Import - ${source}`,
          subject_line: `Bulk import from ${source}`,
          campaign_type: 'onboarding',
          total_recipients: result.imported,
          campaign_status: 'sent',
          created_by: session.user.id,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging import campaign:', logError);
    }

    console.log(`✅ Import completed:`, result);

    return json({
      success: true,
      message: `Successfully imported ${result.imported} subscribers from ${source}`,
      result
    });

  } catch (error) {
    console.error('❌ Newsletter import error:', error);
    return json(
      { 
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// GET: Check import status and get statistics
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const { data: { session } } = await locals.supabase.auth.getSession();
    
    if (!session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(locals.supabase);
    if (!isAdmin) {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get newsletter statistics
    const { data: stats } = await supabase.rpc('get_newsletter_stats');
    
    // Get recent import campaigns
    const { data: recentImports } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .eq('campaign_type', 'onboarding')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get subscriber breakdown by source
    const { data: sourceBreakdown } = await supabase
      .from('active_newsletter_subscribers')
      .select('*');

    return json({
      success: true,
      statistics: stats,
      recent_imports: recentImports,
      source_breakdown: sourceBreakdown,
      import_ready: true
    });

  } catch (error) {
    console.error('Error fetching import status:', error);
    return json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}; 