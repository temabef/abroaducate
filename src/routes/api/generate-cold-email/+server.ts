import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits';

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Define schema for validation
    const coldEmailSchema = z.object({
        professorName: z.string().min(1).max(100),
        professorTitle: z.string().min(1).max(50),
        university: z.string().min(1).max(200),
        department: z.string().min(1).max(200),
        professorResearch: z.string().min(10).max(2000),
        studentResearch: z.string().min(10).max(2000),
        studentName: z.string().min(1).max(100),
        studentProgram: z.string().min(1).max(200),
        emailTone: z.enum(['professional', 'friendly', 'formal']).default('professional'),
        additionalInfo: z.string().max(1000).optional().default('')
    });

    try {
        const requestData = await request.json();

        // Validate and sanitize input
        const parsed = coldEmailSchema.safeParse(requestData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;

        // Validate required fields
        if (!data.professorName || !data.professorResearch || !data.studentResearch || !data.studentName) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check cold email usage limits using new comprehensive system
        const usageCheck = await checkComprehensiveUsageLimit(session.user.id, 'cold_email_generation');
        if (!usageCheck.allowed) {
            return json({
                error: 'Cold email limit exceeded',
                message: usageCheck.message,
                planType: usageCheck.planType,
                currentUsage: usageCheck.currentUsage,
                limit: usageCheck.limit,
                upgradeRequired: true
            }, { status: 403 });
        }

        // Analyze research overlap using simple keyword matching
        let researchOverlap = [];
        const professorKeywords = data.professorResearch.toLowerCase().split(/\s+/).filter(word => word.length > 3);
        const studentKeywords = data.studentResearch.toLowerCase().split(/\s+/).filter(word => word.length > 3);
        
        for (const keyword of professorKeywords) {
            if (studentKeywords.includes(keyword)) {
                researchOverlap.push(keyword);
            }
        }

        // Generate the cold email
        const toneInstructions = {
          formal: 'Use a formal, professional academic tone. Be respectful and courteous.',
          'semi-formal': 'Use a professional but approachable tone. Be warm yet respectful.',
          enthusiastic: 'Use an enthusiastic and passionate tone while maintaining professionalism.'
        };

        const emailPrompt = `
Generate a professional cold email from a student to a professor for potential research collaboration or graduate studies.

Details:
- Professor: ${data.professorTitle} ${data.professorName}${data.university ? ` at ${data.university}` : ''}${data.department ? ` (${data.department} Department)` : ''}
- Professor's Research: ${data.professorResearch}
- Student Name: ${data.studentName}
- Student Program/Background: ${data.studentProgram || 'Graduate student'}
- Student's Research Interests: ${data.studentResearch}
- Research Overlaps: ${researchOverlap.length > 0 ? researchOverlap.join(', ') : 'None identified'}
- Additional Information: ${data.additionalInfo || 'None'}
- Tone: ${toneInstructions[data.emailTone] || toneInstructions.formal}

Email Requirements:
1. Generate a compelling subject line
2. Professional greeting using the professor's title and name
3. Brief introduction of the student
4. Highlight specific research interest overlaps or alignment
5. Mention specific aspects of the professor's work that interest the student
6. Express interest in potential collaboration, research opportunities, or graduate studies
7. Keep the email concise (3-4 paragraphs maximum)
8. Professional closing
9. No attachments mentioned in first contact

Return the response in this exact JSON format:
{
  "subject": "Email subject line here",
  "body": "Complete email body text here with proper formatting and line breaks"
}
`;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: usageCheck.planType === 'elite' ? 'gpt-4o' : usageCheck.planType === 'professional' ? 'gpt-4o-mini' : 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at writing professional academic cold emails. Always return valid JSON with subject and body fields. Use proper email formatting with line breaks.'
              },
              {
                role: 'user',
                content: emailPrompt
              }
            ],
            max_tokens: 800,
            temperature: 0.7,
          })
        });

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json();
          console.error('OpenAI API error:', errorData);
          return json({ 
            error: errorData.error?.message || 'Failed to generate email from AI.' 
          }, { status: openaiResponse.status });
        }

        const openaiData = await openaiResponse.json();
        let emailContent = openaiData.choices[0]?.message?.content?.trim();
        
        // Strip Markdown code block if present
        if (emailContent && emailContent.startsWith('```')) {
          emailContent = emailContent.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
        }
        
        let emailResult;
        try {
          emailResult = JSON.parse(emailContent || '{}');
        } catch (error) {
          console.error('Error parsing email response:', error);
          // If JSON parsing fails, create a fallback response
          emailResult = {
            subject: `Research Collaboration Inquiry - ${data.studentName}`,
            body: emailContent || 'Email generation failed. Please try again.'
          };
        }

        // Validate email result
        if (!emailResult.subject || !emailResult.body) {
          return json({ 
            error: 'Invalid email format from AI. Please try again.' 
          }, { status: 500 });
        }

        // Increment usage counter using new comprehensive system
        await incrementComprehensiveUsage(session.user.id, 'cold_email_generation');

        return json({
          subject: emailResult.subject,
          body: emailResult.body,
          researchOverlap: researchOverlap,
          usage_info: {
            current: usageCheck.currentUsage + 1,
            limit: usageCheck.limit,
            remaining: usageCheck.limit ? usageCheck.limit - (usageCheck.currentUsage + 1) : null
          }
        });

    } catch (error) {
        console.error('Error generating cold email:', error);
        return json(
          { error: 'Failed to generate cold email. Please try again.' },
          { status: 500 }
        );
    }
} 