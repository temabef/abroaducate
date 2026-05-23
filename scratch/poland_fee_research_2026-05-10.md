# Poland Fee Research

Date: 2026-05-10

## Goal

Find reliable fee information for the blank `semester_fee` and `application_fee` values in `poland_final_upload_cleaned.csv` before platform upload.

## Main conclusion

### `semester_fee`

I did **not** find evidence of a separate Germany-style per-semester administrative contribution in the researched Polish admissions sources.

What the sources consistently show instead:

- `application fee` / `recruitment fee`
- `tuition fee` / `tuition per semester`

Because of that, the strongest current recommendation is:

- Treat `semester_fee` as `0` for Poland unless a university explicitly publishes an additional non-tuition semester charge.

This is still an inference, but it is a strong one based on the official fee pages reviewed below.

### `application_fee`

We can already batch-fill a meaningful share of the file.

- Safe or near-safe fill coverage found: about `145` rows
- Conditional fill coverage found: about `55` additional rows
- Still unresolved after this pass: about `287` rows

## Safe or near-safe application fee fills

### 1. Warsaw University of Technology

- Rows covered: `29`
- Suggested `application_fee`: `85 PLN`
- Source:
  - https://new.students.pw.edu.pl/index.php/Resources/Application-Glossary/Application-fee

Evidence:

- The WUT International Students Office page states `85 PLN APPLICATION FEE`.

### 2. Wrocław University of Science and Technology

- Rows covered: `17`
- Suggested `application_fee`:
  - `150 PLN` for the `2` architecture rows
  - `85 PLN` for the other `15` rows
- Source:
  - https://rekrutacja.pwr.edu.pl/en/admission/application-fee/

Evidence:

- The admissions page states:
  - `for candidates applying for Architecture – PLN 150`
  - `for candidates applying for other fields of study – PLN 85`

### 3. Lodz University of Technology

- Rows covered: `20`
- Suggested `application_fee`: `85 PLN`
- Source:
  - https://apply.p.lodz.pl/en/enrollment/enroll/fees-and-scholarships

Evidence:

- The recruitment fees page states `85 PLN` in the admission fee section.

### 4. Bialystok University of Technology

- Rows covered: `15`
- Suggested `application_fee`: `85 PLN`
- Sources:
  - https://apply.pb.edu.pl/a/bialystok-university-of-technology/documents/
  - https://pb.edu.pl/studyatbut/

Evidence:

- Both admissions pages list `Admission fee payment confirmation (85 PLN)`.

### 5. University of Warmia and Mazury in Olsztyn

- Rows covered: `14`
- Suggested `application_fee`: `85 PLN`
- Sources:
  - https://wl.uwm.edu.pl/en/candidates/faq-frequently-asked-questions
  - https://wg.uwm.edu.pl/en/study-english/environmental-engineering
  - https://wg.uwm.edu.pl/en/study-english/environmental-biotechnology

Evidence:

- Official pages state `Payment of the application fee - 85 PLN`
- Programme pages also state `Registration (application) fee: 85 PLN (~20 EUR)`

### 6. University of Lodz

- Rows covered: `14`
- Suggested `application_fee`: `85 PLN`
- Sources:
  - https://www.uni.lodz.pl/en/candidate-zone/information-for-candidates-without-polish-citizenship/how-to-apply-for-ba-bachelors-for-candidates-who-do-not-hold-polish-citizenship
  - https://rekrutacja.uni.lodz.pl/en-gb/offer/WYZSZE2026/programme/DLGLGa_05/criteria/preview/turn/1/

Evidence:

- The candidate guide says `Pay the application fee (85 PLN)`
- The programme IRK page states `application fee - 85 zł`

### 7. University of Opole

- Rows covered: `8`
- Suggested `application_fee`: `85 PLN`
- Sources:
  - https://bdijk.uni.opole.pl/en/fees-and-refunds/
  - https://uni.opole.pl/oplata-rekrutacyjna/

Evidence:

- The English admissions page states `registration fee in the amount of 85 PLN`
- The general admissions page states `85 zł` and `150 zł` only for the art programme
- None of the `8` Poland upload rows are that art programme

### 8. Lazarski University

- Rows covered: `11`
- Suggested `application_fee`: `18 EUR`
- Source:
  - https://www.lazarski.pl/en/offer-education/recruitment/graduate-studies/corporate-finance-j-English-bachelors-degree

