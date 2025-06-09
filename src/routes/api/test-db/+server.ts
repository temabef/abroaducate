import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
    try {
        // Test 1: Check if we can connect to Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
            return json({ error: 'Not authenticated' }, { status: 401 });
        }
        
        // Test 2: Test all application types with the exact structure sent by PersonalStatementGenerator
        const applicationTypes = [
            'undergraduate', 'scholarship', 'law_school', 'medical_school', 'study_abroad', 'professional'
        ];
        
        const testResults = [];
        
        for (const appType of applicationTypes) {
            // Create test data matching PersonalStatementGenerator structure
            const testData = {
                applicationType: appType,
                institutionName: `Test ${appType} Institution`,
                programName: `Test ${appType} Program`,
                applicationDeadline: '2024-12-31',
                wordLimit: 500,
                customRequests: '',
                personalInfo: {
                    name: 'Test User',
                    email: 'test@example.com',
                    currentEducation: 'Test Education',
                    hometown: 'Test City'
                },
                personalDetails: {
                    formativeExperience: 'Test experience',
                    challengesOvercome: 'Test challenges',
                    valuesAndBeliefs: 'Test values',
                    passionsAndInterests: 'Test passions',
                    communityImpact: 'Test impact',
                    futureGoals: 'Test goals',
                    whyThisProgram: 'Test reason'
                },
                generatedContent: `This is a test personal statement for ${appType} application.`,
                wordCount: 10
            };
            
            // Test the exact insert structure used by the API
            const { data: insertResult, error: insertError } = await supabase
                .from('personal_statements')
                .insert({
                    user_id: session.user.id,
                    application_type: testData.applicationType,
                    program_name: testData.programName,
                    institution_name: testData.institutionName,
                    application_deadline: testData.applicationDeadline || null,
                    form_data: {
                        personalInfo: testData.personalInfo,
                        personalDetails: testData.personalDetails,
                        customRequests: testData.customRequests,
                        wordLimit: testData.wordLimit
                    },
                    generated_content: testData.generatedContent,
                    word_count: testData.wordCount || 0,
                    status: 'draft',
                    version: 1
                })
                .select('id')
                .single();
                
            testResults.push({
                application_type: appType,
                success: !insertError,
                error: insertError,
                id: insertResult?.id
            });
            
            // Clean up test record if successful
            if (insertResult?.id) {
                await supabase
                    .from('personal_statements')
                    .delete()
                    .eq('id', insertResult.id);
            }
        }
        
        // Test 3: Check current table structure
        const { data: sampleRecord, error: sampleError } = await supabase
            .from('personal_statements')
            .select('*')
            .limit(1);
            
        return json({ 
            success: true,
            message: 'Comprehensive database test completed',
            session: true,
            user_id: session.user.id,
            application_type_tests: testResults,
            all_types_working: testResults.every(r => r.success),
            failing_types: testResults.filter(r => !r.success).map(r => r.application_type),
            sample_record_structure: sampleRecord?.[0] || null,
            database_accessible: !sampleError
        });
        
    } catch (error) {
        console.error('Database test error:', error);
        return json({ 
            error: 'Database test failed', 
            details: error 
        }, { status: 500 });
    }
}; 