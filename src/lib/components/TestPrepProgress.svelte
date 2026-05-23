<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Clock, CheckCircle, Circle, Play } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let currentSection: 'reading' | 'listening' | 'writing' | 'speaking' = 'reading';
  export let currentQuestionIndex: number = 0;
  export let totalQuestions: number = 0;
  export let answeredQuestions: number = 0; // Add this prop
  export let timeRemaining: number = 0; // in seconds
  export let sections: Array<{
    id: 'reading' | 'listening' | 'writing' | 'speaking';
    name: string;
    completed: boolean;
    totalQuestions: number;
    answeredQuestions: number;
    timeLimit?: number; // in minutes
  }> = [];

  let timeInterval: NodeJS.Timeout;

  $: progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  $: timeFormatted = formatTime(timeRemaining);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleSectionClick(sectionId: string) {
    dispatch('sectionClick', { sectionId });
  }

  function getSectionIcon(sectionId: string) {
    switch (sectionId) {
      case 'reading': return '📖';
      case 'listening': return '🎧';
      case 'writing': return '✍️';
      case 'speaking': return '🗣️';
      default: return '📝';
    }
  }

  function getSectionColor(sectionId: string) {
    switch (sectionId) {
      case 'reading': return 'bg-blue-500';
      case 'listening': return 'bg-green-500';
      case 'writing': return 'bg-purple-500';
      case 'speaking': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  }
</script>

<div class="test-prep-progress">
  <!-- Main Progress Bar -->
  <div class="main-progress-section">
    <div class="progress-header">
      <h3 class="progress-title">Test Progress</h3>
      <div class="progress-stats">
        <span class="question-counter">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
        {#if timeRemaining > 0}
          <div class="time-remaining">
            <Clock size={16} />
            <span>{timeFormatted}</span>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          style="width: {progressPercentage}%"
        ></div>
      </div>
      <span class="progress-text">{Math.round(progressPercentage)}%</span>
    </div>
  </div>

  <!-- Section Overview -->
  <div class="sections-overview">
    <h4 class="sections-title">Sections</h4>
    <div class="sections-grid">
      {#each sections as section}
        <button
          class="section-card {section.id === currentSection ? 'active' : ''} {section.completed ? 'completed' : ''}"
          onclick={() => handleSectionClick(section.id)}
        >
          <div class="section-icon">
            {getSectionIcon(section.id)}
          </div>
          <div class="section-info">
            <span class="section-name">{section.name}</span>
            <span class="section-progress">
              {section.answeredQuestions}/{section.totalQuestions} questions
            </span>
          </div>
          <div class="section-status">
            {#if section.completed}
              <CheckCircle size={16} class="text-emerald-500" />
            {:else if section.id === currentSection}
              <Play size={16} class="text-blue-500" />
            {:else}
              <Circle size={16} class="text-slate-400" />
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .test-prep-progress {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
  }

  .main-progress-section {
    margin-bottom: 24px;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .progress-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .progress-stats {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .question-counter {
    font-weight: 500;
    color: #374151;
  }

  .time-remaining {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #dc2626;
    font-weight: 500;
  }

  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-weight: 600;
    color: #374151;
    min-width: 40px;
  }

  .sections-overview {
    margin-bottom: 24px;
  }

  .sections-title {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 16px 0;
  }

  .sections-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .section-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .section-card:hover {
    border-color: #3b82f6;
    transform: translateY(-1px);
  }

  .section-card.active {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .section-card.completed {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .section-icon {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border-radius: 8px;
  }

  .section-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .section-name {
    font-weight: 600;
    color: #1f2937;
  }

  .section-progress {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .section-status {
    display: flex;
    align-items: center;
  }

</style> 
