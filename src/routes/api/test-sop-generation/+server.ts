import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ locals: { supabase, getSession } }) => {
    const session = await getSession();
    
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        console.log('Testing SOP generation...');
        
        // Simple test data
        const testFormData = {
            universityData: {
                university: 'Test University',
                country: 'United States',
                program: 'Master of Science in Computer Science'
            },
            academicData: {
                degreeType: 'Bachelor of Science',
                fieldOfStudy: 'Computer Science',
                universityName: 'Test College',
                gpa: '3.8'
            },
            selectedQualities: ['academic-excellence', 'research-opportunities'],
            selectedAspirations: ['Advance my career to senior/executive level'],
            customAspiration: '',
            isBestChoiceSelected: false,
            isCustomQuality: false,
            customQualityReason: '',
            showWorkExperienceForm: false,
            workExperiences: [],
            showOrganizationsForm: false,
            organizations: [],
            showCommunityServiceForm: false,
            communityServices: [],
            showHobbiesForm: false,
            hobbies: '',
            showAchievementsForm: false,
            relevantCourses: [],
            projects: [],
            achievements: []
        };
        
        // Test OpenAI API directly
        const prompt = `Generate a simple 200-word Statement of Purpose for a Master's program in Computer Science at Test University. The applicant has a Bachelor's in Computer Science with a 3.8 GPA.`;
        
        console.log('Making OpenAI API request...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert academic writer specializing in Statement of Purpose documents.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });
        
        console.log('OpenAI response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', errorText);
            return json({ 
                error: 'OpenAI API failed', 
                status: response.status,
                details: errorText 
            }, { status: 500 });
        }
        
        const aiResponse = await response.json();
        console.log('OpenAI response received');
        
        if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
            console.error('Invalid OpenAI response structure:', aiResponse);
            return json({ error: 'Invalid OpenAI response' }, { status: 500 });
        }
        
        const generatedText = aiResponse.choices[0].message.content.trim();
        console.log('Generated text length:', generatedText.length);
        
        // Test database insert
        console.log('Testing database insert...');
        const { data: insertData, error: insertError } = await supabase
            .from('sops')
            .insert({
                user_id: session.user.id,
                content: generatedText,
                original_content: generatedText,
                university_name: 'Test University',
                program_name: 'Master of Science in Computer Science',
                word_count: generatedText.split(/\s+/).length,
                form_data: testFormData,
                status: 'draft'
            })
            .select()
            .single();
            
        if (insertError) {
            console.error('Database insert error:', insertError);
            return json({ 
                error: 'Database insert failed', 
                details: insertError.message 
            }, { status: 500 });
        }
        
        console.log('✅ Test completed successfully');
        
        return json({
            success: true,
            message: 'SOP generation test completed successfully',
            generatedText: generatedText.substring(0, 200) + '...',
            sopId: insertData?.id,
            wordCount: generatedText.split(/\s+/).length
        });
        
    } catch (error) {
        console.error('Test error:', error);
        return json({ 
            error: 'Test failed', 
            details: error.message || 'Unknown error' 
        }, { status: 500 });
    }
};
