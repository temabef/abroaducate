/**
 * Email Verification Service
 * Handles email verification, disposable email detection, and academic domain recognition
 */

export interface EmailAnalysis {
    isDisposable: boolean;
    isAcademic: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    domain: string;
    institutionName?: string;
    bonusTier?: 'standard' | 'premium' | 'elite';
    blocked: boolean;
}

export interface VerificationToken {
    token: string;
    email: string;
    userId: string;
    expiresAt: string;
}

export class EmailVerificationService {
    private disposableDomains: Set<string> = new Set();
    private academicDomains: Map<string, any> = new Map();
    private initialized = false;

    /**
     * Initialize the service by loading domain lists
     */
    async initialize(supabase: any): Promise<void> {
        if (this.initialized) return;

        try {
            // Load disposable email domains
            const { data: disposableData } = await supabase
                .from('disposable_email_domains')
                .select('domain, risk_level, blocked');

            if (disposableData) {
                disposableData.forEach((item: any) => {
                    this.disposableDomains.add(item.domain.toLowerCase());
                });
            }

            // Load academic email domains
            const { data: academicData } = await supabase
                .from('academic_email_domains')
                .select('domain, institution_name, country, bonus_tier');

            if (academicData) {
                academicData.forEach((item: any) => {
                    this.academicDomains.set(item.domain.toLowerCase(), item);
                });
            }

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize email verification service:', error);
            // Continue with built-in lists as fallback
            this.initializeFallbackDomains();
        }
    }

    /**
     * Initialize with built-in domain lists as fallback
     */
    private initializeFallbackDomains(): void {
        // Common disposable email domains
        const disposableDomains = [
            '10minutemail.com', '10minutemail.net', 'guerrillamail.com',
            'mailinator.com', 'tempmail.org', 'yopmail.com', 'maildrop.cc',
            'temp-mail.org', 'sharklasers.com', 'throwaway.email'
        ];

        disposableDomains.forEach(domain => {
            this.disposableDomains.add(domain.toLowerCase());
        });

        // Common academic domains
        const academicDomains = {
            'edu': { institution_name: 'US Educational Institutions', bonus_tier: 'premium' },
            'ac.uk': { institution_name: 'UK Academic Institutions', bonus_tier: 'premium' },
            'edu.au': { institution_name: 'Australian Educational Institutions', bonus_tier: 'premium' }
        };

        Object.entries(academicDomains).forEach(([domain, data]) => {
            this.academicDomains.set(domain.toLowerCase(), data);
        });

        this.initialized = true;
    }

    /**
     * Analyze an email address for security and verification purposes
     */
    async analyzeEmail(email: string, supabase?: any): Promise<EmailAnalysis> {
        if (!this.initialized && supabase) {
            await this.initialize(supabase);
        } else if (!this.initialized) {
            this.initializeFallbackDomains();
        }

        const domain = this.extractDomain(email);
        const analysis: EmailAnalysis = {
            isDisposable: false,
            isAcademic: false,
            riskLevel: 'low',
            domain,
            blocked: false
        };

        // Check if disposable
        if (this.disposableDomains.has(domain)) {
            analysis.isDisposable = true;
            analysis.riskLevel = 'high';
            analysis.blocked = true;
        }

        // Check if academic
        const academicInfo = this.findAcademicDomain(domain);
        if (academicInfo) {
            analysis.isAcademic = true;
            analysis.institutionName = academicInfo.institution_name;
            analysis.bonusTier = academicInfo.bonus_tier;
            analysis.riskLevel = 'low'; // Academic emails are trusted
        }

        // Additional risk factors
        if (!analysis.isAcademic && !analysis.isDisposable) {
            // Check for suspicious patterns
            if (this.hasSuspiciousPattern(email)) {
                analysis.riskLevel = 'medium';
            }

            // Check domain reputation
            const domainRisk = await this.checkDomainReputation(domain);
            if (domainRisk > 0.5) {
                analysis.riskLevel = 'medium';
            }
        }

        return analysis;
    }

    /**
     * Extract domain from email address
     */
    private extractDomain(email: string): string {
        const parts = email.toLowerCase().split('@');
        return parts.length > 1 ? parts[1] : '';
    }

    /**
     * Find matching academic domain (supports partial matches)
     */
    private findAcademicDomain(domain: string): any {
        // Exact match first
        if (this.academicDomains.has(domain)) {
            return this.academicDomains.get(domain);
        }

        // Check for partial matches (e.g., ending with .edu, .ac.uk)
        for (const [academicDomain, data] of this.academicDomains.entries()) {
            if (domain.endsWith(academicDomain) || 
                (academicDomain.startsWith('uni-') && domain.includes('uni'))) {
                return data;
            }
        }

        return null;
    }

