import { handleUpgradeRequired } from './upgradeService';
import { OPENAI_API_KEY } from '$env/static/private';

// Unified AI Feature Types
export type AIFeatureType = 
    | 'sop_review' 
    | 'text_enhancement' 
    | 'word_optimization' 
    | 'grammar_check' 
    | 'plagiarism_check'
    | 'tone_analysis';

export interface AIFeatureRequest {
    type: AIFeatureType;
    userId: string;
    content: string;
    options?: {
        targetWordCount?: number;
        enhancementType?: 'concise' | 'detailed' | 'academic' | 'professional';
        universityName?: string;
        programName?: string;
        documentType?: 'sop' | 'cover_letter' | 'personal_statement';
    };
}

export interface AIFeatureResponse {
    success: boolean;
    result?: any;
    usageData?: {
        type: string;
        currentUsage: number;
        limit: number | null;
        remainingUsage: number | null;
    };
    error?: string;
}

// Usage type mapping - Map to existing database columns
const usageTypeMap = {
    'sop_review': 'ai_improvements',      // Maps to ai_improvements_used
    'text_enhancement': 'ai_improvements', // Maps to ai_improvements_used  
    'word_optimization': 'ai_improvements', // Maps to ai_improvements_used
    'grammar_check': 'ai_improvements',   // Maps to ai_improvements_used
    'plagiarism_check': 'plagiarism_checks', // Maps to plagiarism_checks
    'tone_analysis': 'ai_improvements'    // Maps to ai_improvements_used
};

/**
 * Universal AI Feature Handler
 * This replaces all individual AI API endpoints with a unified service
 */
export async function handleAIFeatureRequest(
    supabase: any,
    request: AIFeatureRequest
): Promise<AIFeatureResponse> {
    try {
        // 1. Check usage limits first
        const usageType = usageTypeMap[request.type] || 'ai_improvements';
        const usageCheck = await checkAIUsageLimit(supabase, request.userId, usageType);
        
        if (!usageCheck.allowed) {
            // Trigger upgrade modal using our new system
            const upgradeTriggered = handleUpgradeRequired({
                upgradeRequired: true,
                planType: usageCheck.planType,
                currentUsage: usageCheck.currentUsage,
                limit: usageCheck.limit,
                message: usageCheck.message || `${request.type} limit reached`,
                usageType: usageType
            });

            if (upgradeTriggered) {
                return {
                    success: false,
                    error: 'Usage limit exceeded - upgrade modal shown'
                };
            }
        }

        // 2. Route to appropriate AI handler
        let result;
        switch (request.type) {
            case 'sop_review':
                result = await handleSOPReview(request);
                break;
            case 'text_enhancement':
                result = await handleTextEnhancement(request);
                break;
            case 'word_optimization':
                result = await handleWordOptimization(request);
                break;
            case 'grammar_check':
                result = await handleGrammarCheck(request);
                break;
            case 'plagiarism_check':
                result = await handlePlagiarismCheck(request);
                break;
            case 'tone_analysis':
                result = await handleToneAnalysis(request);
                break;
            default:
                throw new Error(`Unsupported AI feature: ${request.type}`);
        }

        // 3. Update usage tracking
        await incrementAIUsage(supabase, request.userId, usageType);
        
        // 4. Store result for analytics (DISABLED - table doesn't exist)
        // await storeAIResult(supabase, request.userId, request.type, result);

        // 5. Get updated usage data
        const updatedUsage = await getAIUsageData(supabase, request.userId, usageType);

        return {
            success: true,
            result,
            usageData: updatedUsage
        };

    } catch (error) {
        console.error('AI Feature Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'AI processing failed'
        };
    }
}

/**
 * Enhanced SOP Review Handler
 */
async function handleSOPReview(request: AIFeatureRequest) {
    const { content, options } = request;
    
    const prompt = `You are an expert admissions consultant. Analyze this Statement of Purpose and provide comprehensive feedback.

University: ${options?.universityName || 'Target University'}
Program: ${options?.programName || 'Graduate Program'}

TEXT TO ANALYZE:
${content}

INSTRUCTIONS:
1. If the text appears to be one large block, intelligently identify natural paragraph breaks based on topic shifts
2. Provide detailed analysis in this EXACT JSON structure
3. Give specific, actionable feedback

Required JSON Response:
{
  "overallAnalysis": {
    "totalScore": 85,
    "wordCount": ${content.split(/\s+/).length},
    "readabilityScore": 80,
    "coherenceScore": 85,
    "relevanceScore": 75,
    "strengthScore": 90,
    "estimatedImpression": "good",
    "overallStrengths": [
      "Clear passion for the field",
      "Strong practical experience",
      "Good progression of skills"
    ],
    "overallWeaknesses": [
      "Lacks connection to specific program",
      "Needs more quantifiable achievements"
    ],
    "criticalIssues": [
      "No clear future goals mentioned",
      "Missing research interests"
    ],
    "recommendations": [
      "Add specific program details",
      "Include concrete career goals",
      "Quantify achievements with numbers"
    ]
  },
  "paragraphAnalyses": [
    {
      "id": 1,
      "originalText": "First paragraph text here...",
      "score": 85,
      "category": "introduction",
      "importance": "high",
      "strengths": ["Engaging opening", "Clear context"],
      "weaknesses": ["Too general", "Lacks specificity"],
      "suggestions": ["Be more specific about interests", "Add quantifiable details"],
      "improvedText": "Enhanced version of the paragraph..."
    }
  ]
}

Analyze the SOP thoroughly and return ONLY the JSON response.`;

    const result = await callOpenAI(prompt, 'gpt-4', 4000);
    
    try {
        // Try to parse as JSON first
        const parsedResult = JSON.parse(result);
        return parsedResult;
    } catch (e) {
        // If not valid JSON, return as analysis text
        return {
            analysis: result,
            overallAnalysis: {
                totalScore: 75,
                wordCount: content.split(/\s+/).length,
                estimatedImpression: "needs_review"
            }
        };
    }
}

