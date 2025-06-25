-- Document Checklists System Migration
-- Created: January 2025
-- Description: Zero-cost document checklist feature

-- Main checklists table
CREATE TABLE IF NOT EXISTS public.document_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    country TEXT NOT NULL CHECK (country IN ('US', 'UK', 'Canada', 'Australia')),
    category TEXT NOT NULL CHECK (category IN ('visa_application', 'pre_departure', 'enrollment', 'financial_documents', 'academic_documents')),
    checklist_type TEXT NOT NULL CHECK (checklist_type IN ('general', 'university_specific', 'program_specific')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'undergraduate', 'graduate', 'phd')),
    difficulty_level TEXT DEFAULT 'basic' CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')),
    estimated_time_hours INTEGER DEFAULT 1,
    priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    items JSONB NOT NULL,
    requirements JSONB DEFAULT '[]',
    tips_and_notes JSONB DEFAULT '[]',
    related_links JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User checklist progress tracking
CREATE TABLE IF NOT EXISTS public.user_checklist_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES public.document_checklists(id) ON DELETE CASCADE,
    completed_items JSONB DEFAULT '[]',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT user_checklist_unique UNIQUE (user_id, checklist_id)
);

-- Checklist analytics for usage tracking
CREATE TABLE IF NOT EXISTS public.checklist_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES public.document_checklists(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('viewed', 'started', 'item_completed', 'completed', 'reset')),
    item_id TEXT,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_checklists_country ON public.document_checklists(country);
