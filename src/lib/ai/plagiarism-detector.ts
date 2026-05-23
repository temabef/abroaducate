import type { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export interface PlagiarismResult {
    risk_level: 'low' | 'medium' | 'high';
    originality_score: number; // 0-100
    similar_phrases: Array<{
        text: string;
        similarity: number;
        source?: string;
    }>;
    word_frequency_issues: Array<{
        phrase: string;
        frequency: number;
        suggestion: string;
    }>;
    analysis: {
        total_sentences: number;
        flagged_sentences: number;
        common_phrases_found: number;
        repetitive_patterns: number;
    };
}

export interface GrammarResult {
    errors: Array<{
        type: 'grammar' | 'spelling' | 'style' | 'punctuation';
        text: string;
        suggestion: string;
        position: { start: number; end: number };
        severity: 'low' | 'medium' | 'high';
    }>;
    score: number; // 0-100
    readability: {
        grade_level: number;
        complexity: 'simple' | 'moderate' | 'complex';
        suggestions: string[];
    };
}

class PlagiarismDetector {
    private openai: OpenAI;
    private supabase: SupabaseClient;
    
    // Common academic phrases that shouldn't be flagged
    private commonAcademicPhrases = [
        'in conclusion',
        'furthermore', 
        'moreover',
        'in addition',
        'as a result',
        'therefore',
        'however',
        'nevertheless',
        'consequently',
        'on the other hand'
    ];
    
    // Common SOP phrases that are expected
    private commonSOPPhrases = [
        'statement of purpose',
        'graduate school',
        'research interests',
        'academic background',
        'career goals',
        'undergraduate studies',
        'passionate about',
        'pursue my studies'
    ];

    constructor(openai: OpenAI, supabase: SupabaseClient) {
        this.openai = openai;
        this.supabase = supabase;
    }

    async checkPlagiarism(text: string, userId: string): Promise<PlagiarismResult> {
        try {
            // Check usage limits first
            const canProceed = await this.checkUsageLimit(userId);
            if (!canProceed) {
                throw new Error('Plagiarism check limit exceeded for your current plan');
            }

            // Split text into sentences for analysis
            const sentences = this.splitIntoSentences(text);
            
            // 1. Basic string similarity check against common phrases
            const phraseMatches = await this.checkCommonPhrases(sentences);
            
            // 2. Embedding-based similarity check (cost-effective)
            const embeddingMatches = await this.checkEmbeddingSimilarity(sentences);
            
            // 3. Repetitive pattern detection
            const repetitivePatterns = this.detectRepetitivePatterns(text);
            
            // 4. Word frequency analysis
            const wordFrequencyIssues = this.analyzeWordFrequency(text);
            
            // Combine results
            const allMatches = [...phraseMatches, ...embeddingMatches];
            const flaggedSentences = new Set(allMatches.map(m => m.text)).size;
            
            // Calculate originality score
            const riskScore = this.calculateRiskScore(
                sentences.length,
                flaggedSentences,
                repetitivePatterns.length,
                wordFrequencyIssues.length
            );
            
            // Increment usage counter
            await this.incrementUsage(userId);
            
            return {
                risk_level: this.getRiskLevel(riskScore),
                originality_score: Math.max(0, 100 - riskScore),
                similar_phrases: allMatches,
                word_frequency_issues: wordFrequencyIssues,
                analysis: {
                    total_sentences: sentences.length,
                    flagged_sentences: flaggedSentences,
                    common_phrases_found: phraseMatches.length,
                    repetitive_patterns: repetitivePatterns.length
                }
            };
            
        } catch (error) {
            console.error('Plagiarism check error:', error);
            throw error;
        }
    }
    
    async checkGrammar(text: string, aiModel: string = 'gpt-3.5-turbo'): Promise<GrammarResult> {
        try {
            // Use OpenAI for grammar checking (already paying for this)
            const prompt = `Please analyze the following text for grammar, spelling, and style issues. Return a JSON response with this exact structure:
            {
                "errors": [
                    {
                        "type": "grammar|spelling|style|punctuation",
                        "text": "incorrect text",
                        "suggestion": "corrected text",
                        "severity": "low|medium|high"
                    }
                ],
                "score": 85,
                "readability": {
                    "grade_level": 12,
                    "complexity": "moderate",
                    "suggestions": ["Use shorter sentences", "Avoid passive voice"]
                }
            }
            
            Text to analyze: "${text}"`;
            
            const response = await this.openai.chat.completions.create({
                model: aiModel,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: aiModel.includes('gpt-4') ? 1200 : 1000
            });
            
            const result = JSON.parse(response.choices[0].message.content || '{}');
            
            // Add position information for errors
            result.errors = result.errors?.map((error: any) => ({
                ...error,
                position: this.findTextPosition(text, error.text)
            })) || [];
            
            return result;
            
        } catch (error) {
            console.error('Grammar check error:', error);
            return {
                errors: [],
                score: 75,
                readability: {
                    grade_level: 12,
                    complexity: 'moderate',
                    suggestions: ['Unable to analyze - please try again']
                }
            };
        }
    }
    
    private async checkUsageLimit(userId: string): Promise<boolean> {
        try {
            const { data: usage } = await this.supabase
                .rpc('get_current_usage', { user_uuid: userId });
            
            const { data: limits } = await this.supabase
                .from('user_subscriptions')
                .select('plan_type')
                .eq('user_id', userId)
                .in('status', ['active','trialing'])
                .single();
            
            const planType = limits?.plan_type || 'free';
            const currentUsage = usage?.[0]?.plagiarism_checks || 0;
            
            // Get plan limits (aligned with current plans)
            const planLimits = { free: 1, professional: 10, elite: null } as const;
            const limit = planLimits[planType as keyof typeof planLimits];
            
            return limit === null || currentUsage < limit;
            
        } catch (error) {
            console.error('Usage check error:', error);
            return false;
        }
    }
    
    private async incrementUsage(userId: string): Promise<void> {
        try {
            await this.supabase
                .rpc('increment_usage', {
                    user_uuid: userId,
                    usage_type: 'plagiarism_checks'
                });
        } catch (error) {
            console.error('Usage increment error:', error);
        }
    }
    
    private splitIntoSentences(text: string): string[] {
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10); // Filter out very short sentences
    }
    
    private async checkCommonPhrases(sentences: string[]): Promise<Array<{ text: string; similarity: number; source?: string }>> {
        const matches: Array<{ text: string; similarity: number; source?: string }> = [];
        
        // Check against a database of common overused phrases in SOPs
        const overusedPhrases = [
            'ever since I was a child',
            'follow my passion',
            'make a difference in the world',
            'contribute to society',
            'cutting-edge research',
            'state-of-the-art facilities',
            'world-class education',
            'prestigious institution',
            'pursue my dreams',
            'bright future ahead'
        ];
        
        for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase();
            
            for (const phrase of overusedPhrases) {
                if (lowerSentence.includes(phrase.toLowerCase())) {
                    // Skip if it's a common academic phrase that's acceptable
                    const isAcceptable = this.commonAcademicPhrases.some(academic => 
                        lowerSentence.includes(academic.toLowerCase())
                    ) || this.commonSOPPhrases.some(sop => 
                        lowerSentence.includes(sop.toLowerCase())
                    );
                    
                    if (!isAcceptable) {
                        matches.push({
                            text: sentence,
                            similarity: 0.8,
                            source: 'common_overused_phrases'
                        });
                    }
                }
            }
        }
        
        return matches;
    }
    
    private async checkEmbeddingSimilarity(sentences: string[]): Promise<Array<{ text: string; similarity: number }>> {
        const matches: Array<{ text: string; similarity: number }> = [];
        
        try {
            // Only check a sample of sentences to control costs
            const sampleSentences = sentences.slice(0, Math.min(10, sentences.length));
            
            for (const sentence of sampleSentences) {
                // Generate embedding for the sentence
                const embedding = await this.openai.embeddings.create({
                    model: 'text-embedding-ada-002',
                    input: sentence
                });
                
                // Simple similarity check against stored embeddings
                // In a full implementation, you'd store embeddings of known plagiarized content
                
                // For now, check sentence structure patterns
                const suspiciousPatterns = [
                    /^(I have always been|Ever since|From a young age|Growing up)/i,
                    /(passionate about|deeply interested in|fascinated by).*(field|area|subject)/i,
                    /(pursue my|further my|advance my).*(career|studies|knowledge)/i
                ];
                
                const patternMatch = suspiciousPatterns.some(pattern => pattern.test(sentence));
                
                if (patternMatch && sentence.length > 50) {
                    matches.push({
                        text: sentence,
                        similarity: 0.7
                    });
                }
            }
            
        } catch (error) {
            console.error('Embedding similarity check error:', error);
        }
        
        return matches;
    }
    
    private detectRepetitivePatterns(text: string): string[] {
        const patterns: string[] = [];
        const words = text.toLowerCase().split(/\s+/);
        
        // Check for repeated phrases (3+ words)
        for (let i = 0; i < words.length - 2; i++) {
            const phrase = words.slice(i, i + 3).join(' ');
            const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const matches = text.match(regex);
            
            if (matches && matches.length > 2) {
                patterns.push(phrase);
            }
        }
        
        return [...new Set(patterns)];
    }
    
    private analyzeWordFrequency(text: string): Array<{ phrase: string; frequency: number; suggestion: string }> {
        const issues: Array<{ phrase: string; frequency: number; suggestion: string }> = [];
        const words = text.toLowerCase().split(/\s+/);
        const wordCount: { [key: string]: number } = {};
        
        // Count word frequency
        words.forEach(word => {
            const cleanWord = word.replace(/[^\w]/g, '');
            if (cleanWord.length > 3) {
                wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
            }
        });
        
        // Flag overused words
        const totalWords = words.length;
        Object.entries(wordCount).forEach(([word, count]) => {
            const frequency = (count / totalWords) * 100;
            
            if (frequency > 2 && count > 3) { // More than 2% frequency and appears 3+ times
                issues.push({
                    phrase: word,
                    frequency: count,
                    suggestion: `Consider using synonyms for "${word}" which appears ${count} times`
                });
            }
        });
        
        return issues.slice(0, 5); // Limit to top 5 issues
    }
    
    private calculateRiskScore(
        totalSentences: number,
        flaggedSentences: number,
        repetitivePatterns: number,
        wordFrequencyIssues: number
    ): number {
        const flaggedPercentage = (flaggedSentences / totalSentences) * 100;
        const repetitiveScore = Math.min(repetitivePatterns * 10, 30);
        const frequencyScore = Math.min(wordFrequencyIssues * 5, 20);
        
        return Math.min(flaggedPercentage + repetitiveScore + frequencyScore, 100);
    }
    
    private getRiskLevel(score: number): 'low' | 'medium' | 'high' {
        if (score < 30) return 'low';
        if (score < 60) return 'medium';
        return 'high';
    }
    
    private findTextPosition(text: string, searchText: string): { start: number; end: number } {
        const index = text.toLowerCase().indexOf(searchText.toLowerCase());
        if (index === -1) return { start: 0, end: 0 };
        
        return {
            start: index,
            end: index + searchText.length
        };
    }
}

export default PlagiarismDetector; 
