Now — here is the database schema:

PROGRAMS TABLE
program_id — unique identifier
program_name — text
university_name — text
country — text
city — text
degree_level — enum: Bachelor, Master, PhD, Short Course
field_of_study — text
language_of_instruction — text
tuition_cost_per_year — number (0 if free)
tuition_currency — text
tuition_label — enum: Free, Low Tuition, Paid
application_fee — number (0 if none)
application_fee_currency — text
has_application_fee — boolean
application_platform — enum: Direct, StudyInfo, Parcoursup, Universitaly, UCAS, Other
application_platform_name — text (if Other)
application_platform_url — text
direct_application_url — text
application_open_date — date
application_close_date — date
program_start_date — date
program_duration_years — number
funding_pathway — enum: Automatic, ProgramFirst, FundingFirst, ProfessorDependent
funding_pathway_explanation — text (plain language explanation specific to this program)
minimum_gpa_required — text
language_requirement — text (e.g. IELTS 6.5 or no requirement)
work_experience_required — boolean
work_experience_details — text
open_to_international — boolean
eligible_nationalities — text (all or specific list)
last_verified_date — date
verified_by — text
official_source_url — text
notes — text
is_active — boolean
created_at — timestamp
updated_at — timestamp

FUNDING SOURCES TABLE
funding_id — unique identifier
funding_name — text
funding_type — enum: Scholarship, Fellowship, Assistantship, Grant, Waiver, Position
provider — text (e.g. Swedish Institute, DAAD, university itself)
country — text
amount_per_year — number
amount_currency — text
covers — text (e.g. tuition only, tuition and living, full funding)
is_full_funding — boolean
application_open_date — date
application_close_date — date
result_announcement_date — date
funding_pathway — enum: Automatic, ProgramFirst, FundingFirst, ProfessorDependent
requires_prior_admission — boolean
sequence_notes — text (plain language: e.g. "You must apply to the program first. Once the program application closes in January, this scholarship opens in February")
eligibility_countries — text (all African countries, specific list, or all)
eligibility_degree_level — text
eligibility_field — text (all fields or specific)
minimum_gpa — text
requires_work_experience — boolean
funding_url — text
last_verified_date — date
is_active — boolean
notes — text
created_at — timestamp
updated_at — timestamp

PROGRAM-FUNDING LINK TABLE
This is the table that connects programs to their available funding sources. One program can have multiple funding sources and one funding source can apply to multiple programs.
link_id — unique identifier
program_id — foreign key to programs table
funding_id — foreign key to funding sources table
relationship_type — enum: Direct (funding specifically for this program), General (funding open to anyone in this country/field)
sequence_step — number (1 for first thing to apply for, 2 for second, etc.)
sequence_notes — text (specific to this program-funding combination)
deadline_alignment_notes — text (explains how this program's deadline relates to this funding's deadline)
is_verified — boolean
last_verified_date — date

USER PROFILES TABLE
user_id — unique identifier
email — text
country_of_origin — text
current_education_level — enum: Secondary, Bachelor, Master, PhD
field_of_study_interest — text
target_countries — text (comma separated or JSON array)
open_to_any_country — boolean
language_proficiency — text
ielts_score — number
intended_start_year — number
intended_start_semester — enum: Fall, Spring, Either
gpa — text
work_experience_years — number
work_experience_description — text
motivation_summary — text
credits_balance — number
created_at — timestamp
updated_at — timestamp

CREDITS AND TRANSACTIONS TABLE
transaction_id — unique identifier
user_id — foreign key
transaction_type — enum: Purchase, Usage, Refund, Bonus
credits_amount — number
payment_method — enum: Paystack, Flutterwave, BankTransfer, Stripe
payment_reference — text
amount_paid — number
currency — text
roadmap_generated_for_program_id — foreign key (if usage)
created_at — timestamp

GENERATED ROADMAPS TABLE
roadmap_id — unique identifier
user_id — foreign key
program_id — foreign key
motivation_letter_content — text
application_checklist — JSON
step_by_step_guidance — text
pathway_specific_tips — text
generated_at — timestamp
credits_used — number

A few important design notes
The funding_pathway field appears in both the programs table and the funding sources table because sometimes the pathway is determined by the program, sometimes by the funding source, and sometimes both need to agree. The link table's sequence_notes field is where you store the specific explanation for each combination.
The last_verified_date field is critical and should appear on the frontend everywhere. Users must always see when information was last checked.
The sequence_step in the link table is how you build the timeline visualization automatically. Step 1 is always what the user does first, step 2 is what comes after. For Pathway 1 there is only one step. For Pathway 2 there are two steps. For Pathway 4 the steps are different in nature — find supervisor, then apply.
Start with just the programs, funding sources, and link tables. You don't need everything on day one. Get 50 programs across 8 countries into the database with accurate data and that is enough to launch and start getting users.
You've got this. The idea is solid, the architecture is clear, and nobody understands it better than you do.