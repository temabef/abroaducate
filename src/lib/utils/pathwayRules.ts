/**
 * Pathway Rules Knowledge Base
 * Defines document requirements and pathway-specific guidance for different
 * educational pathways across countries
 */

export type PathwayType = 
  | 'BSc_to_PhD' 
  | 'BSc_to_MSc_to_PhD' 
  | 'BSc_to_MSc' 
  | 'MSc_to_PhD'
  | 'BSc_to_PhD_with_MSc_included';

export type DocumentType = 
  | 'bachelor_transcript'
  | 'master_transcript'
  | 'sop_research'
  | 'sop_masters'
  | 'rec_letters'
  | 'cv_academic'
  | 'cv_professional'
  | 'gre'
  | 'writing_sample'
  | 'research_proposal';

export interface PathwayRule {
  pathway: PathwayType;
  country: string;
  conditions: {
    transcript_bachelor_required: boolean;
    transcript_master_required: boolean;
    transcript_master_reason?: string; // Explanation if not required
    english_test_required_from: string[]; // Countries that need it
    english_test_waived_for: string[]; // Countries exempt
    documents_needed: DocumentType[];
    documents_optional: DocumentType[];
    timeline_months: number;
    application_deadline_range: string;
    funding_typical: string;
  };
  explanation: string; // User-friendly explanation
  alternatives?: PathwayType[]; // Other pathways to consider
}

/**
 * Pathway Rules Database
 * Maps pathway + country combinations to specific requirements
 */