CREATE INDEX IF NOT EXISTS idx_document_checklists_category ON public.document_checklists(category);
CREATE INDEX IF NOT EXISTS idx_document_checklists_active ON public.document_checklists(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_checklist_progress_user_id ON public.user_checklist_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_progress_checklist_id ON public.user_checklist_progress(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_analytics_user_id ON public.checklist_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_analytics_checklist_id ON public.checklist_analytics(checklist_id);

-- Enable RLS
ALTER TABLE public.document_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read active checklists" ON public.document_checklists
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own checklist progress" ON public.user_checklist_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own checklist analytics" ON public.checklist_analytics
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.document_checklists TO authenticated;
GRANT ALL ON public.user_checklist_progress TO authenticated;
GRANT ALL ON public.checklist_analytics TO authenticated;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_document_checklists_updated_at BEFORE UPDATE ON public.document_checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_checklist_progress_updated_at BEFORE UPDATE ON public.user_checklist_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial US checklist data
INSERT INTO public.document_checklists (name, description, country, category, checklist_type, target_audience, priority_level, estimated_time_hours, items, tips_and_notes, related_links) VALUES
-- US F-1 Visa Application Documents
(
    'US F-1 Visa Application Documents',
    'Complete document checklist for F-1 student visa application to the United States',
    'US',
    'visa_application',
    'general',
    'all',
    'high',
    4,
    '[
        {"id": "i20_form", "title": "Form I-20 (Certificate of Eligibility)", "description": "Original I-20 form issued by your US university", "required": true, "estimated_time_minutes": 0, "category": "official_documents", "tips": "Must be signed by you and DSO"},
        {"id": "ds160_form", "title": "DS-160 Form Confirmation", "description": "Online DS-160 application form confirmation page", "required": true, "estimated_time_minutes": 60, "category": "forms", "tips": "Print confirmation page with barcode"},
        {"id": "passport", "title": "Valid Passport", "description": "Passport valid for at least 6 months beyond intended stay", "required": true, "estimated_time_minutes": 0, "category": "identity_documents", "tips": "Check expiration date and ensure at least 2 blank pages"},
        {"id": "visa_photo", "title": "Visa Photo", "description": "2x2 inch photo meeting US visa photo requirements", "required": true, "estimated_time_minutes": 30, "category": "photos", "tips": "White background, no glasses, recent photo"},
        {"id": "sevis_fee", "title": "SEVIS Fee Receipt", "description": "I-901 SEVIS fee payment confirmation ($350)", "required": true, "estimated_time_minutes": 15, "category": "financial_documents", "tips": "Pay online at fmjfee.com"},
        {"id": "financial_documents", "title": "Financial Support Documents", "description": "Bank statements, sponsor letters, scholarship letters", "required": true, "estimated_time_minutes": 90, "category": "financial_documents", "tips": "Show funds for at least one year"},
        {"id": "academic_transcripts", "title": "Academic Transcripts", "description": "Official transcripts from all previous institutions", "required": true, "estimated_time_minutes": 30, "category": "academic_documents", "tips": "Bring originals and photocopies"},
        {"id": "test_scores", "title": "Standardized Test Scores", "description": "TOEFL, IELTS, GRE, GMAT, SAT scores", "required": false, "estimated_time_minutes": 15, "category": "academic_documents", "tips": "Official score reports only"},
        {"id": "interview_appointment", "title": "Visa Interview Appointment", "description": "Printed confirmation of scheduled interview", "required": true, "estimated_time_minutes": 5, "category": "appointments", "tips": "Arrive 15 minutes early"}
    ]',
    '["Start process 3 months before departure", "Check embassy website for specific requirements", "Keep documents in clear folder", "Practice interview questions"]',
    '[{"title": "US State Department - Student Visas", "url": "https://travel.state.gov/content/travel/en/us-visas/study.html"}, {"title": "SEVIS Fee Payment", "url": "https://www.fmjfee.com/"}, {"title": "DS-160 Application", "url": "https://ceac.state.gov/genniv/"}]'
),

-- US University Enrollment Documents
(
    'US University Enrollment Documents',
    'Essential documents needed to complete enrollment at US universities',
    'US',
    'enrollment',
    'general',
    'all',
    'high',
    3,
    '[
        {"id": "signed_i20", "title": "Signed Form I-20", "description": "I-20 form signed and returned to university", "required": true, "estimated_time_minutes": 10, "category": "official_documents", "tips": "Return within deadline"},
        {"id": "enrollment_deposit", "title": "Enrollment Deposit", "description": "Tuition deposit or enrollment confirmation fee", "required": true, "estimated_time_minutes": 20, "category": "financial_documents", "tips": "Keep receipt as proof"},
        {"id": "housing_application", "title": "Housing Application", "description": "On-campus housing application and deposits", "required": false, "estimated_time_minutes": 45, "category": "housing", "tips": "Apply early"},
        {"id": "health_insurance", "title": "Health Insurance", "description": "Proof of insurance or enrollment in university plan", "required": true, "estimated_time_minutes": 30, "category": "health_documents", "tips": "Usually mandatory"},
        {"id": "immunization_records", "title": "Immunization Records", "description": "Required vaccinations and health clearance", "required": true, "estimated_time_minutes": 60, "category": "health_documents", "tips": "Requirements vary by state"},
        {"id": "orientation_registration", "title": "Orientation Registration", "description": "Registration for international student orientation", "required": true, "estimated_time_minutes": 15, "category": "academic_documents", "tips": "Often mandatory"},
        {"id": "course_registration", "title": "Course Registration", "description": "Register for classes and advisor meeting", "required": true, "estimated_time_minutes": 60, "category": "academic_documents", "tips": "Meet advisor first"}
    ]',
    '["Complete after receiving I-20", "Contact international office for help", "Keep digital and physical receipts", "Check deadlines carefully"]',
    '[{"title": "NAFSA - International Student Resources", "url": "https://www.nafsa.org/"}]'
),

