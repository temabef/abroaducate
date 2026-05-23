# Poland Upload Readiness Report

Date: 2026-05-10

## Output files

- Cleaned upload file: `poland_final_upload_cleaned.csv`
- Duration fix review: `scratch/poland_duration_fixes_review_2026-05-10.csv`
- Deadline cleanup review: `scratch/poland_deadlines_cleared_review_2026-05-10.csv`
- Delivery mode review: `scratch/poland_delivery_mode_review_2026-05-10.csv`

## Safe fixes applied

- Added deterministic `id` slugs for all 487 rows
- Backfilled `direct_application_url` from `official_url` or `source_url` for 379 rows
- Cleared 472 stale deadlines older than 2026-05-10
- Filled `program_duration_months` for 8 rows from the text in `duration`
- Added `format` and `pace` columns for all rows
- Applied 22 keyword-based format overrides and 62 keyword-based pace overrides

## Remaining data issues before a fully trusted production import

- 487 rows still have blank `semester_fee`
- 484 rows still have blank `application_fee`
- 147 rows still use `http` official URLs

## Important importer behavior

- Blank `semester_fee` becomes `0` in the current importer
- Blank `application_fee` becomes `0` in the current importer
- The cleaned file now includes explicit `format` and `pace` values, so it will not rely on importer defaults for those fields

## Recommendation

- Safe to upload if you accept missing fee fields landing as `0` on the platform
- Not fully fee-clean yet for production-grade accuracy without a fee verification pass

