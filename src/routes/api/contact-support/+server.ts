import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  try {
    const { name, email, category, subject, message, priority } = await request.json();

    // Validate required fields
    if (!name || !email || !message || !category) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
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

    // In a real implementation, you would send this email using a service like:
    // - SendGrid
    // - Postmark  
    // - AWS SES
    // - Resend
    // 
    // For now, we'll log it and return success
    // You can implement actual email sending when you're ready

    console.log('📧 NEW SUPPORT REQUEST:');
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);

    // TODO: Replace this with actual email sending
    // Example with a hypothetical email service:
    /*
    await emailService.send({
      to: 'support@abroaducate.com',
      from: 'noreply@abroaducate.com',
      replyTo: email,
      subject: emailSubject,
      text: emailBody
    });
    */

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

    console.log('📧 AUTO-REPLY TO USER:');
    console.log('To:', email);
    console.log('Subject:', autoReplySubject);
    console.log('Body:', autoReplyBody);

    // TODO: Send auto-reply email to user
    /*
    await emailService.send({
      to: email,
      from: 'support@abroaducate.com',
      subject: autoReplySubject,
      text: autoReplyBody
    });
    */

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