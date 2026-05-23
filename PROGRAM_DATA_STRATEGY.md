# Abroaducate: Program Data Acquisition Strategy

This document outlines the current state of our program database and the tactical plan to scale from **1 program** to **1,000 English-taught European Master's programs**.

---

## 📍 Current Status
*   **Database Schema:** Fully implemented and supports "Rich Data" (Tuition, living costs, application steps, and funding strategies).
*   **Sample Data:** Only 1 program exists (TC-0).
*   **Infrastructure:** Admin dashboard exists but requires a Bulk Import/CSV tool to handle large-scale data entry.
*   **Payment & Credits:** Stripe and Paystack are integrated to handle the pay-per-use credit logic once programs are live.

---

## 🎯 The Goal
Populate the database with **1,000 English-taught Master's programs** across Europe (Priority: Germany, Netherlands, Sweden, Denmark).

---

## 🛠 The Two-Pronged Strategy

### 1. Human Virtual Assistant (VA) - Data Scoping
We will hire a researcher to find the "Hard Metadata" that AI cannot always guess accurately (Current deadlines, exact tuition fees for non-EU students, university portal links).

### 2. AI Enrichment (Clarity Engine)
We use AI to transform the VA's raw data into "Rich Data." The AI will generate:
*   Structured 5-step application timelines.
*   Funding pathway classifications (e.g., "Professor Contact First").
*   Estimated "Rubric Criteria" (Min GPA required).

---

## 📋 Prompt 1: For the Human Virtual Assistant (Upwork/Fiverr)

**Subject:** Researcher for European University Master's Programs

**Task:**
Find English-taught Master's programs in Germany, Netherlands, and Sweden. Populate a spreadsheet with the following columns:

*   `id`: Unique slug (e.g., `rwth-aachen-software-eng`)
*   `program_name`: Exact name
*   `university_name`: Exact university
*   `country` / `city`
*   `tuition_per_semester`: Numeric value in EUR
*   `application_deadline`: (e.g., `July 15`)
*   `official_url`: The direct link to the program page

**Primary Source:** [DAAD International Programs Search](https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/)

---

## 🤖 Prompt 2: For AI Data Extraction (Clarity Engine)

*Use this prompt when you have a university webpage open or have raw text from a program brochure and want to convert it into the Abroaducate database format.*

**Prompt:**
> "Analyze the following university program text. Extract and format the data into a JSON object compatible with the following schema:
> 
> 1. **Core Metadata:** Name, University, City, Country, Tuition, Living Costs.
> 2. **Application Steps:** Create a list of 4-6 chronological steps (title, description, month) the student must take to apply.
> 3. **Funding Strategy:** Determine if the best path is 'Direct Application', 'Uni-Assist', or 'Scholarship First'. Provide a 2-sentence explanation.
> 4. **Eligibility:** Estimate the minimum GPA (German scale 1.0-4.0) and required English level (e.g., IELTS 6.5).
>
> [PASTE PROGRAM TEXT HERE]"

---

## 🖥 The Admin Bulk Import Tool (`/admin/programs/import`)

To handle the 1,000-program target, we will build a specialized admin interface.

### Key Features:
1.  **CSV Uploader:** Drag and drop the spreadsheet provided by the VA.
2.  **Field Mapping:** Match the CSV columns (e.g., "Uni Name") to our database columns (e.g., `university_name`).
3.  **Data Preview:** A table showing the data before it is saved, highlighting any errors (like missing fees or invalid deadlines).
4.  **AI Enrichment Button:** A toggle that, when turned on, will call GPT-4o-mini to automatically fill in the `application_steps` and `funding_pathway` for every row in the CSV.
5.  **Batch Save:** Insert hundreds of programs into Supabase with a single click.

---

## 🚀 Execution Roadmap

1.  **Build Bulk Importer:** Create `/admin/programs/import` to accept CSV files.
2.  **Seed Phase:** Manually add the "Top 50" most popular programs using AI to ensure quality.
3.  **Scale Phase:** Hire VA to find the next 200 programs.
4.  **AI Audit:** Run the "AI Enrichment" script to fill in the application timelines for all 250 programs.
5.  **Repeat:** Scale to 1,000 programs by expanding country by country.
