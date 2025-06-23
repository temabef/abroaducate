import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { getAIModelForUser } from '$lib/ai-models';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { sopText, reviewMode, universityName, programName } = await request.json();
        
        if (!sopText?.trim()) {
            return json({ error: 'SOP text is required' }, { status: 400 });
        }

        // Get appropriate AI model based on user's subscription tier
        const aiModel = await getAIModelForUser(supabase, session.user.id);
        
        // Enhanced analysis with OpenAI
        const analysis = await analyzeSOPWithAI(sopText, reviewMode, universityName, programName, aiModel);
        
        // Store analysis in database for future reference
        await saveAnalysisToDatabase(supabase, session.user.id, sopText, analysis, universityName, programName);
        
        return json({
            success: true,
            paragraphAnalyses: analysis.paragraphAnalyses,
            overallAnalysis: analysis.overallAnalysis,
            modelUsed: aiModel
        });
        
    } catch (error) {
        console.error('Error in SOP review:', error);
        return json({ error: 'Failed to analyze SOP' }, { status: 500 });
    }
};

async function analyzeSOPWithAI(sopText: string, reviewMode: string, universityName?: string, programName?: string, aiModel: string = 'gpt-3.5-turbo') {
    const paragraphs = sopText.split('\n\n').filter(p => p.trim().length > 0);
    
    // Enhanced prompt based on review mode
    const basePrompt = `You are an expert admissions consultant with 15+ years of experience reviewing Statement of Purpose documents for top universities worldwide. Your task is to provide comprehensive, actionable feedback.

CONTEXT:
- University: ${universityName || 'Not specified'}
- Program: ${programName || 'Not specified'}
- Review Mode: ${reviewMode}
- Total Paragraphs: ${paragraphs.length}
- Word Count: ${sopText.split(/\s+/).length}

Please analyze this SOP and provide detailed feedback in the exact JSON format specified below.`;

    const detailedPrompt = `${basePrompt}

ANALYSIS REQUIREMENTS:

1. **Paragraph-by-Paragraph Analysis**: For each paragraph, provide:
   - Content category (introduction, academic_background, experience, goals, conclusion, other)
   - Score out of 100
   - Specific strengths (3-5 points)
   - Specific weaknesses/issues (2-4 points)  
   - Actionable suggestions (3-5 points)
   - Improved version of the paragraph (if score < 80)

2. **Overall Analysis**: Provide comprehensive scoring:
   - Total Score (weighted average of all paragraphs)
   - Readability Score (clarity, flow, language)
   - Coherence Score (logical structure, transitions)
   - Relevance Score (alignment with program/university)
   - Strength Score (compelling arguments, uniqueness)
   - Overall strengths (5-7 key points)
   - Overall weaknesses (3-5 areas for improvement)
   - Critical issues (if any major problems exist)
   - Strategic recommendations (5-7 actionable steps)
   - Estimated impression (excellent/good/fair/needs_improvement)

SOP TEXT TO ANALYZE:
${sopText}

Respond with a valid JSON object in this exact format:`;

    const formatPrompt = `{
  "paragraphAnalyses": [
    {
      "id": 0,
      "originalText": "full paragraph text here",
      "score": 85,
      "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
      "weaknesses": ["specific weakness 1", "specific weakness 2"],
      "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
      "improvedText": "improved version if score < 80",
      "category": "introduction",
      "importance": "high"
    }
  ],
  "overallAnalysis": {
    "totalScore": 82,
    "wordCount": 650,
    "readabilityScore": 85,
    "coherenceScore": 80,
    "relevanceScore": 78,
    "strengthScore": 86,
    "overallStrengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
    "overallWeaknesses": ["weakness 1", "weakness 2", "weakness 3"],
    "criticalIssues": ["critical issue if any"],
    "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"],
    "estimatedImpression": "good"
  }
}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: aiModel,
                messages: [
                    {
                        role: 'system',
                        content: detailedPrompt
                    },
                    {
                        role: 'user', 
                        content: formatPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: aiModel.includes('gpt-4') ? 4000 : 3000
            })
        });
        
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }
        
        const data = await response.json();
        const analysisText = data.choices[0].message.content;
        
        // Parse the JSON response
        const analysis = JSON.parse(analysisText);
        
        // Validate and enhance the analysis
        return enhanceAnalysis(analysis, paragraphs, sopText);
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        // Fallback to rule-based analysis
        return createFallbackAnalysis(paragraphs, sopText, universityName, programName);
    }
}

function enhanceAnalysis(analysis: any, paragraphs: string[], sopText: string) {
    // Ensure we have analysis for all paragraphs
    while (analysis.paragraphAnalyses.length < paragraphs.length) {
        analysis.paragraphAnalyses.push({
            id: analysis.paragraphAnalyses.length,
            originalText: paragraphs[analysis.paragraphAnalyses.length],
            score: 70,
            strengths: ["Content is present and relevant"],
            weaknesses: ["Could be more specific and detailed"],
            suggestions: ["Add more concrete examples", "Strengthen the argument with evidence"],
            category: "other",
            importance: "medium"
        });
    }
    
    // Add actual paragraph text and IDs
    analysis.paragraphAnalyses.forEach((para: any, index: number) => {
        para.id = index;
        para.originalText = paragraphs[index];
    });
    
    // Ensure overall analysis has word count
    analysis.overallAnalysis.wordCount = sopText.split(/\s+/).filter(w => w.length > 0).length;
    
    return analysis;
}

function createFallbackAnalysis(paragraphs: string[], sopText: string, universityName?: string, programName?: string) {
    const wordCount = sopText.split(/\s+/).filter(w => w.length > 0).length;
    
    // Rule-based analysis for each paragraph
    const paragraphAnalyses = paragraphs.map((para, index) => {
        const paraWordCount = para.split(/\s+/).length;
        let category = 'other';
        let score = 75;
        
        // Determine category based on content and position
        if (index === 0) category = 'introduction';
        else if (index === paragraphs.length - 1) category = 'conclusion';
        else if (para.toLowerCase().includes('academic') || para.toLowerCase().includes('study') || para.toLowerCase().includes('university')) {
            category = 'academic_background';
        } else if (para.toLowerCase().includes('work') || para.toLowerCase().includes('experience') || para.toLowerCase().includes('project')) {
            category = 'experience';
        } else if (para.toLowerCase().includes('goal') || para.toLowerCase().includes('future') || para.toLowerCase().includes('career')) {
            category = 'goals';
        }
        
        // Basic scoring based on length and content quality
        if (paraWordCount < 50) score -= 15;
        if (paraWordCount > 150) score -= 10;
        if (para.split('.').length < 3) score -= 10;
        
        const strengths = [
            "Content is relevant to the application",
            "Writing style is appropriate for academic context",
            "Ideas are clearly expressed"
        ];
        
        const weaknesses = [
            "Could benefit from more specific examples",
            "Transitions could be smoother"
        ];
        
        const suggestions = [
            "Add more concrete, quantifiable examples",
            "Strengthen the connection to your target program",
            "Improve paragraph flow and transitions",
            "Consider adding more personal reflection"
        ];
        
        return {
            id: index,
            originalText: para,
            score: Math.max(60, Math.min(90, score)),
            strengths,
            weaknesses,
            suggestions,
            category,
            importance: index === 0 || index === paragraphs.length - 1 ? 'high' : 'medium'
        };
    });
    
    // Calculate overall scores
    const avgScore = paragraphAnalyses.reduce((sum, p) => sum + p.score, 0) / paragraphAnalyses.length;
    
    const overallAnalysis = {
        totalScore: Math.round(avgScore),
        wordCount,
        readabilityScore: wordCount > 500 && wordCount < 1000 ? 85 : 75,
        coherenceScore: paragraphs.length >= 4 && paragraphs.length <= 6 ? 80 : 70,
        relevanceScore: universityName ? 85 : 75,
        strengthScore: Math.round(avgScore * 0.9),
        overallStrengths: [
            "Clear writing style and good command of English",
            "Relevant academic and professional background",
            "Appropriate structure and organization",
            "Demonstrates motivation for the program",
            "Shows understanding of the field"
        ],
        overallWeaknesses: [
            "Could include more specific examples and achievements",
            "Stronger connection to target university needed",
            "More detailed future goals would strengthen the application"
        ],
        criticalIssues: wordCount < 400 ? ["SOP is too short - should be at least 500-600 words"] : [],
        recommendations: [
            "Add 2-3 specific examples of achievements or projects",
            "Research and mention specific professors or programs at the target university",
            "Clearly articulate your short-term and long-term career goals",
            "Strengthen the conclusion with a compelling vision for your future",
            "Ensure smooth transitions between paragraphs",
            "Proofread for any grammatical errors or typos"
        ],
        estimatedImpression: avgScore >= 85 ? 'excellent' : avgScore >= 75 ? 'good' : avgScore >= 65 ? 'fair' : 'needs_improvement'
    };
    
    return { paragraphAnalyses, overallAnalysis };
}

async function saveAnalysisToDatabase(supabase: any, userId: string, sopText: string, analysis: any, universityName?: string, programName?: string) {
    try {
        await supabase
            .from('sop_analyses')
            .insert({
                user_id: userId,
                sop_text: sopText,
                analysis_results: analysis,
                university_name: universityName,
                program_name: programName,
                word_count: analysis.overallAnalysis.wordCount,
                overall_score: analysis.overallAnalysis.totalScore,
                created_at: new Date().toISOString()
            });
    } catch (error) {
        console.error('Error saving analysis to database:', error);
        // Don't fail the request if database save fails
    }
}