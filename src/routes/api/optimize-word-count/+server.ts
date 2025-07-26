import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits';
import { getAIModelForUser } from '$lib/ai-models';

// University-specific word count requirements database
const UNIVERSITY_REQUIREMENTS = new Map([
    // US Universities
    ['harvard', { min: 700, max: 1000, optimal: 850 }],
    ['mit', { min: 500, max: 1000, optimal: 750 }],
    ['stanford', { min: 800, max: 1200, optimal: 1000 }],
    ['columbia', { min: 700, max: 1000, optimal: 850 }],
    ['yale', { min: 500, max: 1000, optimal: 750 }],
    ['princeton', { min: 600, max: 800, optimal: 700 }],
    
    // UK Universities
    ['oxford', { min: 700, max: 1000, optimal: 850 }],
    ['cambridge', { min: 700, max: 1000, optimal: 850 }],
    ['imperial', { min: 500, max: 1000, optimal: 750 }],
    ['lse', { min: 600, max: 1000, optimal: 800 }],
    ['ucl', { min: 500, max: 1000, optimal: 750 }],
    
    // Default ranges by program type
    ['default_masters', { min: 500, max: 1000, optimal: 750 }],
    ['default_phd', { min: 800, max: 1500, optimal: 1200 }],
    ['default_undergraduate', { min: 400, max: 800, optimal: 600 }]
]);

// Program-specific adjustments
const PROGRAM_TYPE_ADJUSTMENTS = {
    'masters': 0,
    'phd': 200,
    'undergraduate': -150,
    'postdoc': 400,
    'medical': 100,
    'law': 150,
    'business': -50,
    'engineering': 0,
    'research': 150
};

interface WordCountOptimization {
    current_word_count: number;
    target_word_count: number;
    university_requirements: {
        min: number;
        max: number;
        optimal: number;
        source: string;
    };
    optimization_needed: string;
    optimization_priority: string;
    content_analysis: {
        density_score: number;
        sections_identified: string[];
        expansion_opportunities: string[];
        condensation_opportunities: string[];
    };
    suggested_optimizations: Array<{
        type: string;
        section: string;
        strategy: string;
        priority: number;
    }>;
    optimized_content?: string;
}

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Define schema for validation
    const optimizeWordCountSchema = z.object({
        content: z.string().min(10).max(50000),
        university_name: z.string().min(1).max(200),
        program_name: z.string().min(1).max(200),
        program_type: z.enum(['masters', 'phd', 'bachelors']).default('masters'),
        optimization_type: z.enum(['analyze', 'optimize']).default('analyze')
    });

    try {
        const requestData = await request.json();

        // Validate and sanitize input
        const parsed = optimizeWordCountSchema.safeParse(requestData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;

        if (!data.content || !data.university_name || !data.program_name) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        const currentWordCount = data.content.split(/\s+/).filter((w: string) => w.length > 0).length;
        
        // Get university-specific requirements
        const requirements = getUniversityRequirements(data.university_name, data.program_type);
        
        // Analyze content structure and density
        const contentAnalysis = analyzeContentStructure(data.content);
        
        // Determine optimization needs
        const optimizationNeeded = determineOptimizationNeeds(currentWordCount, requirements);
        
        // Generate optimization suggestions
        const suggestions = generateOptimizationSuggestions(data.content, currentWordCount, requirements, optimizationNeeded);

        let optimizedContent = undefined;
        
        // If user requests actual optimization, generate it
        if (data.optimization_type === 'optimize') {
            // Get appropriate AI model based on user's subscription tier
            const aiModel = await getAIModelForUser(supabase, session.user.id);
            optimizedContent = await generateOptimizedContent(data.content, optimizationNeeded, requirements.optimal, suggestions, aiModel);
        }

        return json({
            success: true,
            currentWordCount,
            targetWordCount: requirements.optimal,
            requirements,
            contentAnalysis,
            optimizationNeeded,
            suggestions,
            optimizedContent
        });

    } catch (error) {
        console.error('Error in word count optimization:', error);
        return json({ error: 'Failed to optimize word count' }, { status: 500 });
    }
};

