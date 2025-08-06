<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import TestPrepProgress from '$lib/components/TestPrepProgress.svelte';
  import { BookOpen, Volume2, PenTool, Mic, CheckCircle, Clock, Target } from 'lucide-svelte';

  let { data } = $props();
  let { session } = $derived(data);

  // Progress tracking state
  let currentSection: 'reading' | 'listening' | 'writing' | 'speaking' = 'reading';
  let currentQuestionIndex = 0;
  let totalQuestions = 0;
  let timeRemaining = 0; // in seconds
  let isAudioPlaying = false;
  let audioProgress = 0;

  // Test data
  let practiceSets: any[] = [];
  let currentQuestions: any[] = [];
  let userAnswers: Record<string, string> = {};
  let isLoading = true;
  let errorMessage = '';

  // Progress sections
  let sections = [
    {
      id: 'reading' as const,
      name: 'Reading',
      completed: false,
      totalQuestions: 0,
      answeredQuestions: 0,
      timeLimit: 60 // minutes
    },
    {
      id: 'listening' as const,
      name: 'Listening',
      completed: false,
      totalQuestions: 0,
      answeredQuestions: 0,
      timeLimit: 30 // minutes
    },
    {
      id: 'writing' as const,
      name: 'Writing',
      completed: false,
      totalQuestions: 0,
      answeredQuestions: 0,
      timeLimit: 60 // minutes
    },
    {
      id: 'speaking' as const,
      name: 'Speaking',
      completed: false,
      totalQuestions: 0,
      answeredQuestions: 0,
      timeLimit: 15 // minutes
    }
  ];

  onMount(async () => {
    if (!session?.user) {
      errorMessage = 'Please log in to access test prep practice.';
      return;
    }

    await loadPracticeSets();
    await loadSectionQuestions(currentSection);
  });

  async function loadPracticeSets() {
    try {
      const { data, error } = await supabase
        .from('practice_sets')
        .select(`
          id,
          title,
          section,
          sort_order,
          practice_questions(id)
        `)
        .order('section')
        .order('sort_order');

      if (error) throw error;

      practiceSets = data || [];
      
      // Update section counts
      sections = sections.map(section => {
        const sectionSets = practiceSets.filter(set => set.section === section.id);
        const totalQuestions = sectionSets.reduce((total, set) => {
          return total + (Array.isArray(set.practice_questions) ? set.practice_questions.length : 0);
        }, 0);
        
        return {
          ...section,
          totalQuestions,
          answeredQuestions: 0 // Will be updated from saved progress
        };
      });

    } catch (error) {
      console.error('Error loading practice sets:', error);
      errorMessage = 'Failed to load practice sets.';
    }
  }

  async function loadSectionQuestions(sectionId: string) {
    try {
      isLoading = true;
      
      const { data, error } = await supabase
        .from('practice_questions')
        .select(`
          id,
          question_text,
          question_type,
          sort_order,
          practice_choices(id, choice_text, is_correct, sort_order)
        `)
        .eq('set_id', practiceSets.find(set => set.section === sectionId)?.id)
        .order('sort_order');

      if (error) throw error;

      currentQuestions = data || [];
      totalQuestions = currentQuestions.length;
      currentQuestionIndex = 0;

      // Load saved progress
      await loadUserProgress(sectionId);

    } catch (error) {
      console.error('Error loading questions:', error);
      errorMessage = 'Failed to load questions.';
    } finally {
      isLoading = false;
    }
  }

  async function loadUserProgress(sectionId: string) {
    try {
      const { data, error } = await supabase
        .from('user_practice_attempts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('section', sectionId)
        .single();

      if (data && !error) {
        userAnswers = data.answers || {};
        
        // Update section progress
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
          sections[sectionIndex].answeredQuestions = Object.keys(userAnswers).length;
          sections[sectionIndex].completed = sections[sectionIndex].answeredQuestions >= sections[sectionIndex].totalQuestions;
        }
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  }

  async function saveUserProgress() {
    try {
      const { error } = await supabase
        .from('user_practice_attempts')
        .upsert({
          user_id: session.user.id,
          section: currentSection,
          answers: userAnswers,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  function handleSectionClick(event: CustomEvent) {
    const { sectionId } = event.detail;
    currentSection = sectionId;
    loadSectionQuestions(sectionId);
  }

  function handleAnswerSelect(questionId: string, choiceId: string) {
    userAnswers[questionId] = choiceId;
    
    // Update section progress
    const sectionIndex = sections.findIndex(s => s.id === currentSection);
    if (sectionIndex !== -1) {
      sections[sectionIndex].answeredQuestions = Object.keys(userAnswers).length;
      sections[sectionIndex].completed = sections[sectionIndex].answeredQuestions >= sections[sectionIndex].totalQuestions;
    }

    // Auto-save progress
    saveUserProgress();
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
    }
  }

  function handleNext() {
    if (currentQuestionIndex < totalQuestions - 1) {
      currentQuestionIndex++;
    }
  }

  function getCurrentQuestion() {
    return currentQuestions[currentQuestionIndex];
  }

  function getSectionIcon(sectionId: string) {
    switch (sectionId) {
      case 'reading': return BookOpen;
      case 'listening': return Volume2;
      case 'writing': return PenTool;
      case 'speaking': return Mic;
      default: return BookOpen;
    }
  }

  function getSectionColor(sectionId: string) {
    switch (sectionId) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'listening': return 'bg-green-100 text-green-800';
      case 'writing': return 'bg-purple-100 text-purple-800';
      case 'speaking': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>IELTS Practice Test - {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)} Section | Abroaducate</title>
</svelte:head>

<div class="test-prep-practice">
  <!-- Progress Tracking Component -->
  <TestPrepProgress
    {currentSection}
    {currentQuestionIndex}
    {totalQuestions}
    {timeRemaining}
    {isAudioPlaying}
    {audioProgress}
    {sections}
    on:sectionClick={handleSectionClick}
    on:previous={handlePrevious}
    on:next={handleNext}
  />

  <!-- Main Content Area -->
  <div class="practice-content">
    {#if errorMessage}
      <div class="error-message">
        <p>{errorMessage}</p>
      </div>
    {:else if isLoading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading {currentSection} questions...</p>
      </div>
    {:else if currentQuestions.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svelte:component this={getSectionIcon(currentSection)} size={48} />
        </div>
        <h3>No {currentSection} questions available</h3>
        <p>Please check back later or contact support.</p>
      </div>
    {:else}
      <!-- Question Display -->
      <div class="question-container">
        <div class="question-header">
          <div class="question-info">
            <span class="question-number">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span class="section-badge {getSectionColor(currentSection)}">
              <svelte:component this={getSectionIcon(currentSection)} size={16} />
              {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
            </span>
          </div>
          
          {#if currentSection === 'listening'}
            <div class="audio-controls">
              <button class="audio-btn">
                <Volume2 size={20} />
                Play Audio
              </button>
            </div>
          {/if}
        </div>

        <div class="question-content">
          <h3 class="question-text">
            {getCurrentQuestion()?.question_text}
          </h3>

          <!-- Multiple Choice Options -->
          {#if getCurrentQuestion()?.question_type === 'multiple_choice'}
            <div class="choices-container">
              {#each getCurrentQuestion()?.practice_choices || [] as choice}
                <label class="choice-option">
                  <input
                    type="radio"
                    name="question_{getCurrentQuestion()?.id}"
                    value={choice.id}
                    checked={userAnswers[getCurrentQuestion()?.id] === choice.id}
                    onchange={() => handleAnswerSelect(getCurrentQuestion()?.id, choice.id)}
                  />
                  <span class="choice-text">{choice.choice_text}</span>
                </label>
              {/each}
            </div>
          {/if}

          <!-- Text Input for Writing/Speaking -->
          {#if getCurrentQuestion()?.question_type === 'essay' || getCurrentQuestion()?.question_type === 'short_answer'}
            <div class="text-input-container">
              <textarea
                placeholder="Type your answer here..."
                class="answer-textarea"
                rows="8"
                bind:value={userAnswers[getCurrentQuestion()?.id]}
                oninput={() => saveUserProgress()}
              ></textarea>
            </div>
          {/if}
        </div>

        <!-- Question Navigation -->
        <div class="question-navigation">
          <button
            class="nav-btn prev-btn"
            disabled={currentQuestionIndex === 0}
            onclick={handlePrevious}
          >
            ← Previous
          </button>
          
          <div class="question-indicators">
            {#each currentQuestions as question, index}
              <button
                class="indicator-btn {index === currentQuestionIndex ? 'active' : ''} {userAnswers[question.id] ? 'answered' : ''}"
                onclick={() => currentQuestionIndex = index}
              >
                {index + 1}
              </button>
            {/each}
          </div>

          <button
            class="nav-btn next-btn"
            disabled={currentQuestionIndex === totalQuestions - 1}
            onclick={handleNext}
          >
            Next →
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Performance Summary -->
  <div class="performance-summary">
    <h3>Performance Summary</h3>
    <div class="summary-grid">
      {#each sections as section}
        <div class="summary-card">
          <div class="summary-icon">
            <svelte:component this={getSectionIcon(section.id)} size={24} />
          </div>
          <div class="summary-info">
            <h4>{section.name}</h4>
            <p>{section.answeredQuestions}/{section.totalQuestions} completed</p>
            {#if section.completed}
              <span class="completed-badge">
                <CheckCircle size={16} />
                Completed
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .test-prep-practice {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .practice-content {
    background: white;
    border-radius: 12px;
    padding: 32px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .error-message {
    text-align: center;
    padding: 60px 20px;
    color: #dc2626;
  }

  .loading-state {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-icon {
    margin-bottom: 16px;
    color: #6b7280;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .empty-state p {
    color: #6b7280;
    margin: 0;
  }

  .question-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e5e7eb;
  }

  .question-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .question-number {
    font-weight: 600;
    color: #374151;
  }

  .section-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .audio-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .audio-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .audio-btn:hover {
    background: #2563eb;
  }

  .question-content {
    margin-bottom: 32px;
  }

  .question-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 24px 0;
    line-height: 1.6;
  }

  .choices-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .choice-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .choice-option:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  .choice-option input[type="radio"] {
    width: 20px;
    height: 20px;
    accent-color: #3b82f6;
  }

  .choice-text {
    font-size: 1rem;
    color: #374151;
    line-height: 1.5;
  }

  .text-input-container {
    margin-top: 16px;
  }

  .answer-textarea {
    width: 100%;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    line-height: 1.6;
    resize: vertical;
    min-height: 200px;
  }

  .answer-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .question-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
  }

  .nav-btn {
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .prev-btn {
    background: #f3f4f6;
    color: #374151;
  }

  .prev-btn:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .prev-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .next-btn {
    background: #3b82f6;
    color: white;
  }

  .next-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .next-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .question-indicators {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .indicator-btn {
    width: 40px;
    height: 40px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #374151;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .indicator-btn:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .indicator-btn.active {
    border-color: #3b82f6;
    background: #3b82f6;
    color: white;
  }

  .indicator-btn.answered {
    border-color: #10b981;
    background: #10b981;
    color: white;
  }

  .performance-summary {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .performance-summary h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 20px 0;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: #f8fafc;
  }

  .summary-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    color: #6b7280;
  }

  .summary-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
  }

  .summary-info p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 8px 0;
  }

  .completed-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #10b981;
    color: white;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .test-prep-practice {
      padding: 16px;
    }

    .practice-content {
      padding: 20px;
    }

    .question-header {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }

    .question-navigation {
      flex-direction: column;
      gap: 16px;
    }

    .question-indicators {
      order: -1;
    }
  }
</style> 