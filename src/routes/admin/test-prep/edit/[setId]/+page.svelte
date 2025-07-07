<script lang="ts">
  import { page } from '$app/stores';
  import { Trash2, PlusCircle } from 'lucide-svelte';

  export let data;
  let { set } = data;

  // Ensure questions and choices are always arrays
  set.practice_questions = set.practice_questions || [];
  set.practice_questions.forEach(q => {
    q.practice_choices = q.practice_choices || [];
  });

  function addQuestion() {
    set.practice_questions = [
      ...set.practice_questions,
      {
        id: `new-${Date.now()}`, // temp ID
        question_text: '',
        explanation: '',
        practice_choices: []
      }
    ];
  }

  function removeQuestion(questionId: string) {
    set.practice_questions = set.practice_questions.filter(q => q.id !== questionId);
  }

  function addChoice(questionId: string) {
    const question = set.practice_questions.find(q => q.id === questionId);
    if (question) {
      question.practice_choices = [
        ...question.practice_choices,
        {
          id: `new-${Date.now()}`, // temp ID
          choice_text: '',
          is_correct: false
        }
      ];
    }
  }

  function removeChoice(questionId: string, choiceId: string) {
    const question = set.practice_questions.find(q => q.id === questionId);
    if (question) {
      question.practice_choices = question.practice_choices.filter(c => c.id !== choiceId);
    }
  }

  function setCorrectChoice(questionId: string, correctChoiceId: string) {
    const question = set.practice_questions.find(q => q.id === questionId);
    if (question) {
      question.practice_choices.forEach(c => {
        c.is_correct = c.id === correctChoiceId;
      });
      // a little hack to force svelte to re-render
      set.practice_questions = [...set.practice_questions];
    }
  }
</script>

<form method="POST" class="container mx-auto p-4">
  <input type="hidden" name="set" value={JSON.stringify(set)} />

  <h1 class="text-3xl font-bold mb-6">
    {set.id === 'new' ? 'Create New Practice Set' : `Editing: ${set.title}`}
  </h1>

  <!-- Main Set Details Form -->
  <div class="bg-white p-6 rounded-lg shadow-md mb-8">
    <h2 class="text-xl font-semibold mb-4">Set Details</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-1">
        <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
        <input type="text" id="title" bind:value={set.title} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
      </div>
      <div class="md:col-span-1">
        <label for="section" class="block text-sm font-medium text-gray-700">Section</label>
        <input type="text" id="section" bind:value={set.section} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
      </div>
      <div class="md:col-span-1">
        <label for="sort_order" class="block text-sm font-medium text-gray-700">Sort Order</label>
        <input type="number" id="sort_order" bind:value={set.sort_order} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
      </div>
    </div>
    <div class="mt-6">
      <label for="passage" class="block text-sm font-medium text-gray-700">Passage</label>
      <textarea id="passage" bind:value={set.passage} rows="10" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
    </div>
  </div>

  <!-- Questions Manager -->
  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Questions</h2>
      <button on:click={addQuestion} class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
        <PlusCircle size={18} />
        Add Question
      </button>
    </div>

    <div class="space-y-6">
      {#each set.practice_questions as question, qIndex (question.id)}
        <div class="border border-gray-200 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold text-lg">Question {qIndex + 1}</h3>
            <button on:click={() => removeQuestion(question.id)} class="text-red-500 hover:text-red-700">
              <Trash2 size={20} />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Question Text</label>
              <input type="text" bind:value={question.question_text} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Explanation</label>
              <input type="text" bind:value={question.explanation} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
            </div>

            <!-- Choices Manager -->
            <div class="pl-4 border-l-4 border-gray-100">
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold">Choices</h4>
                <button on:click={() => addChoice(question.id)} class="flex items-center gap-1 text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                  <PlusCircle size={16} />
                  Add Choice
                </button>
              </div>

              <div class="space-y-2">
                {#each question.practice_choices as choice (choice.id)}
                  <div class="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name={`correct-choice-${question.id}`}
                      checked={choice.is_correct}
                      on:change={() => setCorrectChoice(question.id, choice.id)}
                      title="Mark as correct answer"
                    >
                    <input type="text" bind:value={choice.choice_text} class="flex-grow border-gray-300 rounded-md shadow-sm">
                    <button on:click={() => removeChoice(question.id, choice.id)} class="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="mt-8 flex justify-end gap-4">
    <a href="/admin/test-prep" class="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300">Cancel</a>
    <button class="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">
      Save Changes
    </button>
  </div>
</form> 