/**
 * Enhanced Text Enhancement Handler
 */
async function handleTextEnhancement(request: AIFeatureRequest) {
    const { content, options } = request;
    
    const enhancementPrompts = {
        'concise': 'Make this text more concise while preserving all key information',
        'detailed': 'Expand this text with more specific details and examples',
        'academic': 'Enhance this text with more academic language and scholarly tone',
        'professional': 'Make this text more professional and polished'
    };
    
    const enhancement = options?.enhancementType || 'concise';
    const prompt = `${enhancementPrompts[enhancement]}:

Original text: "${content}"

Enhanced version:`;

    return await callOpenAI(prompt, 'gpt-3.5-turbo', 1000);
}

/**
 * Word Count Optimization Handler
 */
async function handleWordOptimization(request: AIFeatureRequest) {
    const { content, options } = request;
    const currentWords = content.split(/\s+/).length;
    const targetWords = options?.targetWordCount || currentWords;
    
    const optimizationType = targetWords > currentWords ? 'expand' : 'condense';
    
    const prompt = `${optimizationType === 'expand' ? 'Expand' : 'Condense'} this text to approximately ${targetWords} words:

Current: ${currentWords} words
Target: ${targetWords} words

Content: ${content}

Optimized version:`;

    return await callOpenAI(prompt, 'gpt-3.5-turbo', 2000);
}

/**
 * Grammar Check Handler
 */
async function handleGrammarCheck(request: AIFeatureRequest) {
    const { content } = request;
    
    const prompt = `Check this text for grammar, spelling, and style issues:

"${content}"

Provide corrections in JSON format:
{
    "corrected_text": "corrected version",
    "issues": [{"type": "grammar", "original": "text", "correction": "fix", "explanation": "why"}]
}`;

    return await callOpenAI(prompt, 'gpt-3.5-turbo', 1500);
}

/**
 * Plagiarism Check Handler (Basic)
 */
async function handlePlagiarismCheck(request: AIFeatureRequest) {
    const { content } = request;
    
    // Basic plagiarism detection using AI
    const prompt = `Analyze this text for potential plagiarism indicators:

"${content}"

Return JSON:
{
    "risk_level": "low|medium|high",
    "originality_score": 85,
    "concerns": ["list of potential issues"],
    "recommendations": ["suggestions for improvement"]
}`;

    return await callOpenAI(prompt, 'gpt-3.5-turbo', 1000);
}

/**
 * Tone Analysis Handler
 */
async function handleToneAnalysis(request: AIFeatureRequest) {
    const { content } = request;
    
    const prompt = `Analyze the tone of this text:

"${content}"

Return JSON:
{
    "overall_tone": "professional|academic|personal|passionate",
    "confidence_score": 0.85,
    "tone_breakdown": {"professional": 0.7, "academic": 0.8, "personal": 0.6},
    "suggestions": ["how to improve tone"]
}`;

    return await callOpenAI(prompt, 'gpt-3.5-turbo', 800);
}

/**
 * OpenAI API Call Helper
 */
async function callOpenAI(prompt: string, model: string = 'gpt-3.5-turbo', maxTokens: number = 1000) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Usage Checking Functions
 */
async function checkAIUsageLimit(supabase: any, userId: string, usageType: string) {
    // Get user's plan and current usage
    const { data: usage } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    const planType = subscription?.plan_type || 'free';
    
    // Define limits - Match existing database schema
    const limits = {
        free: {
            ai_improvements: 5,      // Combined limit for all AI features except plagiarism
            plagiarism_checks: 1     // Separate limit for plagiarism checks
        },
        professional: {
            ai_improvements: 25,     // Higher combined limit 
            plagiarism_checks: 5     // More plagiarism checks
        },
        elite: {
            ai_improvements: 999999, // Unlimited
            plagiarism_checks: 999999 // Unlimited
        }
    };

    const currentUsage = usage?.[`${usageType}_used`] || 0;
    const planLimits = limits[planType as keyof typeof limits];
    const limit = planLimits[usageType as keyof typeof planLimits];
    
    return {
        allowed: limit === null || currentUsage < limit,
        currentUsage,
        limit,
        planType,
        message: limit !== null && currentUsage >= limit ? 
            `Monthly ${usageType.replace('_', ' ')} limit reached` : undefined
    };
}

async function incrementAIUsage(supabase: any, userId: string, usageType: string) {
    const { error } = await supabase.rpc('increment_usage', {
        user_uuid: userId,
        usage_type: `${usageType}_used`,
        increment_by: 1
    });
    
    if (error) {
        console.error('Error incrementing usage:', error);
    }
}

async function getAIUsageData(supabase: any, userId: string, usageType: string) {
    const { data: usage } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

    const usageCheck = await checkAIUsageLimit(supabase, userId, usageType);
    
    return {
        type: usageType,
        currentUsage: usageCheck.currentUsage,
        limit: usageCheck.limit,
        remainingUsage: usageCheck.limit ? usageCheck.limit - usageCheck.currentUsage : null
    };
}

async function storeAIResult(supabase: any, userId: string, featureType: string, result: any) {
    const { error } = await supabase
        .from('ai_feature_analytics')
        .insert({
            user_id: userId,
            feature_type: featureType,
            result_data: result,
            created_at: new Date().toISOString()
        });
    
    if (error) {
        console.error('Error storing AI result:', error);
    }
} 