<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js';
  import NewMatchesWidget from './NewMatchesWidget.svelte';
  import ApplicationTrackerWidget from './ApplicationTrackerWidget.svelte';
  import QuickActionsHub from './QuickActionsHub.svelte';

  let { supabase, session }: { 
    supabase: SupabaseClient, 
    session: any 
  } = $props();
</script>

<!-- Enhanced Dashboard Widgets Layout -->
<div class="space-y-6">
  <!-- Top Row: Quick Actions (Full Width) -->
  <div class="w-full">
    <QuickActionsHub {supabase} {session} />
  </div>

  <!-- Second Row: New Matches -->
  <div class="w-full">
    <NewMatchesWidget {supabase} {session} />
  </div>

  <!-- Third Row: Application Tracker (Full Width) -->
  <div class="w-full">
    <ApplicationTrackerWidget {supabase} {session} />
  </div>
</div>