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

-- ===========================================
-- CANADA DOCUMENT CHECKLISTS
-- ===========================================

-- Canada Study Permit Application Documents
INSERT INTO public.document_checklists (name, description, country, category, checklist_type, target_audience, priority_level, estimated_time_hours, items, tips_and_notes, related_links) VALUES
(
    'Canada Study Permit Application Documents',
    'Complete document checklist for Canadian study permit application',
    'Canada',
    'visa_application',
    'general',
    'all',
    'high',
    5,
    '[
        {
            "id": "letter_of_acceptance",
            "title": "Letter of Acceptance",
            "description": "Original letter of acceptance from a Designated Learning Institution (DLI)",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "official_documents",
            "tips": "Must be from a DLI with valid DLI number"
        },
        {
            "id": "proof_of_identity",
            "title": "Proof of Identity",
            "description": "Valid passport or travel document",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "identity_documents",
            "tips": "Passport must be valid for duration of study"
        },
        {
            "id": "proof_of_financial_support",
            "title": "Proof of Financial Support",
            "description": "Bank statements, GIC, scholarship letters showing required funds",
            "required": true,
            "estimated_time_minutes": 60,
            "category": "financial_documents",
            "tips": "CAD $10,000 per year plus tuition fees required"
        },
        {
            "id": "statement_of_purpose",
            "title": "Statement of Purpose",
            "description": "Letter explaining purpose of study and plans after graduation",
            "required": true,
            "estimated_time_minutes": 120,
            "category": "essays",
            "tips": "Explain ties to home country and intention to return"
        },
        {
            "id": "language_proficiency",
            "title": "Language Proficiency Test",
            "description": "IELTS, TOEFL, or other accepted English/French test results",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "test_scores",
            "tips": "Required even if studying in English-speaking country"
        },
        {
            "id": "medical_exam",
            "title": "Medical Examination",
            "description": "Immigration medical exam from panel physician if required",
            "required": false,
            "estimated_time_minutes": 180,
            "category": "medical_documents",
            "tips": "Required for stays over 6 months from certain countries"
        },
        {
            "id": "police_certificate",
            "title": "Police Certificate",
            "description": "Police clearance certificate from home country",
            "required": false,
            "estimated_time_minutes": 30,
            "category": "background_documents",
            "tips": "Required if stayed in other countries for 6+ months"
        },
        {
            "id": "quebec_acceptance_certificate",
            "title": "Quebec Acceptance Certificate (CAQ)",
            "description": "Certificate d acceptation du Québec for Quebec institutions",
            "required": false,
            "estimated_time_minutes": 45,
            "category": "provincial_documents",
            "tips": "Only required for studies in Quebec province"
        },
        {
            "id": "family_information_form",
            "title": "Family Information Form (IMM 5707)",
            "description": "Completed family information and employment details",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "forms",
            "tips": "Must be completed by all applicants regardless of age"
        }
    ]',
    '[
        "Apply online through the IRCC portal for faster processing",
        "Get biometrics done at a Visa Application Centre (VAC)",
        "Processing time is typically 4-12 weeks depending on country",
        "Consider applying for a visitor visa if study permit is delayed"
    ]',
    '[
        {
            "title": "Government of Canada - Study Permits",
            "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html"
        },
        {
            "title": "Designated Learning Institutions",
            "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html"
        }
    ]'
),

