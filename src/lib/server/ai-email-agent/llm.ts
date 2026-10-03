import { env } from '$env/dynamic/private';

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface LLMOptions {
	messages: ChatMessage[];
	temperature?: number;
	maxTokens?: number;
	responseFormatJson?: boolean;
}

export interface LLMResponse {
	content: string;
	modelUsed: string;
	usage?: {
		promptTokens?: number;
		completionTokens?: number;
		totalTokens?: number;
	};
}

/**
 * Calls OpenAI Chat Completions API with fallback error handling.
 */
async function callOpenAI(options: LLMOptions, apiKey: string, modelName = 'gpt-4o-mini'): Promise<LLMResponse> {
	const bodyPayload: Record<string, any> = {
		model: modelName,
		messages: options.messages,
		temperature: options.temperature ?? 0.3,
		max_tokens: options.maxTokens ?? 1500
	};

	if (options.responseFormatJson) {
		bodyPayload.response_format = { type: 'json_object' };
	}

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(bodyPayload)
	});

	if (!response.ok) {
		const errText = await response.text();
		throw new Error(`OpenAI API error [${response.status}]: ${errText}`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content || '';

	return {
		content: content.trim(),
		modelUsed: data.model || modelName,
		usage: {
			promptTokens: data.usage?.prompt_tokens,
			completionTokens: data.usage?.completion_tokens,
			totalTokens: data.usage?.total_tokens
		}
	};
}

/**
 * Calls Google Gemini REST API.
 */
async function callGemini(options: LLMOptions, apiKey: string, modelName = 'gemini-1.5-flash'): Promise<LLMResponse> {
	// Convert OpenAI messages to Gemini contents & systemInstruction
	let systemText = '';
	const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

	for (const msg of options.messages) {
		if (msg.role === 'system') {
			systemText += (systemText ? '\n\n' : '') + msg.content;
		} else {
			contents.push({
				role: msg.role === 'assistant' ? 'model' : 'user',
				parts: [{ text: msg.content }]
			});
		}
	}

	const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

	const bodyPayload: Record<string, any> = {
		contents,
		generationConfig: {
			temperature: options.temperature ?? 0.3,
			maxOutputTokens: options.maxTokens ?? 1500
		}
	};

	if (systemText) {
		bodyPayload.systemInstruction = {
			parts: [{ text: systemText }]
		};
	}

	if (options.responseFormatJson) {
		bodyPayload.generationConfig.responseMimeType = 'application/json';
	}

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(bodyPayload)
	});

	if (!response.ok) {
		const errText = await response.text();
		throw new Error(`Gemini API error [${response.status}]: ${errText}`);
	}

	const data = await response.json();
	const candidate = data.candidates?.[0];
	const content = candidate?.content?.parts?.map((p: any) => p.text).join('') || '';

	return {
		content: content.trim(),
		modelUsed: modelName,
		usage: {
			promptTokens: data.usageMetadata?.promptTokenCount,
			completionTokens: data.usageMetadata?.candidatesTokenCount,
			totalTokens: data.usageMetadata?.totalTokenCount
		}
	};
}

/**
 * Universal LLM caller. Automatically picks Gemini or OpenAI based on available environment variables.
 */
export async function executeLLM(options: LLMOptions, preferredModel?: string): Promise<LLMResponse> {
	const geminiKey = env.GEMINI_API_KEY || (process.env as any)?.GEMINI_API_KEY;
	const openAIKey = env.OPENAI_API_KEY || (process.env as any)?.OPENAI_API_KEY;

	// If preferredModel explicitly specifies gemini or if GEMINI_API_KEY is given and OPENAI isn't
	if (preferredModel?.toLowerCase().includes('gemini') && geminiKey) {
		return callGemini(options, geminiKey, preferredModel);
	}

	// Default to OpenAI if available
	if (openAIKey) {
		const model = preferredModel || 'gpt-4o-mini';
		return callOpenAI(options, openAIKey, model);
	}

	// Fallback to Gemini if only Gemini key is available
	if (geminiKey) {
		return callGemini(options, geminiKey, preferredModel || 'gemini-1.5-flash');
	}

	throw new Error('No LLM API keys found. Please set OPENAI_API_KEY or GEMINI_API_KEY in your environment.');
}
