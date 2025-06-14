import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { checkUsageLimit, incrementUsage } from '$lib/usage-limits';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits';

// POST endpoint - Submit answer and get AI feedback
export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { question, answer, questionId } = await request.json();

        if (!question || !answer?.trim()) {
            return json({ error: 'Question and answer are required' }, { status: 400 });
        }

        if (!questionId) {
            return json({ error: 'Question ID is required' }, { status: 400 });
        }

        // Check usage limits - using ai_improvements_used for visa practice
        const usageCheck = await checkUsageLimit(supabase, session.user.id, 'ai_improvements_used');
        
        if (!usageCheck.allowed) {
            return json({
                error: 'Usage limit exceeded',
                message: usageCheck.message,
                planType: usageCheck.planType,
                currentUsage: usageCheck.currentUsage,
                limit: usageCheck.limit,
                upgradeRequired: true
            }, { status: 403 });
        }

        // Generate AI feedback using existing OpenAI setup
        const feedback = await generateVisaInterviewFeedback(question, answer);

        // Save practice session to database
        const { data: sessionData, error: dbError } = await supabase
            .from('visa_practice_sessions')
            .insert({
                user_id: session.user.id,
                question_id: questionId,
                user_answer: answer,
                ai_feedback: feedback,
                score: feedback.score
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error saving practice session:', dbError);
            return json({ error: 'Failed to save practice session' }, { status: 500 });
        }

        // Increment usage counter
        await incrementUsage(supabase, session.user.id, 'ai_improvements_used');

        return json({
            success: true,
            feedback: feedback,
            sessionId: sessionData.id
        });

    } catch (error: any) {
        console.error('Visa interview feedback error:', error);
        return json({ error: 'Failed to generate feedback' }, { status: 500 });
    }
};

// GET endpoint - Fetch random questions
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
    try {
        const visaType = url.searchParams.get('visa_type') || 'F1';
        const category = url.searchParams.get('category');
        const difficulty = url.searchParams.get('difficulty');
        
        let query = supabase
            .from('visa_interview_questions')
            .select('*')
            .eq('visa_type', visaType);
            
        if (category) {
            query = query.eq('category', category);
        }
        
        if (difficulty) {
            query = query.eq('difficulty', difficulty);
        }
        
        const { data: questions, error } = await query.limit(50);
        
        if (error) {
            console.error('Database error fetching questions:', error);
            return json({ error: 'Failed to fetch questions' }, { status: 500 });
        }
        
        return json({ 
            questions: questions || [],
            total: questions?.length || 0
        });
        
    } catch (error) {
        console.error('Error fetching questions:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

// AI feedback generation function
async function generateVisaInterviewFeedback(question: string, answer: string) {
    const prompt = `You are a visa interview expert with 15+ years of experience. Evaluate this F-1 student visa interview answer and provide helpful feedback.

Question: ${question}
Answer: ${answer}

Provide feedback in this exact JSON format:
{
    "score": 8,
    "strengths": ["Specific strength 1", "Specific strength 2"],
    "improvements": ["Specific improvement 1", "Specific improvement 2"],
    "tips": ["Practical tip 1", "Practical tip 2"],
    "confidence": "high",
    "overall": "Brief overall assessment in 1-2 sentences"
}

Scoring guidelines:
- 9-10: Excellent answer, visa officer would be very impressed
- 7-8: Good answer, shows preparation and sincerity
- 5-6: Average answer, needs some improvement
- 3-4: Weak answer, significant issues to address
- 1-2: Poor answer, major red flags

Keep feedback encouraging but honest. Focus on practical improvements.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo', // Use cheaper model for cost control
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 350 // Keep reasonable for cost control
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API request failed: ${response.status}`);
        }

        const data = await response.json();
        const feedbackText = data.choices[0].message.content;
        
        try {
            return JSON.parse(feedbackText);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', feedbackText);
            throw new Error('Invalid AI response format');
        }
        
    } catch (error) {
        console.error('AI feedback generation error:', error);
        // Fallback feedback when AI fails
        return {
            score: 6,
            strengths: ["Answer addresses the question", "Shows genuine interest"],
            improvements: ["Could be more specific with examples", "Add more supporting details"],
            tips: ["Practice speaking clearly and confidently", "Prepare concrete examples beforehand"],
            confidence: "medium",
            overall: "Good foundation, but could be enhanced with more specific details and examples."
        };
    }
} 