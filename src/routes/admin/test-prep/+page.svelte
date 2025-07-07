<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let sets: any[] = [];
  let loading = true;

  onMount(async () => {
    const { data, error } = await supabase
      .from('practice_sets')
      .select('id, title, section, sort_order')
      .order('sort_order');

    if (data) sets = data;
    loading = false;
  });
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Test Prep Content Manager</h1>
    <a href="/admin/test-prep/edit/new" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
      + Create New Set
    </a>
  </div>

  {#if loading}
    <p>Loading practice sets...</p>
  {:else}
    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <table class="min-w-full leading-normal">
        <thead>
          <tr>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Set Title
            </th>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Section
            </th>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Order
            </th>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
          </tr>
        </thead>
        <tbody>
          {#each sets as set}
            <tr>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">{set.title}</p>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <span class="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                  <span aria-hidden class="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                  <span class="relative">{set.section}</span>
                </span>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">{set.sort_order}</p>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                <a href={`/admin/test-prep/edit/${set.id}`} class="text-indigo-600 hover:text-indigo-900">
                  Edit
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div> 