export const PATHWAY_RULES: PathwayRule[] = [
  // USA - Direct BSc to PhD (most common)
  {
    pathway: 'BSc_to_PhD',
    country: 'United States',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'You\'ll earn your Master\'s within the PhD program (years 1-2)',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: ['Nigeria', 'Ghana', 'India', 'Kenya', 'South Africa', 'Philippines'],
      documents_needed: ['bachelor_transcript', 'sop_research', 'rec_letters', 'cv_academic'],
      documents_optional: ['gre', 'writing_sample', 'research_proposal'],
      timeline_months: 72, // 5-6 years
      application_deadline_range: 'Jan-Mar',
      funding_typical: '100% (Full funding common - TA/RA positions)'
    },
    explanation: 'Most US PhD programs include Master\'s coursework in the first 1-2 years. You\'ll receive a Master\'s degree as part of your PhD journey, so you don\'t need a separate Master\'s transcript to apply.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // USA - BSc to Master's
  {
    pathway: 'BSc_to_MSc',
    country: 'United States',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'You don\'t have a Master\'s yet - that\'s expected when applying for Master\'s programs',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: ['Nigeria', 'Ghana', 'India', 'Kenya', 'South Africa', 'Philippines'],
      documents_needed: ['bachelor_transcript', 'sop_masters', 'rec_letters', 'cv_professional'],
      documents_optional: ['gre'],
      timeline_months: 24, // 2 years
      application_deadline_range: 'Dec-Feb',
      funding_typical: 'Partial to Full (varies by program)'
    },
    explanation: 'For Master\'s applications, you only need your Bachelor\'s transcript. You don\'t have a Master\'s degree yet - that\'s what you\'re applying for!',
    alternatives: ['BSc_to_PhD']
  },
  
  // UK - BSc to PhD (less common, usually Master's first)
  {
    pathway: 'BSc_to_PhD',
    country: 'United Kingdom',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'Some UK programs accept direct entry, but Master\'s is typically preferred',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'],
      documents_needed: ['bachelor_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: ['writing_sample'],
      timeline_months: 36, // 3-4 years
      application_deadline_range: 'Jan-Mar',
      funding_typical: 'Partial to Full (competitive)'
    },
    explanation: 'UK PhD programs often prefer candidates with a Master\'s degree, but some accept direct entry with a strong Bachelor\'s and research experience. Consider a Conversion Master\'s (1 year) first if your field is different.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // UK - BSc to Master's to PhD
  {
    pathway: 'BSc_to_MSc_to_PhD',
    country: 'United Kingdom',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: true,
      transcript_master_reason: 'You\'ll need both transcripts when applying for PhD after completing Master\'s',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'],
      documents_needed: ['bachelor_transcript', 'master_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: ['writing_sample'],
      timeline_months: 60, // 1 year Master's + 3-4 years PhD
      application_deadline_range: 'Jan-Mar',
      funding_typical: 'Partial to Full (competitive)'
    },
    explanation: 'The UK typically follows a two-stage pathway: Master\'s first (1 year), then PhD (3-4 years). You\'ll need both transcripts when applying for the PhD.',
    alternatives: ['BSc_to_PhD']
  },
  
  // Canada - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Canada',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'Canadian PhD programs often include Master\'s coursework (years 1-2)',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'],
      documents_needed: ['bachelor_transcript', 'sop_research', 'rec_letters', 'cv_academic'],
      documents_optional: ['gre', 'research_proposal'],
      timeline_months: 60, // 4-5 years
      application_deadline_range: 'Dec-Feb',
      funding_typical: 'Full (TA/RA positions common)'
    },
    explanation: 'Similar to the US, many Canadian PhD programs include Master\'s-level coursework in the first 1-2 years. You\'ll earn a Master\'s as part of your PhD journey.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Germany - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Germany',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'Some programs accept direct entry, but Master\'s is typically preferred',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: [],
      timeline_months: 36, // 3-4 years
      application_deadline_range: 'Varies by program',
      funding_typical: 'Full (paid positions common)'
    },
    explanation: 'German PhD programs (Promotion) typically prefer candidates with a Master\'s degree, though some accept strong Bachelor\'s candidates. Most programs are research-focused with paid positions.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Australia - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Australia',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'Australian PhD programs often include Master\'s coursework (years 1-2)',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'],
      documents_needed: ['bachelor_transcript', 'sop_research', 'rec_letters', 'cv_academic'],
      documents_optional: ['research_proposal'],
      timeline_months: 48, // 3-4 years
      application_deadline_range: 'Varies by university',
      funding_typical: 'Full (RTP scholarships common)'
    },
    explanation: 'Australian PhD programs typically include Master\'s-level coursework in the first 1-2 years. You\'ll receive a Master\'s degree as part of your PhD journey.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Netherlands - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Netherlands',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: true,
      transcript_master_reason: 'Dutch PhD programs typically require a Master\'s degree first',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'master_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: [],
      timeline_months: 48, // 3-4 years
      application_deadline_range: 'Varies by program',
      funding_typical: 'Full (paid positions common)'
    },
    explanation: 'Dutch PhD programs (Promotie) typically require a Master\'s degree first. You\'ll need both transcripts. Most positions are paid research positions.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Netherlands - BSc to Master's
  {
    pathway: 'BSc_to_MSc',
    country: 'Netherlands',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'You don\'t have a Master\'s yet - that\'s what you\'re applying for',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'sop_masters', 'rec_letters', 'cv_professional'],
      documents_optional: [],
      timeline_months: 24, // 1-2 years
      application_deadline_range: 'Apr-Jun (varies)',
      funding_typical: 'Partial to Full (scholarships available)'
    },
    explanation: 'Dutch Master\'s programs are typically 1-2 years. You only need your Bachelor\'s transcript to apply.',
    alternatives: []
  },
  
  // France - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'France',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: true,
      transcript_master_reason: 'French PhD programs typically require a Master\'s degree (M2)',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'master_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: [],
      timeline_months: 36, // 3 years
      application_deadline_range: 'Varies by program',
      funding_typical: 'Full (funded positions common)'
    },
    explanation: 'French PhD programs typically require a Master\'s degree (M2) first. You\'ll need both transcripts. Many programs are fully funded.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // France - BSc to Master's
  {
    pathway: 'BSc_to_MSc',
    country: 'France',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'You don\'t have a Master\'s yet - that\'s what you\'re applying for',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'sop_masters', 'rec_letters', 'cv_professional'],
      documents_optional: [],
      timeline_months: 24, // 1-2 years
      application_deadline_range: 'Mar-May',
      funding_typical: 'Low tuition + scholarships available'
    },
    explanation: 'French Master\'s programs are typically 1-2 years. Public universities have very low tuition fees. You only need your Bachelor\'s transcript.',
    alternatives: []
  },
  
  // Italy - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Italy',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: true,
      transcript_master_reason: 'Italian PhD programs typically require a Master\'s degree (Laurea Magistrale)',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'master_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: [],
      timeline_months: 36, // 3 years
      application_deadline_range: 'Varies by program',
      funding_typical: 'Full (scholarships available)'
    },
    explanation: 'Italian PhD programs (Dottorato) typically require a Master\'s degree (Laurea Magistrale) first. You\'ll need both transcripts.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Spain - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Spain',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: true,
      transcript_master_reason: 'Spanish PhD programs require a Master\'s degree first',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'master_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: [],
      timeline_months: 36, // 3-4 years
      application_deadline_range: 'Varies by program',
      funding_typical: 'Partial to Full (scholarships available)'
    },
    explanation: 'Spanish PhD programs require a Master\'s degree first. You\'ll need both transcripts. Scholarships are available but competitive.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Sweden - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Sweden',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: true,
      transcript_master_reason: 'Swedish PhD programs typically require a Master\'s degree first',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'master_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: [],
      timeline_months: 48, // 4 years
      application_deadline_range: 'Varies by program',
      funding_typical: 'Full (paid positions common)'
    },
    explanation: 'Swedish PhD programs typically require a Master\'s degree first. Most positions are paid (employment contracts). You\'ll need both transcripts.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Norway - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Norway',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: true,
      transcript_master_reason: 'Norwegian PhD programs require a Master\'s degree first',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'master_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: [],
      timeline_months: 36, // 3 years
      application_deadline_range: 'Varies by program',
      funding_typical: 'Full (paid positions)'
    },
    explanation: 'Norwegian PhD programs require a Master\'s degree first. Positions are typically paid (employment contracts). You\'ll need both transcripts.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Denmark - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Denmark',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: true,
      transcript_master_reason: 'Danish PhD programs require a Master\'s degree first',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'master_transcript', 'sop_research', 'rec_letters', 'cv_academic', 'research_proposal'],
      documents_optional: [],
      timeline_months: 36, // 3 years
      application_deadline_range: 'Varies by program',
      funding_typical: 'Full (paid positions)'
    },
    explanation: 'Danish PhD programs require a Master\'s degree first. Positions are typically paid (employment contracts). You\'ll need both transcripts.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Turkey - BSc to PhD
  {
    pathway: 'BSc_to_PhD',
    country: 'Turkey',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'Turkish PhD programs may accept direct entry, but Master\'s is typically preferred',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'sop_research', 'rec_letters', 'cv_academic'],
      documents_optional: ['master_transcript', 'research_proposal'],
      timeline_months: 48, // 4 years
      application_deadline_range: 'Varies by program',
      funding_typical: 'Full (Türkiye Scholarships)'
    },
    explanation: 'Turkish PhD programs may accept direct entry from Bachelor\'s, but a Master\'s is typically preferred. Türkiye Scholarships offer full funding.',
    alternatives: ['BSc_to_MSc_to_PhD']
  },
  
  // Generic fallback for countries not in database
  {
    pathway: 'BSc_to_PhD',
    country: 'OTHER',
    conditions: {
      transcript_bachelor_required: true,
      transcript_master_required: false,
      transcript_master_reason: 'Requirements vary by country and program. Contact us for specific guidance.',
      english_test_required_from: ['non_english_speaking'],
      english_test_waived_for: [],
      documents_needed: ['bachelor_transcript', 'sop_research', 'rec_letters', 'cv_academic'],
      documents_optional: ['research_proposal'],
      timeline_months: 48,
      application_deadline_range: 'Varies',
      funding_typical: 'Varies by country'
    },
    explanation: 'We\'re still gathering specific pathway data for this country. Contact us for personalized guidance based on your situation.',
    alternatives: []
  }
];

