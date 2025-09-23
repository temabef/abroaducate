<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  let { supabase, session } = data;
  
  let userPlan = $state('free');
  let usage = $state<Record<string, number>>({});
  let planLimits = $state<Record<string, number | null>>({});
  let isLoading = $state(true);
  let selectedCategory = $state('all');
  
  // Tool type definition
  interface Tool {
    id: string;
    category: string;
    title: string;
    description: string;
    icon: string;
    href: string;
    features: string[];
    tier: 'free' | 'limited' | 'premium';
    limitation?: string;
    premium_features?: string[];
    usage_key?: string;
    plan_required?: 'professional' | 'elite';
    monthly_limit?: number;
  }
  
  // Enhanced tool categorization
  const toolCategories = {
    document_generation: {
      title: 'Document Generation',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>`,
      description: 'Create professional academic documents'
    },
    ai_features: {
      title: 'AI Enhancement Tools',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`, 
      description: 'AI-powered writing assistance and optimization'
    },
    test_prep: {
      title: 'Test Preparation',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2 3h6l2 4h8l4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3z"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="14" y2="15"/></svg>`,
      description: 'Practice tests and preparation materials'
    },
    analysis: {
      title: 'Academic Analysis', 
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 21H6.2a2.2 2.2 0 0 1-2.2-2.2V3h17v18z"/><path d="M7 16l3-3 3 3 4-4"/></svg>`,
      description: 'Analyze your academic profile and competitiveness'
    },
    matching: {
      title: 'University & Scholarship Matching',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`, 
      description: 'Find opportunities that match your profile'
    },
    tracking: {
      title: 'Application Management',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 11H7l5-8 5 8h-2l-3 7-3-7z"/></svg>`,
      description: 'Track and manage your application process'
    },
    communication: {
      title: 'Communication Tools',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
      description: 'Professional outreach and interview preparation'
    }
  };
  
  // COMPLETE tool definitions based on pricing page analysis
  const allTools: Tool[] = [
    // COMPLETELY FREE TOOLS (No limits)
    {
      id: 'ielts-test-prep',
      category: 'test_prep',
      title: 'IELTS Test Prep',
      description: 'Full access to all practice tests (Reading, Listening, Writing, Speaking)',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2 3h6l2 4h8l4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3z"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="14" y2="15"/></svg>`,
      href: '/test-prep',
      features: ['Reading practice', 'Listening tests', 'Writing exercises', 'Speaking practice'],
      tier: 'free'
    },
    {
      id: 'document-checklists',
      category: 'tracking',
      title: 'Document Checklists',
      description: 'Complete application tracking and deadline management',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>`,
      href: '/document-checklists',
      features: ['University-specific lists', 'Progress tracking', 'Deadline reminders'],
      tier: 'free'
    },
    {
      id: 'scholarship-browser',
      category: 'matching',
      title: 'Scholarship Browser',
      description: 'Free access to all scholarship listings',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
      href: '/scholarships',
      features: ['Full scholarship database', 'Search and filter', 'Deadline tracking'],
      tier: 'free'
    },
    {
      id: 'email-notifications',
      category: 'communication',
      title: 'Email Notifications',
      description: 'Weekly scholarship digest delivered to your inbox',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
      href: '/account/preferences',
      features: ['Weekly digest', 'New opportunities', 'Deadline alerts'],
      tier: 'free'
    },
    {
      id: 'gpa-converter',
      category: 'analysis',
      title: 'GPA Converter',
      description: 'Convert your GPA to international standards',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 21H6.2a2.2 2.2 0 0 1-2.2-2.2V3h17v18z"/><path d="M7 16l3-3 3 3 4-4"/></svg>`,
      href: '/gpa-converter',
      features: ['Multiple grading systems', 'Instant conversion', 'PDF export'],
      tier: 'free'
    },
    
    // LIMITED FREE TOOLS (Monthly limits)
    {
      id: 'sop-generator',
      category: 'document_generation',
      title: 'SOP Generator',
      description: 'Create compelling Statement of Purpose documents',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
      href: '/sop',
      features: ['AI-powered drafts', 'Multiple templates', 'Word count tracking'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['50 SOPs/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'sops_created',
      monthly_limit: 1
    },
    {
      id: 'cover-letter-generator',
      category: 'document_generation',
      title: 'Cover Letter Generator',
      description: 'Professional cover letters for job applications',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
      href: '/cover-letters',
      features: ['Professional templates', 'Industry-specific formats'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['50 letters/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'cover_letters_created',
      monthly_limit: 1
    },
    {
      id: 'personal-statement-generator',
      category: 'document_generation',
      title: 'Personal Statement Generator',
      description: 'Craft compelling personal statements',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/><polygon points="18,2 22,6 12,16 8,16 8,12 18,2"/></svg>`,
      href: '/personal-statements',
      features: ['Academic templates', 'Structure guidance'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['50 statements/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'personal_statements_created',
      monthly_limit: 1
    },
    {
      id: 'academic-cv-generator',
      category: 'document_generation',
      title: 'Academic CV Generator',
      description: 'Create professional academic CVs',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
      href: '/academic-cv',
      features: ['Academic templates', 'Professional formatting'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['50 CVs/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'academic_cvs_created',
      monthly_limit: 1
    },
    {
      id: 'ai-review',
      category: 'ai_features',
      title: 'AI Document Review',
      description: 'Get AI-powered feedback on your documents',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
      href: '/sop-review',
      features: ['Grammar check', 'Structure analysis', 'Improvement suggestions'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['15 reviews/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'reviews',
      monthly_limit: 1
    },
    {
      id: 'text-enhancement',
      category: 'ai_features',
      title: 'Text Enhancement',
      description: 'Improve your writing with AI suggestions',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/><polygon points="18,2 22,6 12,16 8,16 8,12 18,2"/></svg>`,
      href: '/word-optimization',
      features: ['Word choice improvement', 'Clarity enhancement', 'Style optimization'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['25 enhancements/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'text_enhancements',
      monthly_limit: 1
    },
    {
      id: 'word-optimization',
      category: 'ai_features',
      title: 'Word Optimization',
      description: 'Optimize word choice for maximum impact',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.828 14.828a4 4 0 0 1-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-7-7h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/></svg>`,
      href: '/word-optimization',
      features: ['Vocabulary enhancement', 'Academic tone', 'Precision improvement'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['15 optimizations/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'word_optimizations',
      monthly_limit: 1
    },
    {
      id: 'grammar-check',
      category: 'ai_features',
      title: 'Grammar Check',
      description: 'Advanced grammar and style checking',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 1.5 17V7A2.5 2.5 0 0 1 4 4.5h16A2.5 2.5 0 0 1 22.5 7v10a2.5 2.5 0 0 1-2.5 2.5H4z"/><path d="M9 9h1m4 0h1m-6 4h1m4 0h1"/></svg>`,
      href: '/word-optimization?mode=grammar',
      features: ['Grammar correction', 'Style suggestions', 'Error highlighting'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['25 checks/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'grammar_check',
      monthly_limit: 1
    },
    {
      id: 'plagiarism-check',
      category: 'ai_features',
      title: 'Plagiarism Checker',
      description: 'Ensure originality of your documents',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
      href: '/plagiarism-check',
      features: ['Advanced detection', 'Detailed reports', 'Citation suggestions'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['10 checks/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'plagiarism_checks',
      monthly_limit: 1
    },
    {
      id: 'tone-analysis',
      category: 'ai_features',
      title: 'Tone Analysis',
      description: 'Analyze and improve document tone',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 12l3-3 3 3 4-4M8 21l4-7 4 7M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>`,
      href: '/word-optimization?mode=tone',
      features: ['Tone detection', 'Mood analysis', 'Style recommendations'],
      tier: 'limited',
      limitation: '1 per month',
      premium_features: ['25 analyses/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'tone_analysis',
      monthly_limit: 1
    },
    {
      id: 'inline-editing',
      category: 'ai_features',
      title: 'Inline Text Editing',
      description: 'AI-powered inline text improvements',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
      href: '/word-optimization?mode=inline',
      features: ['Real-time suggestions', 'Contextual edits', 'Smart corrections'],
      tier: 'limited',
      limitation: '5 per month',
      premium_features: ['50 edits/month (Professional)', 'Unlimited (Elite)'],
      usage_key: 'inline_editing',
      monthly_limit: 5
    },
    {
      id: 'university-browser',
      category: 'matching',
      title: 'University Database',
      description: 'Browse universities with basic matching',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>`,
      href: '/universities',
      features: ['University search', 'Basic filters', 'Program information'],
      tier: 'limited',
      limitation: '50+ universities with basic matching',
      premium_features: ['500+ universities (Professional)', '1500+ universities (Elite)'],
      usage_key: 'university_matching',
      monthly_limit: 25
    },
    {
      id: 'academic-analysis',
      category: 'analysis',
      title: 'Academic Analysis',
      description: 'Quick profile assessment',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 21H6.2a2.2 2.2 0 0 1-2.2-2.2V3h17v18z"/><path d="M7 16l3-3 3 3 4-4"/></svg>`,
      href: '/academic-analyzer',
      features: ['Profile strength analysis', 'Basic competitiveness score'],
      tier: 'limited',
      limitation: 'Quick assessment only',
      premium_features: ['Comprehensive transcript analysis (Professional+)']
    },
    {
      id: 'application-tracker',
      category: 'tracking',
      title: 'Application Tracker',
      description: 'Track your university applications',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 11H7l5-8 5 8h-2l-3 7-3-7z"/></svg>`,
      href: '/applications',
      features: ['Deadline tracking', 'Status management', 'Progress overview'],
      tier: 'limited',
      limitation: '12 applications with basic reminders',
      premium_features: ['1000 applications with analytics (Professional)', 'Unlimited (Elite)']
    },
    {
      id: 'visa-interview',
      category: 'communication',
      title: 'Visa Interview Simulator',
      description: 'Practice with AI-powered interview questions',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
      href: '/visa-interview-practice',
      features: ['Realistic questions', 'AI feedback', 'Progress tracking'],
      tier: 'limited',
      limitation: '6 questions per session',
      premium_features: ['50 questions/session (Professional)', '80 questions/session (Elite)'],
      usage_key: 'visa_interview_questions',
      monthly_limit: 6
    },
    {
      id: 'version-history',
      category: 'tracking',
      title: 'Version History',
      description: 'Track document revisions',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`,
      href: '/documents/history',
      features: ['Version tracking', 'Compare changes'],
      tier: 'limited',
      limitation: '3 versions (cover letters only, 30-day retention)',
      premium_features: ['50 versions all docs (Professional)', '100 versions (Elite)']
    },
    {
      id: 'cold-email-generator',
      category: 'communication',
      title: 'Cold Email Generator',
      description: 'Generate professional outreach emails',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
      href: '/cold-email-generator',
      features: ['Professional templates', 'Personalization', 'Follow-up sequences'],
      tier: 'limited',
      limitation: '5 emails per month',
      premium_features: ['50 emails/month (Professional)', '500 emails/month (Elite)'],
      usage_key: 'cold_emails_created',
      monthly_limit: 5
    },
    
    // PREMIUM ONLY TOOLS
    {
      id: 'advanced-university-matching',
      category: 'matching',
      title: 'Advanced University Matching',
      description: 'AI-powered university recommendations with detailed analytics',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
      href: '/universities?mode=advanced',
      features: ['AI matching algorithm', 'Detailed compatibility scores', 'Advanced analytics'],
      tier: 'premium',
      plan_required: 'professional'
    },
    {
      id: 'comprehensive-analysis',
      category: 'analysis',
      title: 'Comprehensive Academic Analysis',
      description: 'Full transcript analysis and competitiveness scoring',
      icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>`,
      href: '/academic-analyzer?mode=comprehensive',
      features: ['Transcript analysis', 'Detailed competitiveness score', 'Improvement roadmap'],
      tier: 'premium',
      plan_required: 'professional'
    }
  ];
  
  onMount(async () => {
    await loadUserPlanAndUsage();
  });
  
  async function loadUserPlanAndUsage() {
    try {
      if (!session?.user?.id) {
        isLoading = false;
        return;
      }
      
      // Get user subscription plan
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', session.user.id)
        .in('status', ['active', 'trialing'])
        .single();
      
      userPlan = subscription?.plan_type || 'free';
      planLimits = getPlanLimits(userPlan);
      
      // Load usage data using the same logic as account page
      await loadUsageData();
      
    } catch (error) {
      console.error('Error loading user plan and usage:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function loadUsageData() {
    if (!session?.user?.id) return;
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Get AI usage from ai_usage_log table
    const { data: aiUsageData } = await supabase
      .from('ai_usage_log')
      .select('feature_type')
      .eq('user_id', session.user!.id)
      .gte('created_at', firstDayOfMonth);
    
    const currentUsage: Record<string, number> = {};
    if (aiUsageData) {
      aiUsageData.forEach((log: any) => {
        currentUsage[log.feature_type] = (currentUsage[log.feature_type] || 0) + 1;
      });
    }
    
    // Get document counts from individual tables
    const { data: sops } = await supabase
      .from('sops')
      .select('id')
      .eq('user_id', session.user!.id)
      .gte('created_at', firstDayOfMonth);
    
    const { data: coverLetters } = await supabase
      .from('cover_letters')
      .select('id')
      .eq('user_id', session.user!.id)
      .gte('created_at', firstDayOfMonth);
    
    const { data: personalStatements } = await supabase
      .from('personal_statements')
      .select('id')
      .eq('user_id', session.user!.id)
      .gte('created_at', firstDayOfMonth);
    
    const { data: academicCVs } = await supabase
      .from('academic_cvs')
      .select('id')
      .eq('user_id', session.user!.id)
      .gte('created_at', firstDayOfMonth);
    
    const { data: coldEmails } = await supabase
      .from('cold_emails')
      .select('id')
      .eq('user_id', session.user!.id)
      .gte('created_at', firstDayOfMonth);
    
    usage = {
      // AI Features
      reviews: currentUsage.reviews || 0,
      text_enhancements: currentUsage.text_enhancements || 0,
      word_optimizations: currentUsage.word_optimizations || 0,
      grammar_check: currentUsage.grammar_check || 0,
      plagiarism_checks: currentUsage.plagiarism_checks || 0,
      tone_analysis: currentUsage.tone_analysis || 0,
      university_matching: currentUsage.university_matching || 0,
      visa_interview_questions: currentUsage.visa_interview_questions || 0,
      inline_editing: currentUsage.inline_editing || 0,
      
      // Document Generation
      sops_created: sops?.length || 0,
      cover_letters_created: coverLetters?.length || 0,
      personal_statements_created: personalStatements?.length || 0,
      academic_cvs_created: academicCVs?.length || 0,
      cold_emails_created: coldEmails?.length || 0
    };
  }
  
  function getPlanLimits(planType: string) {
    const limits: Record<string, Record<string, number | null>> = {
      free: {
        sops_created: 1,
        cover_letters_created: 1,
        personal_statements_created: 1,
        academic_cvs_created: 1,
        cold_emails_created: 5,
        reviews: 1,
        text_enhancements: 1,
        word_optimizations: 1,
        grammar_check: 1,
        plagiarism_checks: 1,
        tone_analysis: 1,
        university_matching: 25,
        visa_interview_questions: 6,
        inline_editing: 5
      },
      professional: {
        sops_created: 50,
        cover_letters_created: 50,
        personal_statements_created: 50,
        academic_cvs_created: 50,
        cold_emails_created: 50,
        reviews: 15,
        text_enhancements: 25,
        word_optimizations: 15,
        grammar_check: 25,
        plagiarism_checks: 10,
        tone_analysis: 25,
        university_matching: 200,
        visa_interview_questions: 50,
        inline_editing: 50
      },
      elite: {
        sops_created: null,
        cover_letters_created: null,
        personal_statements_created: null,
        academic_cvs_created: null,
        cold_emails_created: 500,
        reviews: null,
        text_enhancements: null,
        word_optimizations: null,
        grammar_check: null,
        plagiarism_checks: null,
        tone_analysis: null,
        university_matching: 500,
        visa_interview_questions: 80,
        inline_editing: null
      }
    };
    return limits[planType] || limits.free;
  }
  
  function getUsageDisplay(tool: Tool): string {
    if (!tool.usage_key || usage[tool.usage_key] === undefined) return '';
    
    const current = usage[tool.usage_key];
    const limit = planLimits[tool.usage_key];
    
    if (limit === null) return 'Unlimited';
    return `${current}/${limit} used`;
  }
  
  function getUsageBadgeColor(tool: Tool): string {
    if (!tool.usage_key || planLimits[tool.usage_key] === null) {
      return 'bg-green-100 text-green-800';
    }
    
    const current = usage[tool.usage_key] || 0;
    const limit = planLimits[tool.usage_key] || 1;
    const percentage = (current / limit) * 100;
    
    if (percentage >= 90) return 'bg-red-100 text-red-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  }
  
  function canAccessTool(tool: Tool): boolean {
    // Free tier tools are always accessible
    if (tool.tier === 'free') return true;
    
    // Limited tools are accessible but with usage limits
    if (tool.tier === 'limited') return true;
    
    // Premium tools require specific plans
    if (tool.tier === 'premium') {
      const planHierarchy = { free: 0, professional: 1, elite: 2 };
      const userLevel = planHierarchy[userPlan as keyof typeof planHierarchy] || 0;
      const requiredLevel = planHierarchy[tool.plan_required as keyof typeof planHierarchy] || 0;
      return userLevel >= requiredLevel;
    }
    
    return true;
  }
  
  function isUsageExceeded(tool: Tool): boolean {
    if (!tool.usage_key || planLimits[tool.usage_key] === null) return false;
    
    const current = usage[tool.usage_key] || 0;
    const limit = planLimits[tool.usage_key] || 0;
    return current >= limit;
  }
  
  function handleToolClick(tool: Tool, event: Event) {
    // If tool requires premium plan, redirect to pricing
    if (!canAccessTool(tool)) {
      event.preventDefault();
      window.location.href = `/pricing?plan=${tool.plan_required}`;
      return;
    }
    
    // If usage limit exceeded, redirect to pricing
    if (isUsageExceeded(tool)) {
      event.preventDefault();
      window.location.href = '/pricing?plan=professional';
      return;
    }
  }
  
  // Filtered tools based on selected category
  let filteredTools = $derived.by(() => {
    if (selectedCategory === 'all') return allTools;
    return allTools.filter(tool => tool.category === selectedCategory);
  });
  
  function getTierBadge(tier: string) {
    if (tier === 'free') return { text: 'FREE', class: 'bg-green-100 text-green-800' };
    if (tier === 'limited') return { text: 'LIMITED', class: 'bg-blue-100 text-blue-800' };
    return { text: 'PRO', class: 'bg-purple-100 text-purple-800' };
  }
</script>

<svelte:head>
  <title>Tools Hub - Abroaducate</title>
  <meta name="description" content="Complete suite of academic tools for international students. Document generation, AI features, test prep, and application management." />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Page Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
        <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 7.24a1 1 0 0 0-.29-.71L17.47 2.29A1 1 0 0 0 16.76 2a1 1 0 0 0-.71.29L13.22 5.12l2.36 2.36L18.41 4.65l2.24 2.24-.71.71a1 1 0 0 0 0 1.41 1 1 0 0 0 1.41 0l1.42-1.42A1 1 0 0 0 22 7.24zM6.83 14.76l-1.06 1.06a1 1 0 0 0-.29.71 1 1 0 0 0 .29.71l4.24 4.24a1 1 0 0 0 .71.29 1 1 0 0 0 .71-.29l1.06-1.06zm7.07-7.07L11.12 10.47 8.76 8.11l2.78-2.78a1 1 0 0 0 0-1.41 1 1 0 0 0-1.41 0L7.34 6.7a1 1 0 0 0 0 1.41l1.06 1.06L6.83 10.76a1 1 0 0 0 0 1.41l4.24 4.24a1 1 0 0 0 1.41 0L14.05 14.76a1 1 0 0 0 0-1.41l-1.06-1.06 1.59-1.59a1 1 0 0 0 0-1.41 1 1 0 0 0-1.41 0z"/>
        </svg>
        Tools Hub
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Your complete academic toolkit. Most tools are FREE with monthly limits. 
        Upgrade for unlimited access and premium features.
      </p>
      
      <!-- Plan Status -->
      {#if !isLoading}
        <div class="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200">
          <div class="w-2 h-2 rounded-full {userPlan === 'free' ? 'bg-green-500' : userPlan === 'professional' ? 'bg-blue-500' : 'bg-purple-500'}"></div>
          <span class="text-sm font-medium text-gray-700">
            {userPlan === 'free' ? 'Free Plan' : userPlan === 'professional' ? 'Professional Plan' : 'Elite Plan'}
          </span>
          {#if userPlan === 'free'}
            <a href="/pricing" class="text-blue-600 hover:text-blue-800 text-sm font-medium ml-2">Upgrade →</a>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Statistics Overview -->
    {#if !isLoading && userPlan === 'free'}
      <div class="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div class="text-center">
          <h3 class="text-lg font-semibold text-blue-900 mb-2 flex items-center justify-center gap-2">
            <svg class="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            This Month's Usage
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div class="text-2xl font-bold text-blue-600">{(usage.sops_created || 0) + (usage.cover_letters_created || 0) + (usage.personal_statements_created || 0) + (usage.academic_cvs_created || 0)}</div>
              <div class="text-sm text-blue-700">Documents Created</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-blue-600">{(usage.reviews || 0) + (usage.text_enhancements || 0) + (usage.word_optimizations || 0)}</div>
              <div class="text-sm text-blue-700">AI Enhancements Used</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-blue-600">{usage.university_matching || 0}</div>
              <div class="text-sm text-blue-700">University Searches</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-blue-600">{usage.cold_emails_created || 0}</div>
              <div class="text-sm text-blue-700">Cold Emails</div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Category Filter -->
    <div class="mb-8">
      <div class="flex flex-wrap justify-center gap-2">
        <button
          onclick={() => selectedCategory = 'all'}
          class="px-4 py-2 rounded-full border transition-all {
            selectedCategory === 'all' 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
          }"
        >
          All Tools ({allTools.length})
        </button>
        {#each Object.entries(toolCategories) as [key, category]}
          {@const count = allTools.filter(t => t.category === key).length}
          <button
            onclick={() => selectedCategory = key}
            class="px-4 py-2 rounded-full border transition-all flex items-center gap-2 {
              selectedCategory === key 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
            }"
          >
            <span>{@html category.icon}</span>
            <span>{category.title}</span>
            <span class="text-xs opacity-70">({count})</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Category Description -->
    {#if selectedCategory !== 'all' && toolCategories[selectedCategory as keyof typeof toolCategories]}
      {@const category = toolCategories[selectedCategory as keyof typeof toolCategories]}
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-lg border border-gray-200">
          <span class="text-blue-600 w-8 h-8">{@html category.icon}</span>
          <div class="text-left">
            <h2 class="font-semibold text-gray-900">{category.title}</h2>
            <p class="text-sm text-gray-600">{category.description}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Loading State -->
    {#if isLoading}
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading tools...</span>
      </div>
    {:else}
      <!-- Tools Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredTools as tool (tool.id)}
          {@const tierBadge = getTierBadge(tool.tier)}
          {@const hasAccess = canAccessTool(tool)}
          {@const usageDisplay = getUsageDisplay(tool)}
          {@const usageExceeded = isUsageExceeded(tool)}
          
          <div class="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 overflow-hidden group {!hasAccess || usageExceeded ? 'opacity-75' : ''}">
            <a 
              href={tool.href}
              onclick={(e) => handleToolClick(tool, e)}
              class="block p-6 {hasAccess && !usageExceeded ? 'hover:bg-gray-50' : ''}"
            >
              <!-- Tool Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="text-blue-600 w-8 h-8 {hasAccess && !usageExceeded ? 'opacity-100' : 'opacity-50'}">{@html tool.icon}</div>
                  <div>
                    <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h3>
                    <span class="inline-block px-2 py-1 text-xs font-medium rounded-full {tierBadge.class}">
                      {tierBadge.text}
                    </span>
                  </div>
                </div>
                
                <!-- Access Indicator -->
                {#if !hasAccess}
                  <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                  </svg>
                {:else if usageExceeded}
                  <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"></path>
                  </svg>
                {/if}
              </div>

              <!-- Description -->
              <p class="text-gray-600 text-sm mb-4">
                {tool.description}
              </p>

              <!-- Features -->
              <div class="mb-4">
                <ul class="text-xs text-gray-500 space-y-1">
                  {#each tool.features as feature}
                    <li class="flex items-center gap-2">
                      <svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      {feature}
                    </li>
                  {/each}
                </ul>
              </div>

              <!-- Usage Display -->
              {#if usageDisplay}
                <div class="mb-3">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getUsageBadgeColor(tool)}">
                    {usageDisplay}
                  </span>
                </div>
              {/if}

              <!-- Status Information -->
              {#if usageExceeded}
                <div class="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  Limit reached - Upgrade for more
                </div>
              {:else if tool.limitation && hasAccess}
                <div class="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Limit: {tool.limitation}
                </div>
              {:else if tool.premium_features && hasAccess}
                <div class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Premium: {tool.premium_features.join(', ')}
                </div>
              {:else if !hasAccess}
                <div class="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  Requires: {tool.plan_required} plan
                </div>
              {/if}
            </a>
          </div>
        {/each}
      </div>

      <!-- Summary Info -->
      <div class="mt-12 text-center bg-white rounded-lg p-8 border border-gray-200">
        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 21H6.2a2.2 2.2 0 0 1-2.2-2.2V3h17v18z"/>
            <path d="M7 16l3-3 3 3 4-4"/>
          </svg>
          Platform Summary
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div class="text-3xl font-bold text-green-600">{allTools.filter(t => t.tier === 'free').length}</div>
            <div class="text-gray-600">Completely Free Tools</div>
            <div class="text-xs text-gray-500 mt-1">No limits, always available</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-blue-600">{allTools.filter(t => t.tier === 'limited').length}</div>
            <div class="text-gray-600">Limited Free Tools</div>
            <div class="text-xs text-gray-500 mt-1">Free with monthly limits</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-purple-600">{allTools.filter(t => t.tier === 'premium').length}</div>
            <div class="text-gray-600">Premium Only Tools</div>
            <div class="text-xs text-gray-500 mt-1">Professional plan required</div>
          </div>
        </div>
      </div>

      <!-- Upgrade CTA -->
      {#if userPlan === 'free'}
        <div class="mt-12 text-center">
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
            <h2 class="text-2xl font-bold mb-4 flex items-center justify-center gap-3">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Unlock Unlimited Access
            </h2>
            <p class="text-blue-100 mb-6 max-w-2xl mx-auto">
              Most tools are already FREE! Upgrade to remove monthly limits and get access to premium features.
              Perfect for serious applicants who want unlimited usage.
            </p>
            <div class="flex justify-center gap-4">
              <a 
                href="/pricing"
                class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Pricing Plans
              </a>
              <a 
                href="/account"
                class="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Check Usage Stats
              </a>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>