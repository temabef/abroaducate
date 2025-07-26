import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';

const fromName = process.env.FROM_NAME || 'Abroaducate';
const fromEmail = FROM_EMAIL || 'hello@abroaducate.com';
const from = `${fromName} <${fromEmail}>`;

// Log environment variable status (mask API key)
console.log('[Contact API] SENDGRID_API_KEY:', SENDGRID_API_KEY ? SENDGRID_API_KEY.slice(0, 6) + '...' : 'NOT SET');
console.log('[Contact API] fromEmail:', fromEmail);

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Simple in-memory rate limiter (per IP, resets on server restart)
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // 5 requests per window
const rateLimitMap = new Map();

function getClientIp(request: Request) {
  // Try to get IP from headers (works for most deployments)
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    // fallback: not reliable in serverless, but fine for dev
    'unknown'
  );
}

// Define schema for validation
const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  category: z.string().min(1).max(50),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium')
});

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  // Rate limiting logic
  const ip = getClientIp(request);
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry) {
    entry = { count: 1, first: now };
    rateLimitMap.set(ip, entry);
  } else {
    if (now - entry.first < RATE_LIMIT_WINDOW_MS) {
      if (entry.count >= RATE_LIMIT_MAX) {
        return json({ error: 'Too many requests. Please try again in an hour.' }, { status: 429 });
      }
      entry.count++;
    } else {
      // Reset window
      entry.count = 1;
      entry.first = now;
    }
    rateLimitMap.set(ip, entry);
  }

  try {
    const requestData = await request.json();

    // Validate and sanitize input
    const parsed = contactSchema.safeParse(requestData);
    if (!parsed.success) {
      return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    // Additional validation
    if (!data.name || !data.email || !data.message || !data.category) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store the support request in database (optional - for tracking)
    const supportRequest = {
      id: crypto.randomUUID(),
      name,
      email,
      category,
      subject: subject || `${category} inquiry`,
      message,
      priority: priority || 'normal',
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try to store in database (create table if needed)
    try {
      await supabase
        .from('support_requests')
        .insert(supportRequest);
    } catch (dbError) {
      // Database storage is optional - don't fail if table doesn't exist
      console.log('Could not store support request in database:', dbError);
    }

    // Format email content
    const categoryEmojis: Record<string, string> = {
      technical: '🔧',
      billing: '💳',
      account: '👤',
      documents: '📄',
      universities: '🎓',
      general: '💬'
    };

    const priorityColors: Record<string, string> = {
      low: '🟢',
      normal: '🟡',
      high: '🟠',
      critical: '🔴'
    };

    const emailSubject = `${priorityColors[priority]} Support Request: ${categoryEmojis[category]} ${category.toUpperCase()} - ${subject || 'No subject'}`;
    
    const emailBody = `
New Support Request from Abroaducate

📋 DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name}
Email: ${email}
Category: ${categoryEmojis[category]} ${category.toUpperCase()}
Priority: ${priorityColors[priority]} ${priority.toUpperCase()}
Subject: ${subject || 'No subject provided'}

💬 MESSAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message}

📊 METADATA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request ID: ${supportRequest.id}
Timestamp: ${new Date().toLocaleString()}
User Agent: ${request.headers.get('user-agent') || 'Unknown'}

Reply directly to this email to respond to the user.
    `.trim();

    // Send support request email to support@abroaducate.com
    const supportEmailMessage = {
      to: 'support@abroaducate.com',
      from: { email: fromEmail, name: fromName },
      replyTo: email,
      subject: `[Support ID: ${supportRequest.id}] ${emailSubject}`,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>')
    };
    console.log('[Contact API] Sending support email with message:', JSON.stringify({ ...supportEmailMessage, text: undefined, html: undefined }));
    try {
      const sendResult = await sgMail.send(supportEmailMessage);
      console.log('[Contact API] SendGrid support email send result:', sendResult);
    } catch (sendError) {
      console.error('SendGrid support email failed:', sendError);
      return json({ error: 'Failed to send support email. Please try again later.' }, { status: 500 });
    }

    // Send auto-reply to user
    const autoReplySubject = `We received your support request - ${category} inquiry`;
    const autoReplyBody = `
Hi ${name},

Thank you for contacting Abroaducate support! We've received your ${category} inquiry and will get back to you within 24-48 hours.

📋 Your Request Details:
Category: ${category}
Priority: ${priority}
Request ID: ${supportRequest.id}

If your issue is urgent and blocking your application deadlines, please email us directly at urgent@abroaducate.com.

In the meantime, you might find helpful information in our FAQ section at https://abroaducate.com/contact

Best regards,
The Abroaducate Support Team
support@abroaducate.com
    `.trim();

    console.log(`[Contact API] Attempting to send auto-reply to user: ${email}`);
    try {
      await sgMail.send({
        to: email,
        from: { email: fromEmail, name: fromName },
        subject: autoReplySubject,
        text: autoReplyBody,
        html: autoReplyBody.replace(/\n/g, '<br>')
      });
    } catch (sendError) {
      console.error('SendGrid auto-reply failed:', sendError);
      return json({ error: 'Failed to send auto-reply email. Please check your email address or try again later.' }, { status: 500 });
    }

    return json({ 
      success: true, 
      message: 'Support request submitted successfully',
      requestId: supportRequest.id 
    });

  } catch (error) {
    console.error('Error processing support request:', error);
    return json({ 
      error: 'Failed to process support request. Please try again or email us directly at support@abroaducate.com' 
    }, { status: 500 });
  }
}; 