function getUniversityRequirements(universityName: string, programType: string) {
    const normalizedUniversity = universityName.toLowerCase();
    
    // Check for university-specific requirements
    for (const [key, requirements] of UNIVERSITY_REQUIREMENTS) {
        if (normalizedUniversity.includes(key)) {
            return {
                ...requirements,
                source: 'university_specific'
            };
        }
    }
    
    // Fall back to program type defaults
    const programKey = `default_${programType}`;
    const programRequirements = UNIVERSITY_REQUIREMENTS.get(programKey);
    
    if (programRequirements) {
        return {
            ...programRequirements,
            source: 'program_default'
        };
    }
    
    // Final fallback
    return {
        min: 500,
        max: 1000,
        optimal: 750,
        source: 'general_default'
    };
}

function analyzeContentStructure(content: string) {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerParagraph = content.split(/\s+/).length / paragraphs.length;
    const avgWordsPerSentence = content.split(/\s+/).length / sentences.length;
    
    // Identify potential sections
    const sections = identifySOPSections(content);
    
    // Calculate density score (higher = more information dense)
    const densityScore = calculateDensityScore(content, avgWordsPerSentence, avgWordsPerParagraph);
    
    // Find expansion and condensation opportunities
    const expansionOpportunities = findExpansionOpportunities(content, sections);
    const condensationOpportunities = findCondensationOpportunities(content, sections);
    
    return {
        density_score: densityScore,
        sections_identified: sections.map(s => s.type),
        expansion_opportunities: expansionOpportunities,
        condensation_opportunities: condensationOpportunities
    };
}

function identifySOPSections(content: string) {
    const sections = [];
    const lowerContent = content.toLowerCase();
    
    // Common SOP section patterns
    const sectionPatterns = [
        { type: 'Introduction', keywords: ['introduce', 'pursuing', 'applying', 'interest'], weight: 1 },
        { type: 'Academic Background', keywords: ['degree', 'university', 'study', 'research', 'gpa'], weight: 1 },
        { type: 'Work Experience', keywords: ['work', 'experience', 'company', 'position', 'role'], weight: 1 },
        { type: 'Research Interests', keywords: ['research', 'project', 'thesis', 'publication'], weight: 1 },
        { type: 'Career Goals', keywords: ['goal', 'future', 'career', 'aspire', 'plan'], weight: 1 },
        { type: 'Why This University', keywords: ['university', 'program', 'faculty', 'resources'], weight: 1 },
        { type: 'Conclusion', keywords: ['conclusion', 'finally', 'summary', 'grateful'], weight: 1 }
    ];
    
    for (const pattern of sectionPatterns) {
        const keywordCount = pattern.keywords.reduce((count, keyword) => {
            return count + (lowerContent.match(new RegExp(keyword, 'g')) || []).length;
        }, 0);
        
        if (keywordCount > 0) {
            sections.push({
                type: pattern.type,
                strength: keywordCount * pattern.weight,
                keywords_found: keywordCount
            });
        }
    }
    
    return sections.sort((a, b) => b.strength - a.strength);
}

function calculateDensityScore(content: string, avgWordsPerSentence: number, avgWordsPerParagraph: number): number {
    // Factors that contribute to density
    const factors = {
        sentenceLength: Math.min(avgWordsPerSentence / 20, 1), // Optimal around 15-20 words
        paragraphLength: Math.min(avgWordsPerParagraph / 100, 1), // Optimal around 80-100 words
        technicalTerms: (content.match(/\b[A-Z][a-z]*[A-Z][a-z]*\b/g) || []).length / 100,
        specificDetails: (content.match(/\b\d+\b/g) || []).length / 50
    };
    
    return Math.min((factors.sentenceLength + factors.paragraphLength + factors.technicalTerms + factors.specificDetails) / 4, 1);
}

function findExpansionOpportunities(content: string, sections: any[]): string[] {
    const opportunities = [];
    
    // Check for short sections that could be expanded
    const paragraphs = content.split('\n\n');
    
    if (paragraphs.length < 4) {
        opportunities.push('Add more paragraphs to structure your SOP better');
    }
    
    // Check for missing common sections
    const presentSections = sections.map(s => s.type.toLowerCase());
    const expectedSections = ['introduction', 'academic background', 'research interests', 'career goals', 'why this university'];
    
    for (const expected of expectedSections) {
        if (!presentSections.some(present => present.includes(expected.split(' ')[0]))) {
            opportunities.push(`Consider adding a ${expected} section`);
        }
    }
    
    // Check for brief mentions that could be expanded
    if (content.match(/\bresearch\b/gi) && !content.match(/\bresearch project\b|\bresearch experience\b/gi)) {
        opportunities.push('Expand on your research experience with specific projects and outcomes');
    }
    
    if (content.match(/\bwork\b|\bexperience\b/gi) && content.split(/\bwork|\bexperience/gi).length < 3) {
        opportunities.push('Provide more details about your work experience and achievements');
    }
    
    return opportunities;
}

