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
    items JSONB NOT NULL, -- Array of checklist items with structure
    requirements JSONB DEFAULT '[]', -- Prerequisites for this checklist
    tips_and_notes JSONB DEFAULT '[]', -- Helpful tips for completion
    related_links JSONB DEFAULT '[]', -- Useful external resources
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User checklist progress tracking
CREATE TABLE IF NOT EXISTS public.user_checklist_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES public.document_checklists(id) ON DELETE CASCADE,
    completed_items JSONB DEFAULT '[]', -- Array of completed item IDs
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    notes TEXT, -- User's personal notes
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one progress record per user per checklist
    CONSTRAINT user_checklist_unique UNIQUE (user_id, checklist_id)
);

-- Checklist analytics for usage tracking
CREATE TABLE IF NOT EXISTS public.checklist_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES public.document_checklists(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('viewed', 'started', 'item_completed', 'completed', 'reset')),
    item_id TEXT, -- Specific item if action is item-related
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

-- Insert US-focused document checklists (starting with 4 core checklists)

-- 1. US F-1 Visa Application Documents
INSERT INTO public.document_checklists (name, description, country, category, checklist_type, target_audience, priority_level, estimated_time_hours, items, tips_and_notes, related_links) VALUES
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
        {
            "id": "i20_form",
            "title": "Form I-20 (Certificate of Eligibility)",
            "description": "Original I-20 form issued by your US university",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "official_documents",
            "tips": "Must be signed by you and DSO (Designated School Official)"
        },
        {
            "id": "ds160_form",
            "title": "DS-160 Form Confirmation",
            "description": "Online DS-160 application form confirmation page",
            "required": true,
            "estimated_time_minutes": 60,
            "category": "forms",
            "tips": "Print confirmation page with barcode after completing online"
        },
        {
            "id": "passport",
            "title": "Valid Passport",
            "description": "Passport valid for at least 6 months beyond intended stay",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "identity_documents",
            "tips": "Check expiration date and ensure at least 2 blank pages"
        },
        {
            "id": "visa_photo",
            "title": "Visa Photo",
            "description": "2x2 inch photo meeting US visa photo requirements",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "photos",
            "tips": "White background, no glasses, recent photo (taken within 6 months)"
        },
        {
            "id": "sevis_fee",
            "title": "SEVIS Fee Receipt",
            "description": "I-901 SEVIS fee payment confirmation ($350)",
            "required": true,
            "estimated_time_minutes": 15,
            "category": "financial_documents",
            "tips": "Pay online at fmjfee.com and print receipt"
        },
        {
            "id": "financial_documents",
            "title": "Financial Support Documents",
            "description": "Bank statements, sponsor letters, scholarship letters",
            "required": true,
            "estimated_time_minutes": 90,
            "category": "financial_documents",
            "tips": "Documents should show funds for at least one year of study"
        },
        {
            "id": "academic_transcripts",
            "title": "Academic Transcripts",
            "description": "Official transcripts from all previous educational institutions",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "academic_documents",
            "tips": "Bring both originals and photocopies"
        },
        {
            "id": "test_scores",
            "title": "Standardized Test Scores",
            "description": "TOEFL, IELTS, GRE, GMAT, SAT scores as applicable",
            "required": false,
            "estimated_time_minutes": 15,
            "category": "academic_documents",
            "tips": "Bring official score reports, not photocopies"
        },
        {
            "id": "interview_appointment",
            "title": "Visa Interview Appointment Confirmation",
            "description": "Printed confirmation of your scheduled visa interview",
            "required": true,
            "estimated_time_minutes": 5,
            "category": "appointments",
            "tips": "Arrive 15 minutes early to your appointment"
        }
    ]',
    '[
        "Start this process at least 3 months before your intended departure",
        "Check the US embassy website for country-specific requirements",
        "Keep all original documents in a clear folder for easy access",
        "Practice common visa interview questions beforehand"
    ]',
    '[
        {
            "title": "US State Department - Student Visas",
            "url": "https://travel.state.gov/content/travel/en/us-visas/study.html"
        },
        {
            "title": "SEVIS Fee Payment",
            "url": "https://www.fmjfee.com/"
        },
        {
            "title": "DS-160 Online Application",
            "url": "https://ceac.state.gov/genniv/"
        }
    ]'
),

-- 2. US University Enrollment Documents
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
        {
            "id": "signed_i20",
            "title": "Signed Form I-20",
            "description": "I-20 form signed by you and returned to university",
            "required": true,
            "estimated_time_minutes": 10,
            "category": "official_documents",
            "tips": "Sign and return within deadline specified by university"
        },
        {
            "id": "enrollment_deposit",
            "title": "Enrollment Deposit",
            "description": "Tuition deposit or enrollment confirmation fee",
            "required": true,
            "estimated_time_minutes": 20,
            "category": "financial_documents",
            "tips": "Keep receipt as proof of payment"
        },
        {
            "id": "housing_application",
            "title": "Housing Application",
            "description": "On-campus housing application and deposits",
            "required": false,
            "estimated_time_minutes": 45,
            "category": "housing",
            "tips": "Apply early as housing fills up quickly"
        },
        {
            "id": "health_insurance",
            "title": "Health Insurance Waiver/Enrollment",
            "description": "Proof of health insurance or enrollment in university plan",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "health_documents",
            "tips": "Most universities require mandatory health insurance"
        },
        {
            "id": "immunization_records",
            "title": "Immunization Records",
            "description": "Required vaccinations and health clearance",
            "required": true,
            "estimated_time_minutes": 60,
            "category": "health_documents",
            "tips": "Check university requirements as they vary by state"
        },
        {
            "id": "orientation_registration",
            "title": "Orientation Registration",
            "description": "Registration for international student orientation",
            "required": true,
            "estimated_time_minutes": 15,
            "category": "academic_documents",
            "tips": "Orientation is often mandatory for international students"
        },
        {
            "id": "course_registration",
            "title": "Course Registration",
            "description": "Register for classes and academic advisor meeting",
            "required": true,
            "estimated_time_minutes": 60,
            "category": "academic_documents",
            "tips": "Meet with academic advisor before registering"
        }
    ]',
    '[
        "Complete these steps as soon as you receive your I-20",
        "Contact the international student office if you have questions",
        "Keep digital and physical copies of all receipts",
        "Check university-specific deadlines carefully"
    ]',
    '[
        {
            "title": "NAFSA - International Student Resources",
            "url": "https://www.nafsa.org/about/about-international-education/international-students"
        }
    ]'
),

