# Poland Fee Fill Summary

Date: 2026-05-10

## Output files

- Fee-ready Poland upload: `poland_final_upload_fee_ready.csv`
- Remaining review queue: `scratch/poland_fee_review_queue_2026-05-10.csv`

## Rules applied

- Set `semester_fee` to `0` for all 487 rows
- Filled 209 blank `application_fee` rows using safe university/domain rules
- Preserved 3 existing nonblank `application_fee` rows

## Remaining queue

- Conditional review rows: 24
- Unresolved rows: 251

## Currency handling note

- PLN-denominated safe fees were converted to EUR-equivalent amounts using the ECB reference rate from 08 May 2026:
  - `1 EUR = 4.2318 PLN`
  - `85 PLN = 20.09 EUR`
  - `100 PLN = 23.63 EUR`
  - `150 PLN = 35.45 EUR`

## Why EUR conversion was used

- The current importer stores `application_fee` as a number
- The current UI renders application fees with a euro symbol in key program views
- Converting safe PLN fees to EUR avoids uploading values that the current platform would mislabel as euros