-- Canada University Enrollment Documents
(
    'Canada University Enrollment Documents',
    'Essential documents needed to complete enrollment at Canadian universities',
    'Canada',
    'enrollment',
    'general',
    'all',
    'high',
    4,
    '[
        {
            "id": "study_permit_copy",
            "title": "Study Permit Copy",
            "description": "Copy of approved study permit and port of entry letter",
            "required": true,
            "estimated_time_minutes": 5,
            "category": "official_documents",
            "tips": "Keep original study permit with you at all times"
        },
        {
            "id": "tuition_fee_payment",
            "title": "Tuition Fee Payment",
            "description": "Payment of tuition fees or enrollment deposit",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "financial_documents",
            "tips": "International wire transfers may take 3-5 business days"
        },
        {
            "id": "official_transcripts",
            "title": "Official Academic Transcripts",
            "description": "Sealed official transcripts from previous institutions",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "academic_documents",
            "tips": "May need WES credential evaluation for non-Canadian degrees"
        },
        {
            "id": "english_proficiency_scores",
            "title": "English Proficiency Scores",
            "description": "Official IELTS, TOEFL, or other accepted test scores",
            "required": true,
            "estimated_time_minutes": 15,
            "category": "test_scores",
            "tips": "Send scores directly from testing agency to university"
        },
        {
            "id": "health_insurance_enrollment",
            "title": "Health Insurance Enrollment",
            "description": "Enrollment in provincial health plan or university health plan",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "health_documents",
            "tips": "Each province has different requirements and waiting periods"
        },
        {
            "id": "course_registration",
            "title": "Course Registration",
            "description": "Register for courses through university portal",
            "required": true,
            "estimated_time_minutes": 90,
            "category": "academic_documents",
            "tips": "Meet with academic advisor before registration"
        },
        {
            "id": "student_housing_application",
            "title": "Student Housing Application",
            "description": "Application for on-campus housing or residence",
            "required": false,
            "estimated_time_minutes": 60,
            "category": "housing",
            "tips": "Apply early as housing fills up quickly"
        },
        {
            "id": "orientation_registration",
            "title": "Orientation Registration",
            "description": "Register for international student orientation",
            "required": true,
            "estimated_time_minutes": 20,
            "category": "administrative",
            "tips": "Orientation covers essential Canadian living and study tips"
        }
    ]',
    '[
        "Get your SIN (Social Insurance Number) to work part-time",
        "Open a Canadian bank account with student banking package",
        "Register for provincial health insurance immediately upon arrival",
        "Download university mobile app for easy access to services"
    ]',
    '[
        {
            "title": "World Education Services (WES)",
            "url": "https://www.wes.org/ca/"
        }
    ]'
),

-- Canada Pre-Departure Preparation
(
    'Canada Pre-Departure Preparation',
    'Complete preparation checklist before traveling to Canada for studies',
    'Canada',
    'pre_departure',
    'general',
    'all',
    'medium',
    8,
    '[
        {
            "id": "study_permit_approval",
            "title": "Study Permit Approval",
            "description": "Ensure study permit has been approved and port of entry letter received",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "documents",
            "tips": "Print port of entry letter to show at Canadian border"
        },
        {
            "id": "flight_booking_canada",
            "title": "Flight Booking",
            "description": "Book flights to arrive before orientation and class start dates",
            "required": true,
            "estimated_time_minutes": 60,
            "category": "travel",
            "tips": "Consider arriving 1-2 weeks early for settling in"
        },
        {
            "id": "winter_clothing",
            "title": "Winter Clothing",
            "description": "Purchase or pack appropriate winter clothing for Canadian climate",
            "required": true,
            "estimated_time_minutes": 120,
            "category": "clothing",
            "tips": "Canadian winters are harsh - invest in good winter coat and boots"
        },
        {
            "id": "accommodation_booking_canada",
            "title": "Accommodation Confirmation",
            "description": "Confirm university residence or arrange temporary accommodation",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "housing",
            "tips": "Book temporary accommodation if residence not immediately available"
        },
        {
            "id": "travel_health_insurance",
            "title": "Travel Health Insurance",
            "description": "Purchase comprehensive health insurance for first 3 months",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "insurance",
            "tips": "Provincial health coverage has waiting period for new residents"
        },
        {
            "id": "canadian_currency",
            "title": "Canadian Currency Exchange",
            "description": "Exchange money to Canadian dollars for initial expenses",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "financial",
            "tips": "Bring enough CAD for first month expenses including housing deposit"
        },
        {
            "id": "prescription_medications_canada",
            "title": "Prescription Medications",
            "description": "Bring sufficient prescription medications with doctors prescription",
            "required": false,
            "estimated_time_minutes": 30,
            "category": "medical",
            "tips": "Bring original prescriptions and doctors note for customs"
        },
        {
            "id": "electrical_adapters",
            "title": "Electrical Adapters",
            "description": "Purchase Type A/B electrical adapters for Canadian outlets",
            "required": true,
            "estimated_time_minutes": 15,
            "category": "electronics",
            "tips": "Canada uses same plugs as US (Type A/B, 110V)"
        },
        {
            "id": "mobile_phone_plan_research",
            "title": "Mobile Phone Plan Research",
            "description": "Research Canadian mobile providers (Rogers, Bell, Telus, Freedom)",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "communication",
            "tips": "Consider prepaid plans initially to build Canadian credit history"
        },
        {
            "id": "canadian_banking_research",
            "title": "Canadian Banking Research",
            "description": "Research Canadian banks and student banking packages",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "financial",
            "tips": "TD, RBC, Scotiabank offer good student packages"
        }
    ]',
    '[
        "Download weather apps to prepare for Canadian climate",
        "Research public transportation in your destination city",
        "Join Facebook groups for international students at your university",
        "Learn basic French phrases if studying in Quebec",
        "Download Tim Hortons app - it is everywhere in Canada!"
    ]',
    '[
        {
            "title": "Government of Canada - Prepare for Life in Canada",
            "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/prepare-life-canada.html"
        }
    ]'
),