/**
 * Get pathway rule for a specific pathway and country
 */
export function getPathwayRule(
  pathway: PathwayType,
  country: string
): PathwayRule | null {
  // First try exact match
  const exactMatch = PATHWAY_RULES.find(
    rule => rule.pathway === pathway && rule.country === country
  );
  
  if (exactMatch) return exactMatch;
  
  // Try OTHER fallback
  const fallback = PATHWAY_RULES.find(
    rule => rule.pathway === pathway && rule.country === 'OTHER'
  );
  
  return fallback || null;
}

/**
 * Get all pathway rules for a country
 */
export function getPathwayRulesForCountry(country: string): PathwayRule[] {
  return PATHWAY_RULES.filter(
    rule => rule.country === country || rule.country === 'OTHER'
  );
}

/**
 * Determine pathway type from diagnostic data
 */
export function determinePathway(data: {
  currentEducationLevel?: string;
  degreeLevel?: string;
  pathwayPreference?: string;
  hasMastersTranscript?: boolean;
}): PathwayType | null {
  const { currentEducationLevel, degreeLevel, pathwayPreference, hasMastersTranscript } = data;
  
  // If user wants Master's
  if (degreeLevel === 'masters') {
    return 'BSc_to_MSc';
  }
  
  // If user wants PhD
  if (degreeLevel === 'phd') {
    // Check if they have Master's already
    if (hasMastersTranscript || currentEducationLevel === 'master_completed') {
      return 'MSc_to_PhD';
    }
    
    // Check pathway preference
    if (pathwayPreference === 'direct_phd') {
      return 'BSc_to_PhD';
    } else if (pathwayPreference === 'masters_first') {
      return 'BSc_to_MSc_to_PhD';
    } else {
      // Default to direct PhD (most common)
      return 'BSc_to_PhD';
    }
  }
  
  return null;
}

/**
 * Get document requirements for a pathway
 */
export function getDocumentRequirements(
  pathway: PathwayType,
  country: string
): {
  required: DocumentType[];
  optional: DocumentType[];
  transcriptInfo: {
    bachelor: boolean;
    master: boolean;
    masterReason?: string;
  };
} {
  const rule = getPathwayRule(pathway, country);
  
  if (!rule) {
    // Default requirements
    return {
      required: ['bachelor_transcript', 'sop_research', 'rec_letters'],
      optional: [],
      transcriptInfo: {
        bachelor: true,
        master: false,
        masterReason: 'Contact us for specific requirements'
      }
    };
  }
  
  return {
    required: rule.conditions.documents_needed,
    optional: rule.conditions.documents_optional,
    transcriptInfo: {
      bachelor: rule.conditions.transcript_bachelor_required,
      master: rule.conditions.transcript_master_required,
      masterReason: rule.conditions.transcript_master_reason
    }
  };
}
