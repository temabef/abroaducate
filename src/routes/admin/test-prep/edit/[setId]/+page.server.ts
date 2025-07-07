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

  // sort questions and choices by sort_order if it exists
  set.practice_questions.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  set.practice_questions.forEach(q => {
    q.practice_choices.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  });

  return { set };
};

export const actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const setData = JSON.parse(formData.get('set') as string);

    // Fetch the IELTS test ID dynamically
    const { data: testRow, error: testError } = await supabase
      .from('practice_tests')
      .select('id')
      .eq('slug', 'ielts')
      .single();
    if (testError || !testRow) {
      return fail(500, { message: 'Failed to fetch IELTS test ID', error: testError });
    }
    const testId = testRow.id;

    // 1. Upsert the practice_set details
    const { data: savedSet, error: setEror } = await supabase
      .from('practice_sets')
      .upsert({
        id: setData.id.startsWith('new-') ? undefined : setData.id,
        title: setData.title,
        section: setData.section,
        passage: setData.passage,
        sort_order: setData.sort_order,
        test_id: testId
      })
      .select()
      .single();

    if (setEror) return fail(500, { message: 'Failed to save set details', error: setEror });
    if (!savedSet) return fail(500, { message: 'Failed to get saved set' });

    const newSetId = savedSet.id;

    // Get original questions to find out which ones to delete
    const { data: originalQuestions } = await supabase.from('practice_questions').select('id').eq('set_id', newSetId);
    const originalQuestionIds = originalQuestions?.map(q => q.id) || [];
    const submittedQuestionIds = setData.practice_questions.map(q => q.id.startsWith('new-') ? undefined : q.id).filter(Boolean);

    // 2. Delete questions that were removed in the UI
    const questionsToDelete = originalQuestionIds.filter(id => !submittedQuestionIds.includes(id));
    if (questionsToDelete.length > 0) {
      await supabase.from('practice_questions').delete().in('id', questionsToDelete);
    }

    // 3. Upsert questions
    for (const question of setData.practice_questions) {
      const { data: savedQuestion, error: qError } = await supabase
        .from('practice_questions')
        .upsert({
          id: question.id.startsWith('new-') ? undefined : question.id,
          set_id: newSetId,
          question_text: question.question_text,
          explanation: question.explanation,
          sort_order: question.sort_order
        })
        .select()
        .single();
        
      if (qError) return fail(500, { message: 'Failed to save a question', error: qError });

      const newQuestionId = savedQuestion.id;

      // Get original choices to find out which ones to delete
      const { data: originalChoices } = await supabase.from('practice_choices').select('id').eq('question_id', newQuestionId);
      const originalChoiceIds = originalChoices?.map(c => c.id) || [];
      const submittedChoiceIds = question.practice_choices.map(c => c.id.startsWith('new-') ? undefined : c.id).filter(Boolean);

      // 4. Delete choices that were removed
      const choicesToDelete = originalChoiceIds.filter(id => !submittedChoiceIds.includes(id));
      if (choicesToDelete.length > 0) {
        await supabase.from('practice_choices').delete().in('id', choicesToDelete);
      }
      
      // 5. Upsert choices
      if (question.practice_choices?.length) {
        const choicesToSave = question.practice_choices.map(choice => ({
          id: choice.id.startsWith('new-') ? undefined : choice.id,
          question_id: newQuestionId,
          choice_text: choice.choice_text,
          is_correct: choice.is_correct
        }));
        const { error: cError } = await supabase.from('practice_choices').upsert(choicesToSave);
        if (cError) return fail(500, { message: 'Failed to save choices', error: cError });
      }
    }

    throw redirect(303, '/admin/test-prep');
  }
}; 