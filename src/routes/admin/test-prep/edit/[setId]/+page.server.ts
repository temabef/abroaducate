import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase } }) => {
  const { setId } = params;

  if (setId === 'new') {
    // Return a default structure for creating a new set
    return {
      set: {
        id: 'new',
        title: '',
        section: 'reading',
        sort_order: 0,
        passage: '',
        practice_questions: []
      }
    };
  }

  // Fetch the existing set and its related questions and choices
  const { data: set, error: err } = await supabase
    .from('practice_sets')
    .select(`
      *,
      practice_questions (
        *,
        practice_choices (*)
      )
    `)
    .eq('id', setId)
    .single();

  if (err) {
    throw error(404, {
      message: `Practice set not found: ${err.message}`
    });
  }

  // Sort questions and choices by sort_order if it exists
  set.practice_questions.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  set.practice_questions.forEach(q => {
    if (q.practice_choices) {
      q.practice_choices.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  });

  return { set };
};

export const actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const setData = JSON.parse(formData.get('set') as string);

    console.log('Processing set data:', setData);

    // Validate section type
    const validSections = ['reading', 'listening', 'writing', 'speaking'];
    if (!validSections.includes(setData.section)) {
      return fail(400, { message: 'Invalid section type' });
    }

    // Fetch the test ID dynamically based on the section
    let testSlug = 'ielts'; // Default to IELTS for now
    
    const { data: testRow, error: testError } = await supabase
      .from('practice_tests')
      .select('id')
      .eq('slug', testSlug)
      .single();
      
    if (testError || !testRow) {
      console.error('Test fetch error:', testError);
      return fail(500, { message: 'Failed to fetch test ID', error: testError });
    }
    
    const testId = testRow.id;

    try {
      // 1. Upsert the practice_set details
      const setToSave = {
        id: setData.id === 'new' || setData.id.startsWith('new-') ? undefined : setData.id,
        title: setData.title,
        section: setData.section,
        sort_order: setData.sort_order || 0,
        test_id: testId
      };

      // Only add passage for reading sections
      if (setData.section === 'reading' && setData.passage) {
        setToSave.passage = setData.passage;
      }

      const { data: savedSet, error: setError } = await supabase
        .from('practice_sets')
        .upsert(setToSave)
        .select()
        .single();

      if (setError) {
        console.error('Set save error:', setError);
        return fail(500, { message: 'Failed to save set details', error: setError });
      }
      
      if (!savedSet) {
        return fail(500, { message: 'Failed to get saved set' });
      }

      const newSetId = savedSet.id;
      console.log('Saved set with ID:', newSetId);

      // 2. Handle questions - Get original questions for cleanup
      const { data: originalQuestions } = await supabase
        .from('practice_questions')
        .select('id')
        .eq('set_id', newSetId);
        
      const originalQuestionIds = originalQuestions?.map(q => q.id) || [];
      const submittedQuestionIds = setData.practice_questions
        .map(q => q.id.startsWith('new-') ? undefined : q.id)
        .filter(Boolean);

      // Delete questions that were removed in the UI
      const questionsToDelete = originalQuestionIds.filter(id => !submittedQuestionIds.includes(id));
      if (questionsToDelete.length > 0) {
        console.log('Deleting questions:', questionsToDelete);
        const { error: deleteError } = await supabase
          .from('practice_questions')
          .delete()
          .in('id', questionsToDelete);
          
        if (deleteError) {
          console.error('Question delete error:', deleteError);
        }
      }

      // 3. Process each question
      for (let i = 0; i < setData.practice_questions.length; i++) {
        const question = setData.practice_questions[i];
        
        console.log(`Processing question ${i + 1}:`, question);

        const questionToSave = {
          id: question.id.startsWith('new-') ? undefined : question.id,
          set_id: newSetId,
          question_text: question.question_text,
          explanation: question.explanation || null,
          sort_order: question.sort_order || (i + 1)
        };

        const { data: savedQuestion, error: qError } = await supabase
          .from('practice_questions')
          .upsert(questionToSave)
          .select()
          .single();
          
        if (qError) {
          console.error('Question save error:', qError);
          return fail(500, { message: `Failed to save question ${i + 1}`, error: qError });
        }

        const newQuestionId = savedQuestion.id;
        console.log(`Saved question with ID: ${newQuestionId}`);

        // 4. Handle choices (only for sections that support them)
        const sectionsWithChoices = ['reading', 'listening'];
        if (sectionsWithChoices.includes(setData.section) && question.practice_choices) {
          
          // Get original choices for cleanup
          const { data: originalChoices } = await supabase
            .from('practice_choices')
            .select('id')
            .eq('question_id', newQuestionId);
            
          const originalChoiceIds = originalChoices?.map(c => c.id) || [];
          const submittedChoiceIds = question.practice_choices
            .map(c => c.id.startsWith('new-') ? undefined : c.id)
            .filter(Boolean);

          // Delete choices that were removed
          const choicesToDelete = originalChoiceIds.filter(id => !submittedChoiceIds.includes(id));
          if (choicesToDelete.length > 0) {
            console.log('Deleting choices:', choicesToDelete);
            const { error: deleteChoiceError } = await supabase
              .from('practice_choices')
              .delete()
              .in('id', choicesToDelete);
              
            if (deleteChoiceError) {
              console.error('Choice delete error:', deleteChoiceError);
            }
          }

          // Save choices
          if (question.practice_choices.length > 0) {
            const choicesToSave = question.practice_choices.map((choice, index) => ({
              id: choice.id.startsWith('new-') ? undefined : choice.id,
              question_id: newQuestionId,
              choice_text: choice.choice_text,
              is_correct: choice.is_correct,
              sort_order: index + 1
            }));

            console.log('Saving choices:', choicesToSave);
            
            const { error: cError } = await supabase
              .from('practice_choices')
              .upsert(choicesToSave);
              
            if (cError) {
              console.error('Choice save error:', cError);
              return fail(500, { message: `Failed to save choices for question ${i + 1}`, error: cError });
            }
          }
        }
      }

      console.log('✅ Successfully saved question set');
      throw redirect(303, '/admin/test-prep');
      
    } catch (err) {
      if (err?.status === 303) {
        // This is a redirect, re-throw it
        throw err;
      }
      
      console.error('Unexpected error:', err);
      return fail(500, { 
        message: 'An unexpected error occurred while saving',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
}; 