    /**
     * Check for suspicious email patterns
     */
    private hasSuspiciousPattern(email: string): boolean {
        const suspiciousPatterns = [
            /^\w+\d{6,}@/, // Many digits after letters
            /^[a-z]{1,3}\d{8,}@/, // Very short letters followed by many digits
            /^\w*test\w*@/i, // Contains "test"
            /^\w*temp\w*@/i, // Contains "temp"
            /^\w*fake\w*@/i, // Contains "fake"
            /^.{30,}@/, // Very long local part
            /^[^@]{1,2}@/ // Very short local part
        ];

        return suspiciousPatterns.some(pattern => pattern.test(email));
    }

    /**
     * Basic domain reputation check
     */
    private async checkDomainReputation(domain: string): Promise<number> {
        try {
            // For now, return low risk for established domains
            const establishedDomains = [
                'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
                'icloud.com', 'protonmail.com', 'tutanota.com'
            ];

            if (establishedDomains.includes(domain)) {
                return 0.1; // Low risk
            }

            // New or unknown domains get medium risk
            return 0.3;
        } catch (error) {
            return 0.2; // Default medium-low risk if check fails
        }
    }

    /**
     * Generate verification token
     */
    async generateVerificationToken(
        supabase: any, 
        userId: string, 
        email: string
    ): Promise<VerificationToken> {
        // Generate cryptographically secure token
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        try {
            const { error } = await supabase
                .from('email_verification_tokens')
                .insert({
                    user_id: userId,
                    token,
                    email: email.toLowerCase(),
                    expires_at: expiresAt
                });

            if (error) {
                throw new Error(`Failed to store verification token: ${error.message}`);
            }

            return { token, email, userId, expiresAt };
        } catch (error) {
            console.error('Error generating verification token:', error);
            throw error;
        }
    }

    /**
     * Verify email token
     */
    async verifyEmailToken(
        supabase: any, 
        token: string
    ): Promise<{ success: boolean; userId?: string; email?: string; error?: string }> {
        try {
            // Find the token
            const { data: tokenData, error: findError } = await supabase
                .from('email_verification_tokens')
                .select('*')
                .eq('token', token)
                .eq('used', false)
                .single();

            if (findError || !tokenData) {
                return { success: false, error: 'Invalid or expired verification token' };
            }

            // Check if token is expired
            if (new Date(tokenData.expires_at) < new Date()) {
                return { success: false, error: 'Verification token has expired' };
            }

            // Mark token as used
            const { error: updateError } = await supabase
                .from('email_verification_tokens')
                .update({ 
                    used: true, 
                    used_at: new Date().toISOString() 
                })
                .eq('id', tokenData.id);

            if (updateError) {
                console.error('Error marking token as used:', updateError);
            }

            // Update user subscription verification status
            const { error: subscriptionError } = await supabase
                .from('user_subscriptions')
                .update({ 
                    email_verified: true,
                    verification_tier: 'verified'
                })
                .eq('user_id', tokenData.user_id);

            if (subscriptionError) {
                console.error('Error updating subscription verification:', subscriptionError);
            }

            return { 
                success: true, 
                userId: tokenData.user_id, 
                email: tokenData.email 
            };
        } catch (error) {
            console.error('Error verifying email token:', error);
            return { success: false, error: 'Verification failed due to server error' };
        }
    }

    /**
     * Send verification email (would integrate with your email service)
     */
    async sendVerificationEmail(
        email: string, 
        token: string, 
        baseUrl: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
            
            // In production, integrate with your email service (SendGrid, Mailgun, etc.)
            // For now, log the verification URL
            console.log(`Verification email for ${email}: ${verificationUrl}`);
            
            return { success: true };
        } catch (error) {
            console.error('Error sending verification email:', error);
            return { success: false, error: 'Failed to send verification email' };
        }
    }

    /**
     * Check if email domain should block registration
     */
    async shouldBlockRegistration(email: string, supabase?: any): Promise<boolean> {
        const analysis = await this.analyzeEmail(email, supabase);
        return analysis.blocked || analysis.riskLevel === 'high';
    }

    /**
     * Get recommended verification tier for email
     */
    async getRecommendedVerificationTier(email: string, supabase?: any): Promise<string> {
        const analysis = await this.analyzeEmail(email, supabase);
        
        if (analysis.isAcademic && analysis.bonusTier === 'elite') {
            return 'premium';
        } else if (analysis.isAcademic || analysis.riskLevel === 'low') {
            return 'verified';
        } else {
            return 'basic';
        }
    }
}

// Singleton instance
export const emailVerificationService = new EmailVerificationService();
