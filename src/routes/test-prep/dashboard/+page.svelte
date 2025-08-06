<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { BookOpen, Volume2, PenTool, Mic, TrendingUp, Target, Clock, Award } from 'lucide-svelte';

  let { data } = $props();
  let { session } = $derived(data);

  // Dashboard data
  let userProgress: any[] = [];
  let performanceStats: any = {};
  let recentAttempts: any[] = [];
  let isLoading = true;
  let errorMessage = '';

  onMount(async () => {
    if (!session?.user) {
      errorMessage = 'Please log in to view your dashboard.';
      return;
    }

    await loadDashboardData();
  });

  async function loadDashboardData() {
    try {
      isLoading = true;

      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .rpc('get_user_current_progress', { user_id_param: session.user.id });

      if (progressError) throw progressError;
      userProgress = progressData || [];

      // Load performance stats
      await loadPerformanceStats();

      // Load recent attempts
      await loadRecentAttempts();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      errorMessage = 'Failed to load dashboard data.';
    } finally {
      isLoading = false;
    }
  }

  async function loadPerformanceStats() {
    try {
      const sections = ['reading', 'listening', 'writing', 'speaking'];
      performanceStats = {};

      for (const section of sections) {
        const { data, error } = await supabase
          .rpc('calculate_user_performance', { 
            user_id_param: session.user.id, 
            section_param: section 
          });

        if (!error && data && data.length > 0) {
          performanceStats[section] = data[0];
        }
      }
    } catch (error) {
      console.error('Error loading performance stats:', error);
    }
  }

  async function loadRecentAttempts() {
    try {
      const { data, error } = await supabase
        .from('user_practice_attempts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      recentAttempts = data || [];
    } catch (error) {
      console.error('Error loading recent attempts:', error);
    }
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
      case 'reading': return 'bg-blue-500';
      case 'listening': return 'bg-green-500';
      case 'writing': return 'bg-purple-500';
      case 'speaking': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getOverallProgress() {
    if (userProgress.length === 0) return 0;
    
    const totalProgress = userProgress.reduce((sum, section) => {
      return sum + (section.completion_percentage || 0);
    }, 0);
    
    return Math.round(totalProgress / userProgress.length);
  }

  function getOverallScore() {
    if (Object.keys(performanceStats).length === 0) return 0;
    
    const scores = Object.values(performanceStats).map((stat: any) => stat.accuracy_percentage || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return Math.round(averageScore);
  }
</script>

<svelte:head>
  <title>Test Prep Dashboard - Your Progress | Abroaducate</title>
</svelte:head>

<div class="dashboard-container">
  <!-- Header -->
  <div class="dashboard-header">
    <h1 class="dashboard-title">📊 Your Test Prep Dashboard</h1>
    <p class="dashboard-subtitle">Track your progress and performance across all IELTS sections</p>
  </div>

  {#if errorMessage}
    <div class="error-message">
      <p>{errorMessage}</p>
    </div>
  {:else if isLoading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  {:else}
    <!-- Overview Stats -->
    <div class="overview-stats">
      <div class="stat-card">
        <div class="stat-icon overall">
          <TrendingUp size={24} />
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{getOverallProgress()}%</h3>
          <p class="stat-label">Overall Progress</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon score">
          <Target size={24} />
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{getOverallScore()}%</h3>
          <p class="stat-label">Average Score</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon time">
          <Clock size={24} />
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{recentAttempts.length}</h3>
          <p class="stat-label">Practice Sessions</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon achievement">
          <Award size={24} />
        </div>
        <div class="stat-content">
          <h3 class="stat-number">{userProgress.filter(p => p.is_completed).length}/4</h3>
          <p class="stat-label">Sections Completed</p>
        </div>
      </div>
    </div>

    <!-- Section Progress -->
    <div class="section-progress">
      <h2 class="section-title">Section Progress</h2>
      <div class="progress-grid">
        {#each userProgress as section}
          <div class="progress-card">
            <div class="progress-header">
              <div class="section-info">
                <div class="section-icon {getSectionColor(section.section)}">
                  <svelte:component this={getSectionIcon(section.section)} size={20} />
                </div>
                <div>
                  <h3 class="section-name">{section.section_name}</h3>
                  <p class="section-stats">
                    {section.answered_questions}/{section.total_questions} questions
                  </p>
                </div>
              </div>
              <div class="completion-status">
                {#if section.is_completed}
                  <span class="completed-badge">✅ Completed</span>
                {:else}
                  <span class="in-progress-badge">🔄 In Progress</span>
                {/if}
              </div>
            </div>

            <div class="progress-bar-container">
              <div class="progress-bar">
                <div 
                  class="progress-fill {getSectionColor(section.section)}"
                  style="width: {section.completion_percentage || 0}%"
                ></div>
              </div>
              <span class="progress-text">{Math.round(section.completion_percentage || 0)}%</span>
            </div>

            {#if performanceStats[section.section]}
              {@const stats = performanceStats[section.section]}
              <div class="performance-stats">
                <div class="perf-stat">
                  <span class="perf-label">Accuracy:</span>
                  <span class="perf-value">{stats.accuracy_percentage}%</span>
                </div>
                <div class="perf-stat">
                  <span class="perf-label">Avg Time:</span>
                  <span class="perf-value">{Math.round(stats.average_time_per_question || 0)}s</span>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity">
      <h2 class="section-title">Recent Practice Sessions</h2>
      {#if recentAttempts.length === 0}
        <div class="empty-state">
          <p>No practice sessions yet. Start your first practice test!</p>
          <a href="/test-prep/practice" class="start-practice-btn">
            🚀 Start Practice
          </a>
        </div>
      {:else}
        <div class="activity-list">
          {#each recentAttempts as attempt}
            <div class="activity-item">
              <div class="activity-icon {getSectionColor(attempt.section)}">
                <svelte:component this={getSectionIcon(attempt.section)} size={16} />
              </div>
              <div class="activity-content">
                <h4 class="activity-title">
                  {attempt.section.charAt(0).toUpperCase() + attempt.section.slice(1)} Practice
                </h4>
                <p class="activity-details">
                  {attempt.total_questions || 0} questions • 
                  {attempt.score ? `${attempt.score}% score` : 'In progress'} • 
                  {formatDate(attempt.created_at)}
                </p>
              </div>
              <div class="activity-status">
                {#if attempt.completed_at}
                  <span class="completed-status">Completed</span>
                {:else}
                  <span class="in-progress-status">In Progress</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2 class="section-title">Quick Actions</h2>
      <div class="action-buttons">
        <a href="/test-prep/practice" class="action-btn primary">
          <BookOpen size={20} />
          Continue Practice
        </a>
        <a href="/test-prep" class="action-btn secondary">
          <Target size={20} />
          View Study Plan
        </a>
        <a href="/admin/test-prep" class="action-btn secondary">
          <TrendingUp size={20} />
          Detailed Analytics
        </a>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .dashboard-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .dashboard-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .dashboard-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
  }

  .error-message {
    text-align: center;
    padding: 60px 20px;
    color: #dc2626;
    background: #fef2f2;
    border-radius: 12px;
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

  .overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .stat-icon.overall { background: #3b82f6; }
  .stat-icon.score { background: #10b981; }
  .stat-icon.time { background: #f59e0b; }
  .stat-icon.achievement { background: #8b5cf6; }

  .stat-content h3 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 4px 0;
  }

  .stat-content p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .section-progress {
    margin-bottom: 32px;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 20px 0;
  }

  .progress-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .progress-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .section-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .section-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .section-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
  }

  .section-stats {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .completion-status {
    display: flex;
    align-items: center;
  }

  .completed-badge {
    background: #10b981;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .in-progress-badge {
    background: #f59e0b;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
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
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-weight: 600;
    color: #374151;
    min-width: 40px;
  }

  .performance-stats {
    display: flex;
    gap: 16px;
  }

  .perf-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .perf-label {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .perf-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
  }

  .recent-activity {
    margin-bottom: 32px;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    background: #f8fafc;
    border-radius: 12px;
  }

  .empty-state p {
    color: #6b7280;
    margin: 0 0 16px 0;
  }

  .start-practice-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #3b82f6;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .start-practice-btn:hover {
    background: #2563eb;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .activity-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .activity-content {
    flex: 1;
  }

  .activity-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
  }

  .activity-details {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .activity-status {
    display: flex;
    align-items: center;
  }

  .completed-status {
    background: #10b981;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .in-progress-status {
    background: #f59e0b;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .quick-actions {
    margin-bottom: 32px;
  }

  .action-buttons {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .action-btn.primary {
    background: #3b82f6;
    color: white;
  }

  .action-btn.primary:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .action-btn.secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
  }

  .action-btn.secondary:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .dashboard-container {
      padding: 16px;
    }

    .dashboard-title {
      font-size: 2rem;
    }

    .overview-stats {
      grid-template-columns: 1fr;
    }

    .progress-grid {
      grid-template-columns: 1fr;
    }

    .action-buttons {
      flex-direction: column;
    }

    .activity-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }
</style> 