-- 3. US Pre-Departure Checklist
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
        {
            "id": "flight_booking",
            "title": "Book Flight Tickets",
            "description": "Book flights arriving before program start date",
            "required": true,
            "estimated_time_minutes": 90,
            "category": "travel",
            "tips": "Arrive at least 1 week before classes start"
        },
        {
            "id": "airport_pickup",
            "title": "Arrange Airport Pickup",
            "description": "Coordinate transportation from airport to accommodation",
            "required": false,
            "estimated_time_minutes": 30,
            "category": "travel",
            "tips": "Many universities offer pickup services for new students"
        },
        {
            "id": "temporary_accommodation",
            "title": "Temporary Accommodation",
            "description": "Book hotel or temporary stay for first few days",
            "required": false,
            "estimated_time_minutes": 45,
            "category": "housing",
            "tips": "Useful if permanent housing is not immediately available"
        },
        {
            "id": "bank_account_research",
            "title": "Research US Bank Accounts",
            "description": "Identify banks near campus that serve international students",
            "required": true,
            "estimated_time_minutes": 60,
            "category": "financial_documents",
            "tips": "Some banks have special programs for international students"
        },
        {
            "id": "phone_plan",
            "title": "US Phone Plan",
            "description": "Research and plan for US mobile phone service",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "communication",
            "tips": "Consider major carriers: Verizon, AT&T, T-Mobile"
        },
        {
            "id": "important_documents_copies",
            "title": "Document Copies",
            "description": "Make multiple copies of all important documents",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "official_documents",
            "tips": "Keep copies separate from originals when traveling"
        },
        {
            "id": "emergency_contacts",
            "title": "Emergency Contact List",
            "description": "Compile list of important contacts in US and home country",
            "required": true,
            "estimated_time_minutes": 20,
            "category": "communication",
            "tips": "Include university, embassy, family, and medical contacts"
        },
        {
            "id": "currency_exchange",
            "title": "Initial Currency Exchange",
            "description": "Exchange some money to US dollars for immediate expenses",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "financial_documents",
            "tips": "Bring $500-1000 in cash for first few days"
        }
    ]',
    '[
        "Start preparations 4-6 weeks before departure",
        "Check weather in your destination city and pack accordingly",
        "Inform your home country bank about travel to avoid card blocks",
        "Consider learning about US culture and social norms"
    ]',
    '[
        {
            "title": "EducationUSA Pre-Departure Guide",
            "url": "https://educationusa.state.gov/"
        }
    ]'
),

-- 4. US Financial Documentation
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
        {
            "id": "bank_statements",
            "title": "Bank Statements (Last 6 months)",
            "description": "Recent bank statements showing sufficient funds",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "financial_documents",
            "tips": "Statements should be in English or with certified translation"
        },
        {
            "id": "sponsor_letter",
            "title": "Sponsor Affidavit of Support",
            "description": "Letter from financial sponsor confirming support",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "financial_documents",
            "tips": "Include sponsor ID, income proof, and relationship to student"
        },
        {
            "id": "scholarship_letters",
            "title": "Scholarship Award Letters",
            "description": "Official letters from scholarship providers",
            "required": false,
            "estimated_time_minutes": 15,
            "category": "financial_documents",
            "tips": "Include both university and external scholarships"
        },
        {
            "id": "loan_approval",
            "title": "Education Loan Approval",
            "description": "Loan approval letters and disbursement schedule",
            "required": false,
            "estimated_time_minutes": 60,
            "category": "financial_documents",
            "tips": "Include details about loan terms and disbursement"
        },
        {
            "id": "income_tax_returns",
            "title": "Income Tax Returns",
            "description": "Tax returns of sponsor (last 2-3 years)",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "financial_documents",
            "tips": "May need certified translation if not in English"
        },
        {
            "id": "employment_letter",
            "title": "Employment Verification Letter",
            "description": "Letter from sponsor employer confirming position and salary",
            "required": true,
            "estimated_time_minutes": 20,
            "category": "financial_documents",
            "tips": "Should be on company letterhead with HR contact"
        },
        {
            "id": "property_documents",
            "title": "Property Ownership Documents",
            "description": "Property deeds or valuation certificates (if applicable)",
            "required": false,
            "estimated_time_minutes": 45,
            "category": "financial_documents",
            "tips": "Can strengthen financial position but not always required"
        }
    ]',
    '[
        "All financial documents should be recent (within 6 months)",
        "Organize documents in order of importance",
        "Calculate total available funds and compare with I-20 cost estimates",
        "Consider getting documents notarized for additional authenticity"
    ]',
    '[
        {
            "title": "US Embassy Financial Requirements",
            "url": "https://travel.state.gov/content/travel/en/us-visas/study.html"
        }
    ]'
); 