<script lang="ts">
  import { page } from '$app/stores';
  import { Trash2, PlusCircle, BookOpen, Volume2, PenTool, Mic, Upload, Save, ArrowLeft } from 'lucide-svelte';

  // --- TYPE DEFINITIONS ---
  interface PracticeChoice {
    id: string;
    choice_text: string;
    is_correct: boolean;
  }

  interface PracticeQuestion {
    id: string;
    question_text: string;
    explanation: string;
    practice_choices?: PracticeChoice[];
    sort_order: number;
  }

  interface PracticeSet {
    id: string;
    title: string;
    section: 'reading' | 'listening' | 'writing' | 'speaking';
    passage: string | null;
    sort_order: number;
    practice_questions: PracticeQuestion[];
  }
  
  export let data;
  let set: PracticeSet = data.set;

  // Ensure questions and choices are always arrays
  set.practice_questions = set.practice_questions || [];
  set.practice_questions.forEach((q: PracticeQuestion) => {
    q.practice_choices = q.practice_choices || [];
  });

  let saving = false;
  let errorMessage = '';

  // Question type configurations
  const questionTypes = {
    reading: {
      icon: BookOpen,
      name: 'Reading',
      color: 'blue',
      supportsPassage: true,
      supportsChoices: true,
      supportsAudio: false,
      supportsFile: false
    },
    listening: {
      icon: Volume2,
      name: 'Listening',
      color: 'green', 
      supportsPassage: false,
      supportsChoices: true,
      supportsAudio: true,
      supportsFile: false
    },
    writing: {
      icon: PenTool,
      name: 'Writing',
      color: 'purple',
      supportsPassage: false,
      supportsChoices: false,
      supportsAudio: false,
      supportsFile: false
    },
    speaking: {
      icon: Mic,
      name: 'Speaking',
      color: 'orange',
      supportsPassage: false,
      supportsChoices: false,
      supportsAudio: false,
      supportsFile: false
    }
  };

  $: currentQuestionType = questionTypes[set.section as keyof typeof questionTypes];

  function addQuestion() {
    const newQuestion: PracticeQuestion = {
      id: `new-${Date.now()}`,
      question_text: '',
      explanation: '',
      practice_choices: currentQuestionType.supportsChoices ? [] : undefined,
      sort_order: set.practice_questions.length + 1
    };

    set.practice_questions = [...set.practice_questions, newQuestion];
  }

  function removeQuestion(questionId: string) {
    set.practice_questions = set.practice_questions.filter((q: PracticeQuestion) => q.id !== questionId);
    // Re-number sort orders
    set.practice_questions.forEach((q: PracticeQuestion, index: number) => {
      q.sort_order = index + 1;
    });
  }

  function addChoice(questionId: string) {
    const question = set.practice_questions.find((q: PracticeQuestion) => q.id === questionId);
    if (question && currentQuestionType.supportsChoices) {
      if (!question.practice_choices) {
        question.practice_choices = [];
      }
      question.practice_choices = [
        ...question.practice_choices,
        {
          id: `new-${Date.now()}`,
          choice_text: '',
          is_correct: false
        }
      ];
      // Trigger reactivity
      set.practice_questions = [...set.practice_questions];
    }
  }

  function removeChoice(questionId: string, choiceId: string) {
    const question = set.practice_questions.find((q: PracticeQuestion) => q.id === questionId);
    if (question && question.practice_choices) {
      question.practice_choices = question.practice_choices.filter((c: PracticeChoice) => c.id !== choiceId);
      // Trigger reactivity
      set.practice_questions = [...set.practice_questions];
    }
  }

  function setCorrectChoice(questionId: string, correctChoiceId: string) {
    const question = set.practice_questions.find((q: PracticeQuestion) => q.id === questionId);
    if (question && question.practice_choices) {
      question.practice_choices.forEach((c: PracticeChoice) => {
        c.is_correct = c.id === correctChoiceId;
      });
      // Trigger reactivity
      set.practice_questions = [...set.practice_questions];
    }
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < set.practice_questions.length) {
      const temp = set.practice_questions[index];
      set.practice_questions[index] = set.practice_questions[newIndex];
      set.practice_questions[newIndex] = temp;
      
      // Update sort orders
      set.practice_questions.forEach((q: PracticeQuestion, i: number) => {
        q.sort_order = i + 1;
      });
      
      // Trigger reactivity
      set.practice_questions = [...set.practice_questions];
    }
  }

  async function handleSubmit() {
    if (saving) return;
    
    // Validate required fields
    if (!set.title.trim()) {
      errorMessage = 'Set title is required';
      return;
    }

    if (set.practice_questions.length === 0) {
      errorMessage = 'At least one question is required';
      return;
    }

    // Validate questions
    for (let i = 0; i < set.practice_questions.length; i++) {
      const question = set.practice_questions[i];
      if (!question.question_text.trim()) {
        errorMessage = `Question ${i + 1} text is required`;
        return;
      }

      if (currentQuestionType.supportsChoices && question.practice_choices) {
        if (question.practice_choices.length < 2) {
          errorMessage = `Question ${i + 1} needs at least 2 choices`;
          return;
        }

        const hasCorrectAnswer = question.practice_choices.some((c: PracticeChoice) => c.is_correct);
        if (!hasCorrectAnswer) {
          errorMessage = `Question ${i + 1} needs a correct answer marked`;
          return;
        }

        for (let j = 0; j < question.practice_choices.length; j++) {
          if (!question.practice_choices[j].choice_text.trim()) {
            errorMessage = `Question ${i + 1}, choice ${j + 1} text is required`;
            return;
          }
        }
      }
    }

    errorMessage = '';
    saving = true;

    try {
      const formData = new FormData();
      formData.append('set', JSON.stringify(set));

      const response = await fetch('', {
        method: 'POST',
        body: formData
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else {
        const result = await response.text();
        console.error('Form submission failed:', result);
        errorMessage = 'Failed to save. Please try again.';
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      errorMessage = 'Failed to save. Please check your connection and try again.';
    } finally {
      saving = false;
    }
  }

  function getColorClasses(color: string) {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  }
</script>

<svelte:head>
  <title>{set.id === 'new' ? 'Create' : 'Edit'} Question Set - Admin</title>
</svelte:head>

<div class="edit-page">
  <!-- Header -->
  <div class="header-section">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/admin/test-prep" class="back-btn">
          <ArrowLeft size={20} />
          Back to Test Prep
        </a>
        <div class="divider"></div>
        <div class="section-indicator {getColorClasses(currentQuestionType.color)}">
          <svelte:component this={currentQuestionType.icon} size={20} />
          <span>{currentQuestionType.name} Question Set</span>
        </div>
      </div>
      <button 
        onclick={handleSubmit}
        disabled={saving}
        class="save-btn"
      >
        {#if saving}
          <div class="spinner"></div>
          Saving...
        {:else}
          <Save size={20} />
          Save Changes
        {/if}
      </button>
    </div>
    
    <h1 class="page-title">
      {set.id === 'new' ? 'Create New' : 'Edit'} {currentQuestionType.name} Question Set
    </h1>
  </div>

  <!-- Error Message -->
  {#if errorMessage}
    <div class="error-alert">
      <strong>Error:</strong> {errorMessage}
    </div>
  {/if}

  <!-- Set Configuration -->
  <div class="config-section">
    <h2 class="section-title">Set Configuration</h2>
    <div class="config-grid">
      <div class="form-group">
        <label for="title">Set Title *</label>
        <input 
          type="text" 
          id="title" 
          bind:value={set.title}
          placeholder="e.g., IELTS Reading Practice Set 1"
          class="form-input"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="section">Question Type</label>
        <select 
          id="section" 
          bind:value={set.section}
          class="form-select"
        >
          <option value="reading">📖 Reading</option>
          <option value="listening">🎧 Listening</option>
          <option value="writing">✍️ Writing</option>
          <option value="speaking">🗣️ Speaking</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="sort_order">Display Order</label>
        <input 
          type="number" 
          id="sort_order" 
          bind:value={set.sort_order}
          min="0"
          class="form-input"
        />
      </div>
    </div>

    {#if currentQuestionType.supportsPassage}
      <div class="form-group">
        <label for="passage">Reading Passage</label>
        <textarea 
          id="passage" 
          bind:value={set.passage}
          rows="8"
          placeholder="Enter the reading passage that students will answer questions about..."
          class="form-textarea"
        ></textarea>
        <small class="form-help">Students will read this passage before answering the questions.</small>
      </div>
    {/if}
  </div>

  <!-- Questions Section -->
  <div class="questions-section">
    <div class="section-header">
      <h2 class="section-title">Questions ({set.practice_questions.length})</h2>
      <button 
        onclick={addQuestion}
        class="add-question-btn"
      >
        <PlusCircle size={18} />
        Add Question
      </button>
    </div>

    {#if set.practice_questions.length === 0}
      <div class="empty-questions">
        <div class="empty-icon">❓</div>
        <h3>No Questions Yet</h3>
        <p>Start building your question set by adding your first question.</p>
        <button 
          onclick={addQuestion}
          class="add-question-btn-secondary"
        >
          <PlusCircle size={18} />
          Add First Question
        </button>
      </div>
    {:else}
      <div class="questions-list">
        {#each set.practice_questions as question, qIndex (question.id)}
          <div class="question-card">
            <div class="question-header">
              <div class="question-number">
                <span>Q{qIndex + 1}</span>
              </div>
              <div class="question-controls">
                <button 
                  onclick={() => moveQuestion(qIndex, 'up')}
                  disabled={qIndex === 0}
                  class="move-btn"
                  title="Move up"
                >
                  ↑
                </button>
                <button 
                  onclick={() => moveQuestion(qIndex, 'down')}
                  disabled={qIndex === set.practice_questions.length - 1}
                  class="move-btn"
                  title="Move down"
                >
                  ↓
                </button>
                <button 
                  onclick={() => removeQuestion(question.id)}
                  class="delete-btn"
                  title="Delete question"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div class="question-content">
              <div class="form-group">
                <label for="question-text-{question.id}">Question Text *</label>
                <textarea
                  id="question-text-{question.id}"
                  bind:value={question.question_text}
                  placeholder="Enter your question here..."
                  rows="3"
                  class="form-textarea"
                  required
                ></textarea>
              </div>

              {#if currentQuestionType.supportsChoices}
                <div class="choices-section">
                  <div class="choices-header">
                    <label id="choices-label-{question.id}">Answer Choices</label>
                    <button 
                      onclick={() => addChoice(question.id)}
                      class="add-choice-btn"
                      aria-labelledby="choices-label-{question.id}"
                    >
                      <PlusCircle size={14} />
                      Add Choice
                    </button>
                  </div>

                  {#if question.practice_choices && question.practice_choices.length > 0}
                    <div class="choices-list">
                      {#each question.practice_choices as choice, cIndex (choice.id)}
                        <div class="choice-item">
                          <div class="choice-marker">
                            <input 
                              type="radio" 
                              name="correct-choice-{question.id}"
                              checked={choice.is_correct}
                              onchange={() => setCorrectChoice(question.id, choice.id)}
                              title="Mark as correct answer"
                              class="choice-radio"
                            />
                            <span class="choice-label">{String.fromCharCode(65 + cIndex)}</span>
                          </div>
                          <input 
                            type="text" 
                            bind:value={choice.choice_text}
                            placeholder="Enter answer choice..."
                            class="choice-input"
                          />
                          <button 
                            onclick={() => removeChoice(question.id, choice.id)}
                            class="remove-choice-btn"
                            title="Remove choice"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="no-choices">
                      <p>No answer choices yet. Add some choices for this question.</p>
                    </div>
                  {/if}
                </div>
              {/if}

              <div class="form-group">
                <label for="explanation-{question.id}">Explanation (Optional)</label>
                <textarea
                  id="explanation-{question.id}"
                  bind:value={question.explanation}
                  placeholder="Provide an explanation for the correct answer..."
                  rows="2"
                  class="form-textarea"
                ></textarea>
                <small class="form-help">This explanation will be shown to students after they submit their answer.</small>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Bottom Actions -->
  <div class="bottom-actions">
    <a href="/admin/test-prep" class="cancel-btn">
      Cancel
    </a>
    <button 
      onclick={handleSubmit}
      disabled={saving}
      class="save-btn-primary"
    >
      {#if saving}
        <div class="spinner"></div>
        Saving...
      {:else}
        <Save size={18} />
        {set.id === 'new' ? 'Create Question Set' : 'Save Changes'}
      {/if}
    </button>
  </div>
</div>

<style>
  .edit-page {
    max-width: 1200px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .header-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4b5563;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }
  .back-btn:hover {
    color: #1f2937;
  }

  .divider {
    width: 1px;
    height: 24px;
    background-color: #d1d5db;
  }

  .section-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .save-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #10b981;
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .save-btn:hover {
    background-color: #059669;
  }
  .save-btn:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
  .save-btn .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .page-title {
    margin-top: 16px;
    font-size: 2.25rem;
    font-weight: 700;
    color: #111827;
  }
  
  .error-alert {
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 24px;
  }

  .config-section, .questions-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 20px;
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  .form-group label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
  }
  
  .form-input, .form-select, .form-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }

  .form-help {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 6px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .add-question-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #3b82f6;
    color: white;
    padding: 8px 14px;
    border-radius: 8px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .add-question-btn:hover {
    background-color: #2563eb;
  }

  .empty-questions {
    text-align: center;
    padding: 48px;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
  }
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }
  .empty-questions h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
  }
  .empty-questions p {
    color: #6b7280;
    margin-bottom: 24px;
  }

  .add-question-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #10b981;
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .add-question-btn-secondary:hover {
    background-color: #059669;
  }

  .questions-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .question-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .question-number {
    background-color: #e0e7ff;
    color: #3730a3;
    font-weight: 600;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .question-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .move-btn, .delete-btn, .remove-choice-btn {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 4px;
    cursor: pointer;
    color: #6b7280;
    transition: background-color 0.2s, color 0.2s;
  }
  .move-btn:hover, .delete-btn:hover, .remove-choice-btn:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
  .move-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .delete-btn, .remove-choice-btn {
    color: #ef4444;
  }
  .delete-btn:hover, .remove-choice-btn:hover {
    background-color: #fee2e2;
  }
  
  .question-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .choices-section {
    background: white;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .choices-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .choices-header label {
    font-weight: 500;
  }

  .add-choice-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: #2563eb;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .choice-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .choice-marker {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .choice-radio {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  .choice-label {
    font-weight: 500;
    color: #4b5563;
  }

  .choice-input {
    flex-grow: 1;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
  }

  .no-choices {
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
    padding: 16px;
  }

  .bottom-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background-color: white;
    border-top: 1px solid #e5e7eb;
    border-radius: 0 0 12px 12px;
    position: sticky;
    bottom: 0;
  }
  
  .cancel-btn {
    color: #4b5563;
    font-weight: 500;
    text-decoration: none;
  }
  
  .save-btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #2563eb;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    border: none;
    cursor: pointer;
  }
  .save-btn-primary:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
  .save-btn-primary .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style> 