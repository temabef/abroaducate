import type { RequestHandler } from './$types';
import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY, FROM_EMAIL } from '$env/static/private';

sgMail.setApiKey(SENDGRID_API_KEY);

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { subject, html, test_email } = await request.json();
        
        if (!subject || !html || !test_email) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Missing required fields: subject, html, test_email' 
            }), { status: 400 });
        }

        const fromEmail = FROM_EMAIL;
        
        await sgMail.send({
            to: test_email,
            from: fromEmail,
            subject: subject,
            html: html
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Test email sent successfully' 
        }), { status: 200 });

    } catch (error) {
        console.error('Error sending test email:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to send test email' 
        }), { status: 500 });
    }
}; 