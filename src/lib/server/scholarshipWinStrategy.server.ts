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
    program_name: scholarship?.title,
    university: scholarship?.provider,
    country: scholarship?.location,
    degree_level: scholarship?.level,
    tuition: scholarship?.tuition,
    application_requirements: scholarship?.application_requirements,
    rubric_criteria: scholarship?.rubric_criteria,
    funding_opportunities: scholarship?.funding_category,
    description: truncate(String(scholarship?.description || ''))
  };

  const hasDocument = String(scholarship?.description || '').includes('USER DOCUMENT CONTEXT') &&
    !String(scholarship?.description || '').includes('No additional document provided');

  return `You are an elite university admissions coach specialising in international scholarship applications.

A student has shared their profile${hasDocument ? ' AND their actual application document (SOP/CV)' : ''} for a specific scholarship. Your job is to give them a consultant-grade, actionable strategy to maximise their chances.

SPEAK DIRECTLY TO THE STUDENT in second person ("You", "Your"). Never say "The candidate".
Be aspirational but brutally honest. Reference their actual numbers (GPA, IELTS) and — if a document was provided — critique it specifically.

${hasDocument ? `DOCUMENT REVIEW INSTRUCTIONS:
- Read the student's document carefully
- Identify the 2-3 strongest sentences/paragraphs and say why they work
- Identify the 2-3 weakest areas and give SPECIFIC rewrite suggestions
- Tell them exactly what to add, remove, or restructure to align with this scholarship's values
- If their SOP is weak on a key criterion, write a sample sentence they could use` : `NO DOCUMENT PROVIDED:
- Strongly encourage them to upload their SOP/CV for a deeper assessment
- Explain what a strong SOP for this specific scholarship should contain`}

Return ONLY valid JSON (no markdown):
{
  "version": 2,
  "summary": "2-3 sentences: Aspirational coaching assessment. Reference their actual GPA/scores if provided.",
  "rubric": [
    { "key": "gpa_match", "label": "Academic Foundation", "weight": 0|1|2|3, "reason": "Specific: Your GPA X vs program min Y. What this means for your application." },
    { "key": "language_proof", "label": "Language Alignment", "weight": 0|1|2|3, "reason": "Do your scores meet IELTS/TOEFL requirements? What to do if not." },
    { "key": "field_alignment", "label": "Field Relevance", "weight": 0|1|2|3, "reason": "How well your background matches this program's focus." },
    { "key": "document_strength", "label": "Document Strength", "weight": 0|1|2|3, "reason": "${hasDocument ? 'Honest assessment of the provided document. What is strong, what is weak.' : 'No document provided — upload your SOP/CV for a full assessment.'}" }
  ],
  "document_audit": [
    "${hasDocument
      ? '3-5 specific, actionable insights about the document. Format each as: [STRENGTH/WEAKNESS/SUGGESTION]: specific observation. Include at least one sample rewrite if there is a weak section.'
      : '2-3 points explaining what a strong SOP for this scholarship should contain and why uploading one would improve this strategy.'}"
  ],
  "top_actions": ["5-7 chronological, specific actions. Start with document improvements if a document was provided."],
  "evidence": ["3-5 specific documents or proofs to gather now"],
  "red_flags": ["1-3 risks framed as areas to bridge, not failures"],
  "narrative_angles": ["2-3 SOP story angles that connect the student's background to this scholarship's values"]
}

Rules:
- Weight 3 = Critical, 2 = Important, 1 = Minor, 0 = Not relevant
- Always reference actual GPA and language scores if provided
- If a document was provided, every document_audit item must reference specific content from it
- Be specific — generic advice wastes the user's credit

Program + Candidate data:
${JSON.stringify(payload, null, 2)}
`;
}


async function callOpenAIJson(prompt: string, model: string, maxTokens: number): Promise<string> {
  // Fail fast if key is missing
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set in environment');

  // 50-second timeout so the frontend never hangs forever
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50000);

  try {
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
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`OpenAI API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content ?? '';
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('OpenAI request timed out after 25 seconds');
    throw e;
  } finally {
    clearTimeout(timeout);
  }
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
  const raw = await callOpenAIJson(prompt, args.model, 1200);
  const parsed = extractJsonLoose(raw);
  return parsed as ScholarshipWinStrategy;
}