-- Canada Financial Documentation
(
    'Canada Financial Documentation for Students',
    'Financial requirements and banking setup for Canadian students',
    'Canada',
    'financial_documents',
    'general',
    'all',
    'high',
    5,
    '[
        {
            "id": "proof_of_funds_canada",
            "title": "Proof of Funds",
            "description": "Bank statements showing CAD $10,000 + tuition fees for first year",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "documents",
            "tips": "Funds must be readily available and in your name"
        },
        {
            "id": "gic_certificate",
            "title": "Guaranteed Investment Certificate (GIC)",
            "description": "GIC from approved Canadian financial institution",
            "required": false,
            "estimated_time_minutes": 60,
            "category": "investment",
            "tips": "GIC can serve as proof of funds and earns interest"
        },
        {
            "id": "scholarship_award_letter",
            "title": "Scholarship Award Letter",
            "description": "Official scholarship or funding award documentation",
            "required": false,
            "estimated_time_minutes": 15,
            "category": "funding",
            "tips": "Can reduce required proof of funds amount"
        },
        {
            "id": "canadian_bank_account",
            "title": "Canadian Bank Account Setup",
            "description": "Open bank account with major Canadian bank",
            "required": true,
            "estimated_time_minutes": 90,
            "category": "banking",
            "tips": "Bring study permit, passport, and letter from university"
        },
        {
            "id": "sin_application",
            "title": "Social Insurance Number (SIN)",
            "description": "Apply for SIN to work part-time in Canada",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "employment",
            "tips": "Free service - never pay for SIN application"
        },
        {
            "id": "provincial_health_registration",
            "title": "Provincial Health Insurance Registration",
            "description": "Register for provincial health coverage (OHIP, MSP, etc.)",
            "required": true,
            "estimated_time_minutes": 60,
            "category": "health",
            "tips": "Most provinces have 3-month waiting period"
        },
        {
            "id": "student_budget_planning",
            "title": "Student Budget Planning",
            "description": "Create monthly budget including housing, food, transportation",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "planning",
            "tips": "Housing costs vary significantly between cities"
        },
        {
            "id": "part_time_work_eligibility",
            "title": "Part-time Work Eligibility",
            "description": "Understand study permit work conditions (20 hours/week)",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "employment",
            "tips": "Can work full-time during scheduled breaks"
        },
        {
            "id": "tax_filing_preparation",
            "title": "Tax Filing Preparation",
            "description": "Understand Canadian tax obligations for international students",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "taxes",
            "tips": "File taxes even with no income to get GST/HST credits"
        }
    ]',
    '[
        "Vancouver and Toronto are most expensive cities for students",
        "Consider credit-building credit cards to establish Canadian credit",
        "Many services offer student discounts - always ask",
        "Food banks and student emergency funds available if needed",
        "Learn about Canadian Registered Education Savings Plans (RESP) for future"
    ]',
    '[
        {
            "title": "Service Canada - Social Insurance Number",
            "url": "https://www.canada.ca/en/employment-social-development/services/sin.html"
        }
    ]'
),

-- ===========================================
-- AUSTRALIA DOCUMENT CHECKLISTS
-- ===========================================

