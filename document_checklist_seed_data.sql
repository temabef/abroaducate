-- Seed data for Document Checklists
-- US-focused checklists to start with

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

-- UK Document Checklists
INSERT INTO public.document_checklists (country, category, name, description, checklist_type, priority_level, estimated_time_hours, items, tips_and_notes, created_at, updated_at) VALUES 

-- UK Student Visa (Tier 4/Student Route)
('UK', 'visa_application', 'UK Student Visa (Student Route)', 'Complete checklist for UK Student Route visa application', 'general', 'high', 8, 
'[
  {
    "id": "cas_letter",
    "title": "Confirmation of Acceptance for Studies (CAS)",
    "description": "Valid CAS letter from your UK institution",
    "required": true,
    "category": "documents"
  },
  {
    "id": "passport",
    "title": "Valid Passport",
    "description": "Passport with at least 6 months validity",
    "required": true,
    "category": "documents"
  },
  {
    "id": "financial_evidence",
    "title": "Financial Evidence",
    "description": "Bank statements showing £1,334/month for living costs (London) or £1,023/month (outside London) plus tuition fees",
    "required": true,
    "category": "financial"
  },
  {
    "id": "atas_certificate",
    "title": "ATAS Certificate (if required)",
    "description": "Academic Technology Approval Scheme certificate for certain subjects",
    "required": false,
    "category": "documents"
  },
  {
    "id": "english_proficiency",
    "title": "English Language Proficiency",
    "description": "IELTS, TOEFL, or other accepted English test results",
    "required": true,
    "category": "academic"
  },
  {
    "id": "tb_test",
    "title": "Tuberculosis Test (if required)",
    "description": "TB test results if from a country where this is required",
    "required": false,
    "category": "medical"
  },
  {
    "id": "visa_application_form",
    "title": "Online Visa Application",
    "description": "Completed online visa application form",
    "required": true,
    "category": "application"
  },
  {
    "id": "biometric_appointment",
    "title": "Biometric Appointment",
    "description": "Schedule and attend biometric appointment at VFS Global or similar",
    "required": true,
    "category": "application"
  },
  {
    "id": "immigration_health_surcharge",
    "title": "Immigration Health Surcharge",
    "description": "Pay IHS for access to NHS during your stay",
    "required": true,
    "category": "payment"
  },
  {
    "id": "academic_transcripts",
    "title": "Academic Transcripts",
    "description": "Official transcripts from previous education",
    "required": true,
    "category": "academic"
  }
]'::json, 
'[
  "Apply as early as possible - processing can take 3-8 weeks",
  "Financial evidence must be in your name and show funds held for 28 consecutive days",
  "Check if your country requires additional documents like TB tests",
  "Keep all original documents safe - you may need them at the border",
  "Consider using the priority or super priority service if time is critical"
]'::json, NOW(), NOW()),

-- UK University Enrollment
('UK', 'enrollment', 'UK University Enrollment Process', 'Essential documents and steps for enrolling at your UK university', 'general', 'high', 6,
'[
  {
    "id": "acceptance_letter",
    "title": "University Acceptance Letter",
    "description": "Official acceptance letter from your UK university",
    "required": true,
    "category": "documents"
  },
  {
    "id": "passport_copy",
    "title": "Passport Copy",
    "description": "Certified copy of your passport and visa",
    "required": true,
    "category": "documents"
  },
  {
    "id": "academic_certificates",
    "title": "Academic Certificates",
    "description": "Original or certified copies of previous academic qualifications",
    "required": true,
    "category": "academic"
  },
  {
    "id": "english_test_results",
    "title": "English Test Results",
    "description": "Official IELTS, TOEFL, or other English proficiency test results",
    "required": true,
    "category": "academic"
  },
  {
    "id": "tuition_payment",
    "title": "Tuition Fee Payment",
    "description": "Payment of deposit or full tuition fees as required",
    "required": true,
    "category": "financial"
  },
  {
    "id": "accommodation_booking",
    "title": "Accommodation Booking",
    "description": "University halls or private accommodation confirmation",
    "required": true,
    "category": "housing"
  },
  {
    "id": "registration_completion",
    "title": "Online Registration",
    "description": "Complete online student registration portal",
    "required": true,
    "category": "administrative"
  },
  {
    "id": "student_id_collection",
    "title": "Student ID Card Collection",
    "description": "Collect student ID card during enrollment week",
    "required": true,
    "category": "administrative"
  },
  {
    "id": "council_tax_exemption",
    "title": "Council Tax Exemption Certificate",
    "description": "Obtain certificate confirming student status for council tax exemption",
    "required": true,
    "category": "administrative"
  },
  {
    "id": "gp_registration",
    "title": "GP Registration",
    "description": "Register with a local General Practitioner (GP) for healthcare",
    "required": true,
    "category": "healthcare"
  }
]'::json,
'[
  "Arrive early for enrollment week - popular modules fill up quickly",
  "Bring multiple copies of all documents",
  "Set up a UK bank account as soon as possible",
  "Register with a GP within your first week",
  "Join student societies and clubs during freshers week"
]'::json, NOW(), NOW()),

