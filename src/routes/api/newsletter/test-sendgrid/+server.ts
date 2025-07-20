import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import sgMail from '@sendgrid/mail';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sendgridApiKey = process.env.SENDGRID_API_KEY;
const fromName = process.env.FROM_NAME || 'Abroaducate';
const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'hello@abroaducate.com';
const from = `${fromName} <${fromEmail}>`;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check SendGrid configuration
    const configStatus = {
      hasApiKey: !!sendgridApiKey,
      apiKeyLength: sendgridApiKey ? sendgridApiKey.length : 0,
      fromEmail,
      fromName,
      from,
      environment: process.env.NODE_ENV || 'development'
    };

    if (!sendgridApiKey) {
      return json({
        success: false,
        error: 'SendGrid API key not configured',
        configStatus,
        message: 'Please set SENDGRID_API_KEY environment variable'
      });
    }

    // Test SendGrid connection
    try {
      // Try to send a test email to yourself
      const testEmail = session.user.email;
      await sgMail.send({
        to: testEmail,
        from: from,
        subject: 'SendGrid Test - Abroaducate Newsletter System',
        html: `
          <h2>SendGrid Configuration Test</h2>
          <p>This is a test email to verify your SendGrid configuration is working correctly.</p>
          <p><strong>Configuration Status:</strong></p>
          <ul>
            <li>API Key: ${configStatus.hasApiKey ? '✅ Configured' : '❌ Missing'}</li>
            <li>From Email: ${configStatus.fromEmail}</li>
            <li>From Name: ${configStatus.fromName}</li>
            <li>Environment: ${configStatus.environment}</li>
          </ul>
          <p>If you received this email, your newsletter automation should work!</p>
        `,
        text: `
          SendGrid Configuration Test
          
          This is a test email to verify your SendGrid configuration is working correctly.
          
          Configuration Status:
          - API Key: ${configStatus.hasApiKey ? 'Configured' : 'Missing'}
          - From Email: ${configStatus.fromEmail}
          - From Name: ${configStatus.fromName}
          - Environment: ${configStatus.environment}
          
          If you received this email, your newsletter automation should work!
        `
      });

      return json({
        success: true,
        message: 'SendGrid configuration is working! Test email sent.',
        configStatus,
        testEmail
      });

    } catch (sendError) {
      console.error('SendGrid test failed:', sendError);
      return json({
        success: false,
        error: 'SendGrid test failed',
        details: sendError instanceof Error ? sendError.message : 'Unknown error',
        configStatus
      });
    }

  } catch (e) {
    console.error('Test endpoint error:', e);
    return json({ 
      error: e.message || 'Internal server error',
      exception: true
    }, { status: 500 });
  }
}; 