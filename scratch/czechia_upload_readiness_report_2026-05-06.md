# Czechia Upload Readiness Report

Date: 2026-05-06

## Current platform state

- Live `programs` table count: `790`
- Country split:
  - Germany: `574`
  - Austria: `187`
  - Sweden: `29`
- Czechia programs currently loaded: `0`

## Current import/schema expectations

### Live table / importer shape

The current import flow is built around the `programs` table plus the later Studee-style display fields:

- Core table fields from `supabase/migrations/001_create_programs_table.sql`
- Added display fields from `supabase/migrations/20260426000001_add_studee_fields_to_programs.sql`:
  - `intake`
  - `duration`
  - `format`
  - `pace`

### Admin bulk import page

The admin page at `src/routes/admin/programs/import/+page.svelte` expects CSV data with at least:

- Required:
  - `program_name`
  - `university_name`
  - `country`
  - `city`
- Optional but used by the API:
  - `id`
  - `tuition_per_semester`
  - `semester_fee`
  - `application_fee`
  - `living_cost_per_month`
  - `degree_level`
  - `field_of_study`
  - `application_deadline`
  - `official_url`

The API at `src/routes/api/admin/bulk-import-programs/+server.ts` also uses:

- `intake`
- `duration`
- `format`
- `pace`

Important behavior:

- Missing `semester_fee` becomes `300`
- Missing `application_fee` becomes `0`
- Missing `living_cost_per_month` becomes `934`
- Missing `tuition_per_semester` becomes `0`
- Missing `direct_application_url` is allowed
- AI enrichment is optional

## Reference dataset already used for production-style loading

The cleanest existing reference file is:

- `austria_programmes_production_platform_full_ready.csv`

It has `187` rows and these platform-style columns:

- `id`
- `program_name`
- `university_name`
- `country`
- `city`
- `tuition_per_semester`
- `degree_level`
- `field_of_study`
- `language_of_instruction`
- `semester_fee`
- `application_fee`
- `living_cost_per_month`
- `official_url`
- `direct_application_url`
- `source_url`
- `full_description_text`
- `program_duration_months`
- `duration`
- `intake`
- `application_deadline`

## Czech file assessment

### 1. `czechia_programmes_english_only.csv`

Status: `Not uploadable as-is`

Why:

- It is a raw Study in CZ export shape, not the platform import shape
- Row count: `1033`
- Header count: `40`
- It does **not** contain the platform-required columns like:
  - `program_name`
  - `country`
  - `official_url`
  - `duration`
  - `application_deadline`
- It uses raw source fields such as:
  - `programme_name`
  - `studyincz_detail_url`
  - `programme_official_url`
  - `language_of_teaching`

Conclusion:

- This is a source catalogue, not an admin import file
- It would fail the current admin importer without a transformation step

### 2. `czechia_programmes_under_10000_eur_english_including_admin_import_extended.csv`

Status: `Technically uploadable, but not clean enough for production as-is`

Why it is close:

- Row count: `653`
- Header count: `19`
- It already matches the platform-style Czech upload schema:
  - `program_name`
  - `university_name`
  - `country`
  - `city`
  - `tuition_per_semester`
  - `degree_level`
  - `field_of_study`
  - `language_of_instruction`
  - `semester_fee`
  - `application_fee`
  - `living_cost_per_month`
  - `official_url`
  - `direct_application_url`
  - `source_url`
  - `full_description_text`
  - `program_duration_months`
  - `duration`
  - `intake`
  - `application_deadline`

Readiness checks:

- UI-minimum valid rows: `653 / 653`
- Strongly ready rows: `643 / 653`
- Rows with at least one URL: `653 / 653`

Main issues:

- `10` rows have blank `tuition_per_semester`
  - The current importer would silently load these as `0`
  - That is risky because these are not necessarily free programmes
- `653` rows have blank `semester_fee`
  - The current importer would silently load these as `300`
- `653` rows have blank `application_fee`
  - The current importer would silently load these as `0`
- `618` rows have blank `application_deadline`
- `653` rows have blank `intake`
- `99` rows have blank `full_description_text`
- `18` rows have blank `program_duration_months`

Duplicate risk:

- Duplicate `program_name + university_name` groups: `96`
- Unique `program_name + university_name` keys: `534`
- Unique `program_name + university_name + degree_level + city` keys: `574`
- Unique `source_url` keys: `653`

Interpretation:

- Many duplicates are not true duplicates in source terms
- They are distinct source rows that collapse under a weak identity rule
- Common causes:
  - same programme name across Bachelor and Master
  - same programme name across different Charles University faculties/cities
  - same PhD programme title reused across campuses/faculties

This means:

- The current importer would still ingest all `653` rows because it auto-generates slugs
- But the catalog would contain many near-duplicate public entries unless we dedupe using a stronger key

### 3. `czechia_final_upload.xlsx`

Status: `Best candidate, but still needs cleanup before production import`

Why:

- Same sheet schema as the 653-row Czech extended CSV
- Same row count: `653`
- Same headers: `19`
- Not an exact copy: `171` differing rows compared with the CSV

Where the Excel file is better:

- It contains more nonblank deadlines
- Nonblank `application_deadline` rows: `161`
  - compared with `35` in the CSV
- Some `official_url` values are also different and appear more specific

Other readiness numbers:

- UI-minimum valid rows: `653 / 653`
- Strongly ready rows: `643 / 653`
- Blank tuition rows: `10`
- Duplicate `program_name + university_name` groups: `96`

Important note:

- The current admin page accepts CSV text, not XLSX upload
- So the XLSX is the best source file, but it is not directly usable by the current UI without conversion or a small script

## Direct answer: is it uploadable?

### Technical answer

Yes, the Czech 653-row platform-format set is **technically uploadable** through the current importer because all rows satisfy the minimum required columns.

### Production answer

No, it is **not clean enough to upload as-is** if we care about data quality.

Main blockers before a proper import:

1. Fix or review the `10` blank tuition rows so they do not become false `0 EUR` programmes
2. Decide how to handle duplicate programme names across faculties/cities/degree levels
3. Prefer the Excel version over the CSV because it has materially better deadline coverage
4. Decide whether blank `semester_fee` should really default to `300` for Czechia
5. Decide whether blank `intake` should stay blank or be normalized

## Recommendation

Recommended import basis:

- Use `czechia_final_upload.xlsx` as the source of truth
- Convert it into a final Czech production CSV
- Deduplicate using a stronger identity than `program_name + university_name`
  - safest candidate: `source_url`
  - display identity candidate: `program_name + university_name + degree_level + city`
- Hold out the `10` blank-tuition rows for manual review

Recommended scope for the first Czech import:

- Do **not** upload `czechia_programmes_english_only.csv` directly
- Do **not** upload the 653-row set raw through the admin page yet
- Prepare a final cleaned Czech import file first, then import that

## Best current estimate of safe upload volume

Depending on the dedupe rule:

- Raw platform-format set: `653`
- Excluding blank tuition rows: `643`
- Collapsing by `program + university + degree + city`: `574`

So the realistic clean-import range is:

- about `574` to `643` rows

That is why the user’s rough expectation of around `622` rows is plausible, but not yet a defensible final number until dedupe rules are fixed.