-- UK Pre-Departure Preparation
('UK', 'pre_departure', 'UK Pre-Departure Preparation', 'Complete preparation checklist before traveling to the UK', 'general', 'medium', 10,
'[
  {
    "id": "visa_approval",
    "title": "Visa Approval Confirmation",
    "description": "Ensure your UK student visa has been approved and received",
    "required": true,
    "category": "documents"
  },
  {
    "id": "flight_booking",
    "title": "Flight Booking",
    "description": "Book flights to arrive before your course start date",
    "required": true,
    "category": "travel"
  },
  {
    "id": "accommodation_confirmation",
    "title": "Accommodation Confirmation",
    "description": "Confirm university halls or private accommodation booking",
    "required": true,
    "category": "housing"
  },
  {
    "id": "travel_insurance",
    "title": "Travel Insurance",
    "description": "Comprehensive travel and health insurance coverage",
    "required": true,
    "category": "insurance"
  },
  {
    "id": "currency_exchange",
    "title": "Currency Exchange",
    "description": "Exchange some money to British Pounds for initial expenses",
    "required": true,
    "category": "financial"
  },
  {
    "id": "international_bank_card",
    "title": "International Bank Card",
    "description": "Notify your bank of travel and ensure international access",
    "required": true,
    "category": "financial"
  },
  {
    "id": "uk_sim_card",
    "title": "UK SIM Card Research",
    "description": "Research UK mobile network providers (EE, Vodafone, Three, O2)",
    "required": true,
    "category": "communication"
  },
  {
    "id": "weather_appropriate_clothing",
    "title": "Weather-Appropriate Clothing",
    "description": "Pack clothing suitable for UK climate including rain gear",
    "required": true,
    "category": "personal"
  },
  {
    "id": "prescription_medications",
    "title": "Prescription Medications",
    "description": "Bring sufficient prescription medications with doctors note",
    "required": false,
    "category": "medical"
  },
  {
    "id": "uk_driving_license_research",
    "title": "Driving License Information",
    "description": "Research requirements for UK driving license if needed",
    "required": false,
    "category": "transportation"
  }
]'::json,
'[
  "Pack essential documents in carry-on luggage",
  "Research your local area and transportation options",
  "Download useful apps like Citymapper for London transport",
  "Bring adapters for UK electrical outlets (Type G)",
  "Consider opening a Monzo or Starling bank account online before arrival"
]'::json, NOW(), NOW()),

-- UK Financial Documentation and Banking
('UK', 'financial_documents', 'UK Financial Documentation & Banking', 'Financial requirements and banking setup for UK students', 'general', 'high', 4,
'[
  {
    "id": "bank_statements",
    "title": "Bank Statements (28 days)",
    "description": "Bank statements showing required funds held for 28 consecutive days",
    "required": true,
    "category": "documents"
  },
  {
    "id": "financial_sponsorship_letter",
    "title": "Financial Sponsorship Letter",
    "description": "Letter from sponsor if someone else is funding your studies",
    "required": false,
    "category": "documents"
  },
  {
    "id": "scholarship_confirmation",
    "title": "Scholarship Confirmation",
    "description": "Official scholarship award letter if applicable",
    "required": false,
    "category": "documents"
  },
  {
    "id": "uk_bank_account_setup",
    "title": "UK Bank Account Setup",
    "description": "Open a UK bank account with letter from university",
    "required": true,
    "category": "banking"
  },
  {
    "id": "international_transfer_setup",
    "title": "International Transfer Setup",
    "description": "Set up international money transfer services (Wise, Remitly)",
    "required": true,
    "category": "banking"
  },
  {
    "id": "student_discount_cards",
    "title": "Student Discount Setup",
    "description": "Register for student discounts (UNiDAYS, Student Beans)",
    "required": false,
    "category": "savings"
  },
  {
    "id": "council_tax_exemption",
    "title": "Council Tax Exemption Application",
    "description": "Apply for council tax exemption as a full-time student",
    "required": true,
    "category": "administrative"
  },
  {
    "id": "part_time_work_eligibility",
    "title": "Part-time Work Eligibility Check",
    "description": "Understand student visa work restrictions (20 hours per week)",
    "required": true,
    "category": "employment"
  },
  {
    "id": "ni_number_application",
    "title": "National Insurance Number",
    "description": "Apply for National Insurance number if planning to work",
    "required": false,
    "category": "employment"
  },
  {
    "id": "budget_planning",
    "title": "Monthly Budget Planning",
    "description": "Create budget for living expenses, transport, and entertainment",
    "required": true,
    "category": "planning"
  }
]'::json,
'[
  "London is significantly more expensive than other UK cities",
  "Student bank accounts often come with benefits and overdrafts",
  "Keep receipts for large purchases - you may get VAT refund when leaving",
  "Many places offer student discounts - always ask and show your student ID",
  "Consider getting a 16-25 Railcard for discounted train travel"
]'::json, NOW(), NOW()); 