-- Australia Student Visa Application Documents
(
    'Australia Student Visa (Subclass 500) Application',
    'Complete document checklist for Australian student visa application',
    'Australia',
    'visa_application',
    'general',
    'all',
    'high',
    6,
    '[
        {
            "id": "coe_australia",
            "title": "Confirmation of Enrollment (CoE)",
            "description": "CoE issued by Australian educational institution",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "official_documents",
            "tips": "Institution must be registered on CRICOS"
        },
        {
            "id": "genuine_temporary_entrant",
            "title": "Genuine Temporary Entrant (GTE) Statement",
            "description": "Written statement demonstrating genuine intention to study",
            "required": true,
            "estimated_time_minutes": 90,
            "category": "essays",
            "tips": "Explain study choice, ties to home country, and future plans"
        },
        {
            "id": "english_proficiency_australia",
            "title": "English Proficiency Evidence",
            "description": "IELTS, TOEFL, PTE Academic, or other accepted test results",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "test_scores",
            "tips": "Minimum IELTS 5.5 overall, higher for some courses"
        },
        {
            "id": "financial_capacity_australia",
            "title": "Financial Capacity Evidence",
            "description": "Bank statements, scholarship letters, or financial sponsor documents",
            "required": true,
            "estimated_time_minutes": 60,
            "category": "financial_documents",
            "tips": "AUD $21,041 per year living costs plus course fees"
        },
        {
            "id": "health_insurance_oshc",
            "title": "Overseas Student Health Cover (OSHC)",
            "description": "Valid OSHC policy for duration of stay",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "health_documents",
            "tips": "Can be arranged through education provider or directly"
        },
        {
            "id": "health_examinations_australia",
            "title": "Health Examinations",
            "description": "Medical and radiological examinations if required",
            "required": false,
            "estimated_time_minutes": 180,
            "category": "medical_documents",
            "tips": "Required based on country of origin and course duration"
        },
        {
            "id": "character_documents_australia",
            "title": "Character Documents",
            "description": "Police certificates from countries lived in for 12+ months",
            "required": false,
            "estimated_time_minutes": 45,
            "category": "background_documents",
            "tips": "Required if 16+ years old when applying"
        },
        {
            "id": "academic_documents_australia",
            "title": "Academic Documents",
            "description": "Certified copies of qualifications, transcripts, and certificates",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "academic_documents",
            "tips": "May need skills assessment for some courses"
        },
        {
            "id": "passport_australia",
            "title": "Passport",
            "description": "Valid passport with at least 6 months validity",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "identity_documents",
            "tips": "Passport must have blank pages for visa label"
        }
    ]',
    '[
        "Apply online through ImmiAccount for faster processing",
        "Processing times vary from 29 days to 4 months",
        "Get health insurance (OSHC) before applying - its mandatory",
        "Biometrics required at Australian Visa Application Centre"
    ]',
    '[
        {
            "title": "Australian Government - Student Visa",
            "url": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500"
        },
        {
            "title": "CRICOS - Course Search",
            "url": "https://cricos.education.gov.au/"
        }
    ]'
),

