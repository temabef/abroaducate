const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, 'poland_final_upload_cleaned.csv');
const OUTPUT_PATH = path.join(ROOT, 'poland_final_upload_fee_ready.csv');
const REVIEW_PATH = path.join(ROOT, 'scratch', 'poland_fee_review_queue_2026-05-10.csv');
const SUMMARY_PATH = path.join(ROOT, 'scratch', 'poland_fee_fill_summary_2026-05-10.md');

// ECB reference rate from 08 May 2026:
// 1 EUR = 4.2318 PLN
const EUR_PER_PLN = 1 / 4.2318;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((record) => record.some((value) => String(value || '').trim() !== ''));
}

function encodeCsvValue(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => encodeCsvValue(row[header])).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function convertPlnToEur(amountPln) {
  return (amountPln * EUR_PER_PLN).toFixed(2);
}

function getSafeFeeRule(row) {
  const id = String(row.id || '').trim();
  const university = String(row.university_name || '').trim();
  const officialUrl = String(row.official_url || '').trim();
  const programName = String(row.program_name || '').trim().toLowerCase();
  const degreeLevel = String(row.degree_level || '').trim();

  if (university === 'Warsaw University of Technology') {
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe university-wide fee', status: 'safe' };
  }

  if (/admission\.pwr\.edu\.pl/i.test(officialUrl)) {
    if (programName.includes('architecture')) {
      return { fee: convertPlnToEur(150), original_fee: '150 PLN', rationale: 'Safe architecture exception', status: 'safe' };
    }
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe non-architecture fee', status: 'safe' };
  }

  if (university === 'Lodz University of Technology') {
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe university-wide fee', status: 'safe' };
  }

  if (university === 'Bialystok University of Technology') {
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe university-wide fee', status: 'safe' };
  }

  if (university === 'University of Warmia and Mazury in Olsztyn') {
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe university-wide fee', status: 'safe' };
  }

  if (university === 'University of Lodz') {
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe university-wide fee', status: 'safe' };
  }

  if (university === 'University of Opole') {
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe general fee; no art rows present', status: 'safe' };
  }

  if (university === 'Lazarski University') {
    return { fee: '18', original_fee: '18 EUR', rationale: 'Safe university-wide fee', status: 'safe' };
  }

  if (/upwr\.edu\.pl/i.test(officialUrl)) {
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe UPWr programme fee', status: 'safe' };
  }

  if (university === 'University of Szczecin') {
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe university-wide fee', status: 'safe' };
  }

  if (university === 'Wrocław University of Science and Technology') {
    if (programName.includes('architecture')) {
      return { fee: convertPlnToEur(150), original_fee: '150 PLN', rationale: 'Safe architecture exception', status: 'safe' };
    }
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe university-wide fee for non-architecture programmes', status: 'safe' };
  }

  if (/^University of Zielona G/i.test(university)) {
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe University of Zielona Gora English-cycle fee', status: 'safe' };
  }

  if (university === 'University of Silesia in Katowice') {
    if (programName.includes('creative management in new media')) {
      return { fee: convertPlnToEur(150), original_fee: '150 PLN', rationale: 'Safe artistic-talent exception', status: 'safe' };
    }
    return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe University of Silesia base fee', status: 'safe' };
  }

  if (university === 'SGH Warsaw School of Economics') {
    if (degreeLevel === 'Bachelor') {
      return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe SGH undergraduate international entrance exam fee', status: 'safe' };
    }
    if (degreeLevel === 'Master') {
      return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe SGH graduate studies in English fee without entrance exam', status: 'safe' };
    }
    return { original_fee: '85 PLN or 100 PLN', rationale: 'Entrance-exam-dependent', status: 'conditional' };
  }

  if (/pg\.edu\.pl/i.test(officialUrl)) {
    if (programName.includes('architecture')) {
      return { fee: convertPlnToEur(150), original_fee: '150 PLN', rationale: 'Safe Gdansk Tech architecture fee', status: 'safe' };
    }
    if (degreeLevel === 'Master') {
      return { fee: convertPlnToEur(85), original_fee: '85 PLN', rationale: 'Safe Gdansk Tech master studies fee', status: 'safe' };
    }
    return { original_fee: '85 PLN or 100 PLN; 150 PLN for Architecture', rationale: 'Bachelor fee can vary by candidate document pathway', status: 'conditional' };
  }

  if (id === 'poland-university-of-warsaw-american-studies-warsaw-bachelor') {
    return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe UW foreign-diploma oral exam fee', status: 'safe' };
  }

  if (id === 'poland-university-of-warsaw-american-studies-warsaw-master') {
    return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe UW oral exam fee', status: 'safe' };
  }

  if (id === 'poland-university-of-warsaw-archeology-warsaw-master') {
    return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe UW archaeology oral exam fee', status: 'safe' };
  }

  if (id === 'poland-university-of-warsaw-english-studies-warsaw-master') {
    return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe UW English Studies written-plus-oral exam fee', status: 'safe' };
  }

  if (id === 'poland-university-of-warsaw-environmental-management-warsaw-master') {
    return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe UW recruitment interview fee', status: 'safe' };
  }

  if (id === 'poland-university-of-warsaw-finance-investments-and-accounting-warsaw-master') {
    return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe UW mathematics entrance exam fee', status: 'safe' };
  }

  if (id === 'poland-university-of-warsaw-international-business-warsaw-master') {
    return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe UW written entrance exam fee', status: 'safe' };
  }

  if (id === 'poland-university-of-warsaw-psychology-warsaw-master') {
    return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe UW psychology interview fee', status: 'safe' };
  }

  if (id === 'poland-university-of-warsaw-teaching-english-to-young-learners-warsaw-master') {
    return { fee: convertPlnToEur(100), original_fee: '100 PLN', rationale: 'Safe UW interview-based admission fee', status: 'safe' };
  }

  if (university === 'University of Warsaw') {
    return { original_fee: '85 PLN or 100 PLN', rationale: 'Programme-level exam rules still vary by pathway', status: 'conditional' };
  }

  if (university === 'The John Paul II Catholic University of Lublin') {
    return { original_fee: '85 PLN or 100 PLN', rationale: 'Programme-specific entrance-exam risk', status: 'conditional' };
  }

  return { rationale: 'No safe fee rule found yet', status: 'unresolved' };
}