-- US Pre-Departure Checklist
(
    'US Pre-Departure Checklist',
    'Final preparations before traveling to the United States for studies',
    'US',
    'pre_departure',
    'general',
    'all',
    'medium',
    5,
    '[
        {"id": "flight_booking", "title": "Book Flight Tickets", "description": "Book flights arriving before program start", "required": true, "estimated_time_minutes": 90, "category": "travel", "tips": "Arrive 1 week before classes"},
        {"id": "airport_pickup", "title": "Airport Pickup", "description": "Coordinate transportation from airport", "required": false, "estimated_time_minutes": 30, "category": "travel", "tips": "Universities often offer pickup"},
        {"id": "temporary_accommodation", "title": "Temporary Accommodation", "description": "Hotel for first few days if needed", "required": false, "estimated_time_minutes": 45, "category": "housing", "tips": "Useful backup option"},
        {"id": "bank_account_research", "title": "Research US Banks", "description": "Find banks that serve international students", "required": true, "estimated_time_minutes": 60, "category": "financial_documents", "tips": "Special international programs"},
        {"id": "phone_plan", "title": "US Phone Plan", "description": "Research mobile phone service options", "required": true, "estimated_time_minutes": 45, "category": "communication", "tips": "Major carriers: Verizon, AT&T, T-Mobile"},
        {"id": "document_copies", "title": "Document Copies", "description": "Multiple copies of important documents", "required": true, "estimated_time_minutes": 30, "category": "official_documents", "tips": "Keep separate from originals"},
        {"id": "emergency_contacts", "title": "Emergency Contacts", "description": "List of important contacts", "required": true, "estimated_time_minutes": 20, "category": "communication", "tips": "University, embassy, family, medical"},
        {"id": "currency_exchange", "title": "Currency Exchange", "description": "Exchange money to US dollars", "required": true, "estimated_time_minutes": 30, "category": "financial_documents", "tips": "Bring $500-1000 cash"}
    ]',
    '["Start 4-6 weeks before departure", "Check destination weather", "Inform banks about travel", "Learn about US culture"]',
    '[{"title": "EducationUSA Pre-Departure", "url": "https://educationusa.state.gov/"}]'
),

-- US Financial Documentation
(
    'US Financial Documentation for Students',
    'Complete guide to financial documents needed for US study',
    'US',
    'financial_documents',
    'general',
    'all',
    'high',
    6,
    '[
        {"id": "bank_statements", "title": "Bank Statements (6 months)", "description": "Recent statements showing sufficient funds", "required": true, "estimated_time_minutes": 30, "category": "financial_documents", "tips": "English or certified translation"},
        {"id": "sponsor_letter", "title": "Sponsor Affidavit", "description": "Letter from financial sponsor", "required": true, "estimated_time_minutes": 45, "category": "financial_documents", "tips": "Include sponsor ID and income proof"},
        {"id": "scholarship_letters", "title": "Scholarship Award Letters", "description": "Official letters from scholarship providers", "required": false, "estimated_time_minutes": 15, "category": "financial_documents", "tips": "University and external scholarships"},
        {"id": "loan_approval", "title": "Education Loan Approval", "description": "Loan approval and disbursement schedule", "required": false, "estimated_time_minutes": 60, "category": "financial_documents", "tips": "Include loan terms"},
        {"id": "tax_returns", "title": "Income Tax Returns", "description": "Sponsor tax returns (2-3 years)", "required": true, "estimated_time_minutes": 30, "category": "financial_documents", "tips": "May need translation"},
        {"id": "employment_letter", "title": "Employment Verification", "description": "Letter confirming sponsor employment", "required": true, "estimated_time_minutes": 20, "category": "financial_documents", "tips": "Company letterhead with HR contact"},
        {"id": "property_documents", "title": "Property Documents", "description": "Property deeds or valuation certificates", "required": false, "estimated_time_minutes": 45, "category": "financial_documents", "tips": "Strengthens financial position"}
    ]',
    '["Documents within 6 months", "Organize by importance", "Calculate total funds vs I-20 costs", "Consider notarization"]',
    '[{"title": "US Embassy Financial Requirements", "url": "https://travel.state.gov/content/travel/en/us-visas/study.html"}]'
);

-- Add unique constraint to prevent duplicates
ALTER TABLE document_checklists ADD CONSTRAINT unique_category_name UNIQUE (category, name, country); 