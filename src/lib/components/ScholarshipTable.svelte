<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ConfirmModal from './ConfirmModal.svelte';

  export let scholarships: any[] = [];
  export let currentPage: number = 1;
  export let totalPages: number = 1;
  export let totalScholarships: number = 0;
  export let pageSize: number = 10;
  export let isLoading: boolean = false;

  const dispatch = createEventDispatcher();

  let showDeleteModal = false;
  let scholarshipToDelete: any = null;

  function editScholarship(scholarship: any) {
    dispatch('edit', scholarship);
  }

  function deleteScholarship(scholarship: any) {
    scholarshipToDelete = scholarship;
    showDeleteModal = true;
  }

  function confirmDelete() {
    if (scholarshipToDelete) {
      dispatch('delete', scholarshipToDelete);
      scholarshipToDelete = null;
    }
  }

  function cancelDelete() {
    scholarshipToDelete = null;
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      dispatch('changePage', page);
    }
  }

  function formatDeadline(deadline: string | null): string {
    if (!deadline) return 'No deadline';
    try {
      return new Date(deadline).toLocaleDateString();
    } catch {
      return deadline;
    }
  }

  function getScholarshipTypeColor(category?: string): string {
    switch (category) {
      case 'Traditional Scholarship': return 'bg-blue-100 text-blue-800';
      case 'Graduate Program Funding': return 'bg-green-100 text-green-800';
      case 'Advertised Position': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="bg-white rounded-lg shadow">
  <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
    <div>
      <h2 class="text-lg font-semibold text-gray-900">Scholarships</h2>
      <p class="text-sm text-gray-600">
        Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalScholarships)} of {totalScholarships} scholarships
      </p>
    </div>
    <button
      on:click={() => dispatch('add')}
      class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Add Scholarship
    </button>
  </div>

  {#if isLoading}
    <div class="p-8 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading scholarships...</p>
    </div>
  {:else if scholarships.length === 0}
    <div class="p-8 text-center">
      <p class="text-gray-600">No scholarships found</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title & Category
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Provider
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deadline
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each scholarships as scholarship (scholarship.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div>
                  <div class="text-sm font-medium text-gray-900">{scholarship.title}</div>
                  <div class="text-sm text-gray-500">{scholarship.field} • {scholarship.level}</div>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 {getScholarshipTypeColor(scholarship.funding_category)}">
                    {scholarship.funding_category || 'Traditional'}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{scholarship.provider}</div>
                <div class="text-sm text-gray-500">{scholarship.location}</div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {scholarship.amount || 'Not specified'}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {formatDeadline(scholarship.deadline)}
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {scholarship.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  {scholarship.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td class="px-6 py-4 text-sm font-medium space-x-2">
                <button
                  on:click={() => editScholarship(scholarship)}
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  on:click={() => deleteScholarship(scholarship)}
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </div>
        <div class="flex items-center space-x-2">
          <button
            on:click={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            class="px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
            const start = Math.max(1, currentPage - 2);
            return start + i;
          }).filter(p => p <= totalPages) as page}
            <button
              on:click={() => goToPage(page)}
              class="px-3 py-2 border rounded text-sm font-medium {page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}"
            >
              {page}
            </button>
          {/each}
          
          <button
            on:click={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            class="px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Delete Confirmation Modal -->
<ConfirmModal
  bind:show={showDeleteModal}
  title="Delete Scholarship"
  message="Are you sure you want to delete '{scholarshipToDelete?.title}'? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  icon="danger"
  confirmClass="bg-red-600 hover:bg-red-700"
  on:confirm={confirmDelete}
  on:cancel={cancelDelete}
/> 