function findCondensationOpportunities(content: string, sections: any[]): string[] {
    const opportunities = [];
    
    // Check for repetitive content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 30);
    
    if (longSentences.length > 0) {
        opportunities.push(`Break down ${longSentences.length} overly long sentences for better readability`);
    }
    
    // Check for redundant phrases
    const commonRedundancies = ['in order to', 'due to the fact that', 'it is important to note that'];
    for (const phrase of commonRedundancies) {
        if (content.toLowerCase().includes(phrase)) {
            opportunities.push(`Replace verbose phrases like "${phrase}" with more concise alternatives`);
        }
    }
    
    // Check for word repetition
    const words = content.toLowerCase().split(/\s+/);
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 4) {
            wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        }
    });
    
    const overusedWords = Object.entries(wordCount).filter(([word, count]) => count > 5);
    if (overusedWords.length > 0) {
        opportunities.push(`Consider using synonyms for frequently repeated words: ${overusedWords.map(([word]) => word).join(', ')}`);
    }
    
    return opportunities;
}

function determineOptimizationNeeds(currentWordCount: number, requirements: any) {
    const { min, max, optimal } = requirements;
    const deviation = Math.abs(currentWordCount - optimal);
    const deviationPercentage = deviation / optimal;
    
    let type: string;
    let priority: string;
    
    if (currentWordCount < min) {
        type = 'expand';
        priority = currentWordCount < min * 0.8 ? 'high' : 'medium';
    } else if (currentWordCount > max) {
        type = 'condense';
        priority = currentWordCount > max * 1.2 ? 'high' : 'medium';
    } else if (deviationPercentage > 0.15) {
        type = currentWordCount < optimal ? 'expand' : 'condense';
        priority = 'medium';
    } else if (deviationPercentage > 0.05) {
        type = 'minor_adjust';
        priority = 'low';
    } else {
        type = 'optimal';
        priority = 'low';
    }
    
    return { type, priority };
}

function generateOptimizationSuggestions(content: string, currentWordCount: number, requirements: any, optimizationNeeded: any) {
    const suggestions = [];
    const targetWordCount = requirements.optimal;
    const wordDifference = targetWordCount - currentWordCount;
    
    if (optimizationNeeded.type === 'expand') {
        suggestions.push({
            type: 'expand',
            section: 'Research Experience',
            strategy: 'Add specific research projects, methodologies, and outcomes',
            priority: 1
        });
        
        suggestions.push({
            type: 'expand',
            section: 'Career Goals',
            strategy: 'Elaborate on short-term and long-term career objectives',
            priority: 2
        });
        
        suggestions.push({
            type: 'expand',
            section: 'Why This University',
            strategy: 'Mention specific faculty, programs, or resources that attract you',
            priority: 3
        });
        
    } else if (optimizationNeeded.type === 'condense') {
        suggestions.push({
            type: 'condense',
            section: 'Introduction',
            strategy: 'Remove repetitive statements and get to the point faster',
            priority: 1
        });
        
        suggestions.push({
            type: 'condense',
            section: 'Background Details',
            strategy: 'Focus on most relevant experiences and remove excessive detail',
            priority: 2
        });
        
        suggestions.push({
            type: 'condense',
            section: 'Verbose Phrases',
            strategy: 'Replace wordy expressions with concise alternatives',
            priority: 3
        });
    }
    
    return suggestions;
}

async function generateOptimizedContent(content: string, optimizationNeeded: any, targetWordCount: number, suggestions: any[], aiModel: string = 'gpt-3.5-turbo'): Promise<string> {
    const prompt = `You are an expert SOP editor. Please ${optimizationNeeded.type === 'expand' ? 'expand' : 'condense'} the following Statement of Purpose to approximately ${targetWordCount} words.

Current word count: ${content.split(/\s+/).length} words
Target word count: ${targetWordCount} words

Optimization strategy:
${suggestions.map(s => `- ${s.strategy}`).join('\n')}

Original SOP:
${content}

Please provide the optimized version:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: aiModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: aiModel.includes('gpt-4') ? 2500 : 2000,
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate optimized content');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
} 