-- Australia University Enrollment Documents
(
    'Australia University Enrollment Documents',
    'Essential documents needed to complete enrollment at Australian universities',
    'Australia',
    'enrollment',
    'general',
    'all',
    'high',
    4,
    '[
        {
            "id": "student_visa_grant_letter",
            "title": "Student Visa Grant Letter",
            "description": "Copy of visa grant letter and conditions",
            "required": true,
            "estimated_time_minutes": 5,
            "category": "official_documents",
            "tips": "Know your visa conditions especially work restrictions"
        },
        {
            "id": "tuition_payment_australia",
            "title": "Tuition Fee Payment",
            "description": "Payment of semester fees or enrollment deposit",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "financial_documents",
            "tips": "International bank transfers can take 3-5 business days"
        },
        {
            "id": "oshc_policy_details",
            "title": "OSHC Policy Details",
            "description": "Overseas Student Health Cover policy number and card",
            "required": true,
            "estimated_time_minutes": 15,
            "category": "health_documents",
            "tips": "OSHC covers basic medical services and some hospital costs"
        },
        {
            "id": "academic_transcripts_australia",
            "title": "Academic Transcripts",
            "description": "Official transcripts from previous educational institutions",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "academic_documents",
            "tips": "Bring both originals and certified copies"
        },
        {
            "id": "english_test_results_australia",
            "title": "English Test Results",
            "description": "Official IELTS, TOEFL, PTE Academic results",
            "required": true,
            "estimated_time_minutes": 15,
            "category": "test_scores",
            "tips": "Results must meet course entry requirements"
        },
        {
            "id": "unique_student_identifier",
            "title": "Unique Student Identifier (USI)",
            "description": "Apply for USI for Australian qualifications tracking",
            "required": true,
            "estimated_time_minutes": 20,
            "category": "administrative",
            "tips": "Free online application - required for all Australian study"
        },
        {
            "id": "orientation_attendance",
            "title": "Orientation Program Attendance",
            "description": "Attend mandatory international student orientation",
            "required": true,
            "estimated_time_minutes": 480,
            "category": "administrative",
            "tips": "Covers visa compliance, academic expectations, and support services"
        },
        {
            "id": "accommodation_australia",
            "title": "Accommodation Arrangement",
            "description": "University housing, homestay, or private rental arrangement",
            "required": true,
            "estimated_time_minutes": 90,
            "category": "housing",
            "tips": "University housing often has waitlists - apply early"
        }
    ]',
    '[
        "Get Tax File Number (TFN) to work part-time",
        "Open Australian bank account with student package",
        "Download university app for timetables and announcements",
        "Join student clubs and societies during O-Week"
    ]',
    '[
        {
            "title": "Unique Student Identifier",
            "url": "https://www.usi.gov.au/"
        }
    ]'
),

-- Australia Pre-Departure Preparation
(
    'Australia Pre-Departure Preparation',
    'Complete preparation checklist before traveling to Australia for studies',
    'Australia',
    'pre_departure',
    'general',
    'all',
    'medium',
    7,
    '[
        {
            "id": "student_visa_granted",
            "title": "Student Visa Granted",
            "description": "Confirm student visa has been granted and conditions understood",
            "required": true,
            "estimated_time_minutes": 0,
            "category": "documents",
            "tips": "Download ImmiCard app to carry digital visa evidence"
        },
        {
            "id": "flight_booking_australia",
            "title": "Flight Booking to Australia",
            "description": "Book flights arriving before course commencement",
            "required": true,
            "estimated_time_minutes": 60,
            "category": "travel",
            "tips": "Arrive at least 1 week before semester starts"
        },
        {
            "id": "quarantine_requirements",
            "title": "Quarantine and Biosecurity",
            "description": "Understand Australian quarantine laws and prohibited items",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "customs",
            "tips": "Declare all food, wooden items, and medications"
        },
        {
            "id": "seasonal_clothing_australia",
            "title": "Seasonal Clothing",
            "description": "Pack appropriate clothing for Australian seasons",
            "required": true,
            "estimated_time_minutes": 90,
            "category": "clothing",
            "tips": "Australian seasons are opposite to Northern Hemisphere"
        },
        {
            "id": "accommodation_confirmation_australia",
            "title": "Accommodation Confirmation",
            "description": "Confirm accommodation booking and arrival details",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "housing",
            "tips": "Have temporary accommodation if permanent housing unavailable"
        },
        {
            "id": "australian_currency",
            "title": "Australian Dollar Exchange",
            "description": "Exchange money to Australian dollars for initial expenses",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "financial",
            "tips": "Bring enough AUD for first months expenses and bond"
        },
        {
            "id": "prescription_medications_australia",
            "title": "Prescription Medications",
            "description": "Bring prescription medications with doctors letter",
            "required": false,
            "estimated_time_minutes": 30,
            "category": "medical",
            "tips": "Some medications may be prohibited - check beforehand"
        },
        {
            "id": "electrical_adapters_australia",
            "title": "Electrical Adapters Type I",
            "description": "Purchase Type I electrical adapters for Australian outlets",
            "required": true,
            "estimated_time_minutes": 15,
            "category": "electronics",
            "tips": "Australia uses Type I plugs (240V)"
        },
        {
            "id": "mobile_plan_australia",
            "title": "Mobile Phone Plan Research",
            "description": "Research Australian mobile providers (Telstra, Optus, Vodafone)",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "communication",
            "tips": "Consider prepaid plans for flexibility"
        },
        {
            "id": "sun_protection",
            "title": "Sun Protection Items",
            "description": "Pack sunscreen, hat, and sunglasses for strong Australian sun",
            "required": true,
            "estimated_time_minutes": 20,
            "category": "health",
            "tips": "Australia has high UV levels year-round"
        }
    ]',
    '[
        "Download weather apps - Australian weather can be extreme",
        "Research public transport in your destination city",
        "Join Facebook groups for international students",
        "Learn Australian slang and cultural expressions",
        "Download Opal card app (Sydney) or Myki app (Melbourne) for transport"
    ]',
    '[
        {
            "title": "Australian Border Force - Prohibited Items",
            "url": "https://www.abf.gov.au/entering-and-leaving-australia/prohibited-goods"
        }
    ]'
),