Evidence:

- The admissions page states `Admission fee is EUR 18`

### 9. Wrocław University of Environmental and Life Sciences

- Rows covered: `9`
- Suggested `application_fee`: `85 PLN`
- Sources:
  - https://apply.upwr.edu.pl/pl_PL/contents/content/22-admission-step-step
  - https://apply.upwr.edu.pl/en_GB/courses/course/482-inz-applied-bioeconomy

Evidence:

- The admissions flow requires paying the application fee
- Programme pages state `Application fee | PLN 85 one-time`

### 10. University of Szczecin

- Rows covered: `8`
- Suggested `application_fee`: `85 PLN`
- Source:
  - https://admissions.usz.edu.pl/tuition-fees/

Evidence:

- The official tuition page states `The application fee costs 85 PLN/degree programme`

## Conditional application fee fills

These are promising, but I would not auto-fill them without one more pass or a documented assumption.

### 1. University of Warsaw

- Rows covered: `23`
- Suggested rule:
  - `85 PLN` by default
  - `100 PLN` if the programme requires written exam, oral exam, or qualification interview
- Source:
  - https://rekrutacja.uw.edu.pl/en/application-and-tuition-fees/

Evidence:

- Official page states:
  - `85 PLN`
  - `100 PLN` if an exam or interview is required

Risk:

- We still need programme-level confirmation for which of the `23` rows fall into the `100 PLN` bucket.

### 2. SGH Warsaw School of Economics

- Rows covered: `7`
- Suggested rule:
  - `85 PLN` in ordinary cases
  - `100 PLN` if there is an entrance exam
- Source:
  - https://www.sgh.waw.pl/en/table-fees-graduate-studies

Evidence:

- Official fee table states:
  - `PLN 100 – in the case of an entrance exam`
  - `PLN 85 – in other cases`

### 3. Gdańsk University of Technology

- Rows covered: `16`
- Suggested rule:
  - `150 PLN` for the `Architecture` bachelor row
  - `85 PLN` for some credential groups
  - `100 PLN` for candidates from other countries / pathways
- Source:
  - https://pg.edu.pl/en/admission/bachelor-studies-international-students/application-procedure

Evidence:

- Official page states:
  - `85 PLN or 150 PLN for Architecture` for some certificate groups
  - `100 PLN or 150 PLN for Architecture` for other country groups

Risk:

- The correct amount depends on candidate document type / country recognition path, not only the programme.

### 4. The John Paul II Catholic University of Lublin

- Rows covered: `9`
- Suggested rule:
  - `85 PLN` by default
  - `100 PLN` for programmes with entrance exams
  - `150 PLN` for Musicology only
- Source:
  - https://kandydat.kul.pl/en/vademecum-rekrutacji/oplaty/

Evidence:

- Official admissions page states:
  - `85 zł – studia I i II stopnia`
  - `100 zł` for programmes with entrance exams
  - `150 zł` for Musicology

Risk:

- The Poland upload rows are not Musicology, but I have not yet verified whether any of the listed KUL English programmes are treated as entrance-exam programmes.

## Still unresolved

I did not get enough hard fee data in this pass to safely fill these groups:

- Silesian University of Technology: `29`
- Jagiellonian University in Kraków: `14`
- Adam Mickiewicz University, Poznań: `12`
- Jan Dlugosz University in Czestochowa: `12`
- University of Zielona Góra: `12`
- Military University of Technology: `10`
- University of Silesia in Katowice: `10`
- AGH University of Krakow: `9`
- Rzeszow University of Technology: `8`
- University of Agriculture in Krakow: `8`
- The Karol Szymanowski Academy of Music in Katowice: `8`
- Remaining smaller groups

## Recommended upload strategy

### `semester_fee`

- Best current operational choice: set all Poland `semester_fee` values to `0`
- Reason: reviewed official sources consistently publish tuition and application fees, not a separate per-semester administrative contribution

### `application_fee`

- Safely batch-fill the universities listed under `Safe or near-safe application fee fills`
- Keep the `Conditional application fee fills` in a review queue unless you want me to apply the documented assumptions
- Leave the unresolved universities blank for a second research pass

## Suggested next step

If you want, the next step should be:

1. write the safe application-fee values directly into a new Poland upload file
2. set `semester_fee = 0` across Poland
3. output a second CSV containing only the unresolved / conditional rows for manual review
