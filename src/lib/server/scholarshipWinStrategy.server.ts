import { OPENAI_API_KEY } from '$env/static/private';
import { createHash } from 'node:crypto';

export type WinStrategyRubricItem = {
  key: string;
  label: string;
  weight: 0 | 1 | 2 | 3;
  reason: string;
};

export type ScholarshipWinStrategy = {
  version: number;
  summary: string;
  rubric: WinStrategyRubricItem[];
  top_actions: string[];
  evidence: string[];
  red_flags: string[];
  narrative_angles: string[];
};

function truncate(s: string, max = 8000): string {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n\n[TRUNCATED: ${s.length - max} chars removed]`;
}

export function computeScholarshipSourceHash(scholarship: any): string {
  const src = JSON.stringify(
    {
      title: scholarship?.title,
      provider: scholarship?.provider,
      description: scholarship?.description,
      funding_category: scholarship?.funding_category,
      application_method: scholarship?.application_method,
      level: scholarship?.level,
      field: scholarship?.field,
      location: scholarship?.location,
      min_gpa: scholarship?.min_gpa,
      min_ielts: scholarship?.min_ielts,
      min_toefl: scholarship?.min_toefl,
      age_limit: scholarship?.age_limit,
      nationality_restrictions: scholarship?.nationality_restrictions,
      website: scholarship?.website,
      deadline: scholarship?.deadline
    },
    null,
    0
  );
  return createHash('sha256').update(src).digest('hex');
}

function buildPrompt(scholarship: any): string {
  const payload = {
    title: scholarship?.title,
    provider: scholarship?.provider,
    country_or_location: scholarship?.location,
    level: scholarship?.level,
    field: scholarship?.field,
    funding_category: scholarship?.funding_category,
    application_method: scholarship?.application_method,
    deadline: scholarship?.deadline,
    eligibility: {
      min_gpa: scholarship?.min_gpa,
      min_ielts: scholarship?.min_ielts,
      min_toefl: scholarship?.min_toefl,
      age_limit: scholarship?.age_limit,
      nationality_restrictions: scholarship?.nationality_restrictions
    },
    description: truncate(String(scholarship?.description || ''))
  };

  return `You are an expert scholarship selection analyst and admissions strategist.

Your job: given a scholarship listing, infer what the committee is selecting for, and produce a structured "Preferred Candidate Plan" that helps an applicant increase their odds. You MUST be honest: you cannot guarantee selection. You should focus on evidence, positioning, and application execution.

Return ONLY valid JSON matching this exact TypeScript-like shape (no markdown):
{
  "version": 1,
  "summary": "1-2 sentences describing what this scholarship likely rewards",
  "rubric": [
    { "key": "leadership_impact", "label": "Leadership & impact", "weight": 0|1|2|3, "reason": "..." },
    { "key": "academics", "label": "Academic strength", "weight": 0|1|2|3, "reason": "..." },
    { "key": "research_fit", "label": "Research / fit", "weight": 0|1|2|3, "reason": "..." },
    { "key": "need_based", "label": "Financial need", "weight": 0|1|2|3, "reason": "..." },
    { "key": "regional_targeting", "label": "Region targeting", "weight": 0|1|2|3, "reason": "..." },
    { "key": "essay_story", "label": "Essay & positioning", "weight": 0|1|2|3, "reason": "..." }
  ],
  "top_actions": ["5-8 bullet points, concrete, scholarship-specific where possible"],
  "evidence": ["3-8 bullet points of proofs to gather"],
  "red_flags": ["3-8 bullet points of common rejection reasons for this type"],
  "narrative_angles": ["2-5 suggested story angles/frames to use in essays/SOP"]
}

Rules:
- Use weight 3 = High, 2 = Medium, 1 = Low, 0 = Not a focus.
- If a category is unknown, use Low/Not a focus, and explain uncertainty in the reason.
- Do not invent program-specific facts not present; infer only from the listing.
- Keep it actionable and practical for international students.

Scholarship listing JSON:
${JSON.stringify(payload, null, 2)}
`;
}

async function callOpenAIJson(prompt: string, model: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenAI API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

function extractJsonLoose(raw: string): any {
  // response_format should already ensure valid JSON, but keep a fallback.
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error('Model returned non-JSON output');
  }
}

export async function generateScholarshipWinStrategy(args: {
  scholarship: any;
  model: string;
}): Promise<ScholarshipWinStrategy> {
  const prompt = buildPrompt(args.scholarship);
  const raw = await callOpenAIJson(prompt, args.model, 1600);
  const parsed = extractJsonLoose(raw);
  return parsed as ScholarshipWinStrategy;
}

