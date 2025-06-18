/**
 * Email Verification Service
 * Handles email verification, disposable email detection, and academic domain recognition
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface EmailAnalysis {
    domain: string;
    isAcademic: boolean;
    isDisposable: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    blocked: boolean;
    bonusTier?: 'basic' | 'premium' | 'elite';
    confidence: number;
}

export interface VerificationToken {
    token: string;
    email: string;
    userId: string;
    expiresAt: string;
}

export class EmailVerificationService {
    // Enhanced list of blocked domains
    private readonly TEMP_EMAIL_DOMAINS = new Set([
        // Popular temporary email services
        '10minutemail.com', '10minutemail.net', '20minutemail.com', '33mail.com',
        'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org',
        'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempail.com',
        'mailinator.com', 'mailinator.net', 'mailinator2.com',
        'yopmail.com', 'yopmail.fr', 'yopmail.net',
        'throwaway.email', 'throwawaymail.com', 'throwaway-mail.com',
        'dispostable.com', 'disposeamail.com', 'disposable-email.ml',
        'getnada.com', 'inboxkitten.com', 'maildrop.cc',
        'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net',
        'tmail.ws', 'mytrashmail.com', 'trashmail.com', 'trashmail.ws',
        'emailondeck.com', 'spamgourmet.com', 'mailnesia.com',
        'fakeinbox.com', '0-mail.com', 'mohmal.com', 'tempinbox.com',
        'incognitomail.org', 'anonymbox.com', 'deadaddress.com',
        'mailcatch.com', 'maildu.de', 'rcpt.at', 'cool.fr.nf',
        'meltmail.com', 'mintemail.com', 'mytempemail.com',
        'tempemail.com', 'tempemail.net', 'tempymail.com',
        'mailexpire.com', 'zoemail.org', 'mailzilla.com',
        'guerrillamail.biz', 'guerrillamail.info', 'guerrillamail.us',
        'spam4.me', 'mailmetrash.com', 'nomail.xl.cx', 'mailmoat.com',
        'jetable.org', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org'
    ]);

    // Academic domains that get bonus features
    private readonly ELITE_ACADEMIC_DOMAINS = new Set([
        // Top universities
        'harvard.edu', 'mit.edu', 'stanford.edu', 'oxford.ac.uk', 'cambridge.ac.uk',
        'caltech.edu', 'princeton.edu', 'yale.edu', 'chicago.edu', 'columbia.edu',
        'berkeley.edu', 'ucla.edu', 'cornell.edu', 'upenn.edu', 'brown.edu',
        'dartmouth.edu', 'duke.edu', 'northwestern.edu', 'washington.edu',
        'nyu.edu', 'usc.edu', 'georgetown.edu', 'emory.edu', 'vanderbilt.edu'
    ]);

    private readonly PREMIUM_ACADEMIC_DOMAINS = new Set([
        // Good universities
        'cmu.edu', 'jhu.edu', 'rice.edu', 'notre-dame.edu', 'wustl.edu',
        'gatech.edu', 'uva.edu', 'unc.edu', 'michigan.edu', 'uci.edu',
        'ucd.edu', 'ucsd.edu', 'ucsb.edu', 'purdue.edu', 'ohio-state.edu',
        'psu.edu', 'rutgers.edu', 'wisc.edu', 'illinois.edu', 'indiana.edu'
    ]);

    // Patterns for detecting academic emails
    private readonly ACADEMIC_PATTERNS = [
        /\.edu$/i,        // US universities
        /\.ac\.uk$/i,     // UK universities
        /\.edu\.au$/i,    // Australian universities
        /\.ca$/i,         // Canadian institutions
        /\.ac\.nz$/i,     // New Zealand universities
        /\.edu\.sg$/i,    // Singapore universities
        /\.edu\.hk$/i,    // Hong Kong universities
        /\.ac\.za$/i,     // South African universities
        /\.edu\.ng$/i,    // Nigerian universities
        /\.edu\.gh$/i,    // Ghanaian universities
        /\.edu\.ke$/i,    // Kenyan universities
    ];

    private readonly academicDomains: Map<string, any> = new Map();
    private initialized = false;

    /**
     * Initialize the service by loading domain lists
     */
    async initialize(supabase: SupabaseClient): Promise<void> {
        if (this.initialized) return;

        try {
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
            this.TEMP_EMAIL_DOMAINS.add(domain.toLowerCase());
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
    async analyzeEmail(email: string, supabase: SupabaseClient): Promise<EmailAnalysis> {
        const domain = email.split('@')[1]?.toLowerCase();
        
        if (!domain) {
            return {
                domain: '',
                isAcademic: false,
                isDisposable: true,
                riskLevel: 'high',
                blocked: true,
                confidence: 1.0
            };
        }

        // Check if domain is blocked
        const isBlocked = this.isBlockedDomain(domain);
        const isDisposable = this.TEMP_EMAIL_DOMAINS.has(domain);
        const isAcademic = this.isAcademicDomain(domain);
        
        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (isDisposable || isBlocked) {
            riskLevel = 'high';
        } else if (this.isSuspiciousDomain(domain)) {
            riskLevel = 'medium';
        } else if (isAcademic) {
            riskLevel = 'low';
        }

        // Check rate limiting
        const isRateLimited = await this.checkRateLimit(domain, supabase);
        if (isRateLimited) {
            riskLevel = 'high';
        }

        // Determine bonus tier for academic emails
        let bonusTier: 'basic' | 'premium' | 'elite' | undefined;
        if (isAcademic) {
            if (this.ELITE_ACADEMIC_DOMAINS.has(domain)) {
                bonusTier = 'elite';
            } else if (this.PREMIUM_ACADEMIC_DOMAINS.has(domain)) {
                bonusTier = 'premium';
            } else {
                bonusTier = 'basic';
            }
        }

        return {
            domain,
            isAcademic,
            isDisposable,
            riskLevel,
            blocked: isBlocked || isDisposable || isRateLimited,
            bonusTier,
            confidence: isBlocked ? 1.0 : (isDisposable ? 0.9 : (isAcademic ? 0.8 : 0.7))
        };
    }

    private isBlockedDomain(domain: string): boolean {
        // Check temp email services
        if (this.TEMP_EMAIL_DOMAINS.has(domain)) return true;
        
        // Check suspicious patterns
        if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) return true;
        
        // Check for common typos in popular domains
        const suspiciousPatterns = [
            'gmial.com', 'gmali.com', 'gmai.com', 'yahooo.com', 'yahoo.cm',
            'hotmial.com', 'hotmai.com', 'outlok.com', 'outloo.com'
        ];
        
        return suspiciousPatterns.includes(domain);
    }

    private isAcademicDomain(domain: string): boolean {
        return this.ACADEMIC_PATTERNS.some(pattern => pattern.test(domain));
    }

    private isSuspiciousDomain(domain: string): boolean {
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /\d{3,}/, // domains with 3+ consecutive numbers
            /^[a-z]{1,3}\./, // very short subdomain
            /\.tk$|\.ml$|\.ga$|\.cf$/i, // free domains
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(domain));
    }

    private async checkRateLimit(domain: string, supabase: SupabaseClient): Promise<boolean> {
        try {
            // Check registrations from this domain in the last hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            
            const { data, error } = await supabase
                .from('registration_events')
                .select('count')
                .eq('email_domain', domain)
                .gte('created_at', oneHourAgo);

            if (error) {
                console.warn('Rate limit check failed:', error);
                return false;
            }

            // Allow max 5 registrations per domain per hour
            const recentRegistrations = data?.length || 0;
            return recentRegistrations >= 5;
        } catch (error) {
            console.warn('Rate limit check error:', error);
            return false;
        }
    }

    /**
     * Generate verification token
     */
    async generateVerificationToken(
        supabase: SupabaseClient, 
        userId: string, 
        email: string
    ): Promise<{ token: string; expiresAt: Date }> {
        const token = this.generateSecureToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await supabase
            .from('email_verification_tokens')
            .insert({
                user_id: userId,
                email,
                token,
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString()
            });

        return { token, expiresAt };
    }

    /**
     * Verify email token
     */
    async verifyEmailToken(
        supabase: SupabaseClient, 
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
    ): Promise<void> {
        const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
        
        // In production, integrate with your email service
        // For now, we'll simulate sending
        console.log(`Verification email would be sent to ${email}`);
        console.log(`Verification URL: ${verificationUrl}`);
    }

    /**
     * Check if email domain should block registration
     */
    async shouldBlockRegistration(email: string, supabase?: SupabaseClient): Promise<boolean> {
        const analysis = await this.analyzeEmail(email, supabase);
        return analysis.blocked || analysis.riskLevel === 'high';
    }

    /**
     * Get recommended verification tier for email
     */
    async getRecommendedVerificationTier(email: string, supabase?: SupabaseClient): Promise<string> {
        const analysis = await this.analyzeEmail(email, supabase);
        
        if (analysis.isAcademic && analysis.bonusTier === 'elite') {
            return 'premium';
        } else if (analysis.isAcademic || analysis.riskLevel === 'low') {
            return 'verified';
        } else {
            return 'basic';
        }
    }

    private generateSecureToken(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

// Singleton instance
export const emailVerificationService = new EmailVerificationService();
