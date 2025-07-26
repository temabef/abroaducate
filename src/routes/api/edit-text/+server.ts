import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits';

// Get AI model based on user's plan (matches pricing page)
function getModelByPlan(planType: string): string {
  switch (planType) {
    case 'free':
      return 'gpt-3.5-turbo'; // Free plan uses GPT-3.5
    case 'professional':
      return 'gpt-4o-mini';   // Professional plan uses GPT-4o-mini
    case 'elite':
      return 'gpt-4o';        // Elite plan uses GPT-4o
    default:
      return 'gpt-3.5-turbo'; // Default to free plan model
  }
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Define schema for validation
    const editTextSchema = z.object({
      text: z.string().min(1).max(10000),
      editType: z.enum(['improve', 'shorten', 'expand', 'formalize', 'simplify', 'academic']),
      context: z.string().max(2000).optional().default(''),
      documentType: z.enum(['sop', 'cover_letter', 'personal_statement', 'cv']).default('sop'),
      positionType: z.string().max(100).optional().default('')
    });

    const requestData = await request.json();

    // Validate and sanitize input
    const parsed = editTextSchema.safeParse(requestData);
    if (!parsed.success) {
      return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    if (!data.text || !data.editType) {
      return json({ error: 'Text and edit type are required' }, { status: 400 });
    }

    // Check inline editing usage limits using new comprehensive system
    const usageCheck = await checkComprehensiveUsageLimit(session.user.id, 'inline_edits');
    
    if (!usageCheck.allowed) {
      return json({
        error: 'Inline editing limit exceeded',
        message: usageCheck.message || `You've reached your monthly inline editing limit. Upgrade to get more edits.`,
        planType: usageCheck.planType,
        currentUsage: usageCheck.currentUsage,
        limit: usageCheck.limit,
        upgradeRequired: true,
        usageData: {
          planType: usageCheck.planType,
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
          usageType: 'inline_edits'
        }
      }, { status: 403 });
    }

    // Define prompts based on document type and edit type
    const prompts = getEditPrompts(data.documentType, data.editType, data.positionType);
    
    if (!prompts[data.editType as keyof typeof prompts]) {
      return json({ error: 'Invalid edit type' }, { status: 400 });
    }

    const prompt = `${prompts[data.editType as keyof typeof prompts]}

Original text: "${data.text.trim()}"

Context (surrounding content): "${data.context.substring(0, 500)}..."

Please provide only the improved version of the text, maintaining the same general meaning and flow but applying the requested improvement. Keep the response focused and concise.`;

    // Use AI model based on user's plan as specified in pricing
    const model = getModelByPlan(usageCheck.planType);

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are an expert editor specializing in ${data.documentType === 'cover_letter' ? 'professional cover letters' : data.documentType === 'personal_statement' ? 'personal statements' : 'academic statements of purpose'}. Provide clear, improved text that maintains the original meaning while applying the requested style change.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const editedText = response.choices[0]?.message?.content?.trim();

    if (!editedText) {
      throw new Error('No response from OpenAI');
    }

    // Increment usage counter after successful edit
    const incrementSuccess = await incrementComprehensiveUsage(session.user.id, 'inline_edits');
    
    if (!incrementSuccess) {
      console.warn('Failed to increment inline editing usage for user:', session.user.id);
    }

    // Get updated usage data for frontend
    const updatedUsageCheck = await checkComprehensiveUsageLimit(session.user.id, 'inline_edits');

    return json({
      success: true,
      editedText,
      originalText: data.text,
      editType: data.editType,
      modelUsed: model,
      usageData: {
        planType: updatedUsageCheck.planType,
        currentUsage: updatedUsageCheck.currentUsage,
        limit: updatedUsageCheck.limit,
        usageType: 'inline_edits',
        remainingEdits: updatedUsageCheck.limit ? (updatedUsageCheck.limit - updatedUsageCheck.currentUsage) : null
      }
    });

  } catch (error) {
    console.error('Error in edit-text API:', error);
    return json({ 
      error: 'Failed to edit text. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

function getEditPrompts(documentType: string, editType: string, positionType?: string) {
  if (documentType === 'cover_letter') {
    return {
      professional: `Make this text more professional and polished for a ${positionType || 'professional'} position. Use confident, business-appropriate language that demonstrates competence and professionalism. Avoid casual expressions and ensure proper tone.`,
      
      confident: `Rewrite this text to sound more confident and assertive. Use strong action verbs, quantifiable achievements, and eliminate any tentative language. Show conviction and self-assurance while remaining professional.`,
      
      industry: `Adapt this text to better align with ${positionType || 'industry'} standards and expectations. Use relevant terminology, highlight applicable skills, and demonstrate knowledge of the field. Make it more targeted and specific.`,
      
      concise: `Make this text more concise and impactful. Remove unnecessary words, combine related ideas, and strengthen key points. Maintain all important information while improving clarity and brevity.`,
      
      detailed: `Expand this text with more specific examples, achievements, and details. Add concrete evidence of your qualifications and make your value proposition more compelling.`,
      
      persuasive: `Make this text more persuasive and compelling. Use stronger language, highlight unique value, and create urgency. Focus on benefits to the employer and what makes you stand out.`
    };
  } else if (documentType === 'personal_statement') {
    return {
      make_personal: `Make this text more personal and authentic. Use first-person narrative effectively, include specific personal experiences, and ensure the voice feels genuine and individual. Show personality while maintaining academic appropriateness.`,
      
      more_reflective: `Enhance this text with more reflection and introspection. Show deeper self-awareness, personal growth, and thoughtful analysis of experiences. Demonstrate how experiences shaped your perspectives and goals.`,
      
      add_detail: `Expand this text with more specific details, examples, and personal anecdotes. Add concrete experiences that illustrate your points. Make the narrative more vivid and engaging with specific examples.`,
      
      concise: `Make this text more concise while preserving the personal narrative and key experiences. Remove unnecessary words and tighten the writing while maintaining the personal touch and emotional impact.`
    };
  } else {
    // SOP editing prompts
    return {
      concise: `Make this text more concise while maintaining all key information and academic rigor. Remove redundancy and unnecessary words, but keep the scholarly tone appropriate for academic applications.`,
      
      detailed: `Expand this text with more specific details, examples, and elaboration. Add depth and substance while maintaining academic appropriateness. Include concrete examples where relevant.`,
      
      research: `Enhance this text to better emphasize research aspects, methodologies, and academic inquiry. Use appropriate academic language and highlight research-oriented thinking and approaches.`,
      
      academic: `Refine this text to sound more academic and scholarly. Use appropriate academic terminology, improve the intellectual tone, and ensure it meets academic writing standards.`,
      
      technical: `Make this text more technical and precise. Use specific terminology, add technical details where appropriate, and demonstrate deeper technical understanding of the subject matter.`
    };
  }
} 