function main() {
  const text = fs.readFileSync(INPUT_PATH, 'utf8');
  const parsed = parseCsv(text);
  const headers = parsed[0];
  const rows = parsed.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  );

  let semesterFeeSetToZero = 0;
  let safeApplicationFeeFills = 0;
  let preservedExistingApplicationFees = 0;
  let conditionalRows = 0;
  let unresolvedRows = 0;

  const reviewRows = [];

  const outputRows = rows.map((row) => {
    const next = { ...row };

    if (String(next.semester_fee || '').trim() !== '0') {
      next.semester_fee = '0';
      semesterFeeSetToZero += 1;
    }

    const existingApplicationFee = String(next.application_fee || '').trim();
    if (existingApplicationFee) {
      preservedExistingApplicationFees += 1;
      return next;
    }

    const rule = getSafeFeeRule(next);
    if (rule.status === 'safe') {
      next.application_fee = rule.fee;
      safeApplicationFeeFills += 1;
      return next;
    }

    reviewRows.push({
      id: next.id,
      program_name: next.program_name,
      university_name: next.university_name,
      official_url: next.official_url,
      review_status: rule.status,
      suggested_original_fee_rule: rule.original_fee || '',
      rationale: rule.rationale
    });

    if (rule.status === 'conditional') {
      conditionalRows += 1;
    } else {
      unresolvedRows += 1;
    }

    return next;
  });

  writeCsv(OUTPUT_PATH, headers, outputRows);
  writeCsv(
    REVIEW_PATH,
    ['id', 'program_name', 'university_name', 'official_url', 'review_status', 'suggested_original_fee_rule', 'rationale'],
    reviewRows
  );

  const summary = `# Poland Fee Fill Summary

Date: 2026-05-10

## Output files

- Fee-ready Poland upload: \`poland_final_upload_fee_ready.csv\`
- Remaining review queue: \`scratch/poland_fee_review_queue_2026-05-10.csv\`

## Rules applied

- Set \`semester_fee\` to \`0\` for all ${semesterFeeSetToZero} rows
- Filled ${safeApplicationFeeFills} blank \`application_fee\` rows using safe university/domain rules
- Preserved ${preservedExistingApplicationFees} existing nonblank \`application_fee\` rows

## Remaining queue

- Conditional review rows: ${conditionalRows}
- Unresolved rows: ${unresolvedRows}

## Currency handling note

- PLN-denominated safe fees were converted to EUR-equivalent amounts using the ECB reference rate from 08 May 2026:
  - \`1 EUR = 4.2318 PLN\`
  - \`85 PLN = ${convertPlnToEur(85)} EUR\`
  - \`100 PLN = ${convertPlnToEur(100)} EUR\`
  - \`150 PLN = ${convertPlnToEur(150)} EUR\`

## Why EUR conversion was used

- The current importer stores \`application_fee\` as a number
- The current UI renders application fees with a euro symbol in key program views
- Converting safe PLN fees to EUR avoids uploading values that the current platform would mislabel as euros
`;

  fs.writeFileSync(SUMMARY_PATH, `${summary}\n`, 'utf8');

  console.log(JSON.stringify({
    rows: outputRows.length,
    semesterFeeSetToZero,
    safeApplicationFeeFills,
    preservedExistingApplicationFees,
    conditionalRows,
    unresolvedRows
  }, null, 2));
}

main();
