import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { text, editType, context, documentType = 'sop', positionType } = await request.json();

    if (!text || !editType) {
      return json({ error: 'Text and edit type are required' }, { status: 400 });
    }

    // Define prompts based on document type and edit type
    const prompts = getEditPrompts(documentType, editType, positionType);
    
    if (!prompts[editType as keyof typeof prompts]) {
      return json({ error: 'Invalid edit type' }, { status: 400 });
    }

    const prompt = `${prompts[editType as keyof typeof prompts]}

Original text: "${text}"

Context (surrounding content): "${context.substring(0, 500)}..."

Please provide only the improved version of the text, maintaining the same general meaning and flow but applying the requested improvement. Keep the response focused and concise.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert editor specializing in ${documentType === 'cover_letter' ? 'professional cover letters' : 'academic statements of purpose'}. Provide clear, improved text that maintains the original meaning while applying the requested style change.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const editedText = response.choices[0]?.message?.content?.trim();

    if (!editedText) {
      throw new Error('No response from OpenAI');
    }

    return json({
      success: true,
      editedText,
      originalText: text,
      editType
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
      
      concise: `Make this text more concise and impactful. Remove unnecessary words, combine related ideas, and strengthen key points. Maintain all important information while improving clarity and brevity.`
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