-- Australia Financial Documentation
(
    'Australia Financial Documentation for Students',
    'Financial requirements and banking setup for Australian students',
    'Australia',
    'financial_documents',
    'general',
    'all',
    'high',
    5,
    '[
        {
            "id": "financial_evidence_australia",
            "title": "Financial Evidence",
            "description": "Proof of AUD $21,041 + course fees for living expenses",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "documents",
            "tips": "Include accommodation, food, transport, and other living costs"
        },
        {
            "id": "scholarship_documentation_australia",
            "title": "Scholarship Documentation",
            "description": "Australian Government or institution scholarship letters",
            "required": false,
            "estimated_time_minutes": 15,
            "category": "funding",
            "tips": "Can reduce required financial evidence amount"
        },
        {
            "id": "australian_bank_account_setup",
            "title": "Australian Bank Account",
            "description": "Open account with major Australian bank",
            "required": true,
            "estimated_time_minutes": 90,
            "category": "banking",
            "tips": "Big 4 banks: ANZ, CBA, NAB, Westpac offer student accounts"
        },
        {
            "id": "tax_file_number_application",
            "title": "Tax File Number (TFN) Application",
            "description": "Apply for TFN to work part-time and avoid higher tax rates",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "employment",
            "tips": "Free service - apply online within 28 days of arrival"
        },
        {
            "id": "medicare_eligibility",
            "title": "Medicare Eligibility Check",
            "description": "Check if eligible for Medicare under reciprocal agreements",
            "required": false,
            "estimated_time_minutes": 30,
            "category": "health",
            "tips": "Some countries have reciprocal healthcare agreements"
        },
        {
            "id": "work_rights_understanding",
            "title": "Work Rights Understanding",
            "description": "Understand 48 hours per fortnight work limit on student visa",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "employment",
            "tips": "Unlimited hours during course breaks"
        },
        {
            "id": "superannuation_setup",
            "title": "Superannuation Setup",
            "description": "Set up superannuation account if working in Australia",
            "required": false,
            "estimated_time_minutes": 45,
            "category": "employment",
            "tips": "Can claim super back when leaving Australia permanently"
        },
        {
            "id": "student_concessions",
            "title": "Student Concessions Setup",
            "description": "Apply for student concession cards for transport and services",
            "required": true,
            "estimated_time_minutes": 30,
            "category": "savings",
            "tips": "Significant savings on public transport and entertainment"
        },
        {
            "id": "budget_planning_australia",
            "title": "Australian Living Budget",
            "description": "Create realistic budget for Australian living costs",
            "required": true,
            "estimated_time_minutes": 45,
            "category": "planning",
            "tips": "Sydney and Melbourne are most expensive cities"
        }
    ]',
    '[
        "Australia has high cost of living especially in major cities",
        "Student concessions provide significant savings - always ask",
        "Part-time work is competitive - start looking early",
        "Centrelink may provide some financial assistance for eligible students",
        "Consider share housing to reduce accommodation costs"
    ]',
    '[
        {
            "title": "Australian Taxation Office - TFN",
            "url": "https://www.ato.gov.au/individuals/tax-file-number"
        },
        {
            "title": "Services Australia - Medicare",
            "url": "https://www.servicesaustralia.gov.au/medicare"
        }
    ]'
); 