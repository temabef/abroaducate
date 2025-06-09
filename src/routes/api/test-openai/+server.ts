import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async () => {
    try {
        console.log('Testing OpenAI API connection...');
        console.log('API Key available:', !!OPENAI_API_KEY);
        console.log('API Key length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);
        console.log('API Key starts with:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 7) : 'N/A');
        
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('OpenAI API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', errorText);
            return json({ 
                success: false, 
                error: `OpenAI API error: ${response.status}`,
                details: errorText
            }, { status: 500 });
        }
        
        const data = await response.json();
        console.log('OpenAI API test successful');
        
        return json({ 
            success: true, 
            message: 'OpenAI API is accessible',
            modelsCount: data.data ? data.data.length : 0
        });
        
    } catch (error) {
        console.error('Test OpenAI API error:', error);
        const errorDetails = error instanceof Error ? {
            message: error.message,
            name: error.name
        } : { message: JSON.stringify(error) };
        
        return json({ 
            success: false,
            error: 'Failed to test OpenAI API',
            details: errorDetails.message
        }, { status: 500 });
    }
}; 