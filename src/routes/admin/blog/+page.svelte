<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  const { posts, pagination } = data;

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Blog Posts</h1>
      <p class="text-gray-600 mt-2">Manage your blog content</p>
    </div>
    <a
      href="/admin/blog/new"
      class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      Create New Post
    </a>
  </div>

  {#if posts.length === 0}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">📝</div>
      <h2 class="text-xl font-semibold text-gray-700 mb-2">No blog posts yet</h2>
      <p class="text-gray-500 mb-6">Create your first blog post to get started</p>
      <a
        href="/admin/blog/new"
        class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create Your First Post
      </a>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Published
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each posts as post}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      <a href="/admin/blog/{post.id}" class="hover:text-blue-600">
                        {post.title}
                      </a>
                    </div>
                    <div class="text-sm text-gray-500">
                      /{post.slug}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(post.status)}">
                    {post.status}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {formatDate(post.published_at)}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {formatDate(post.updated_at)}
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium space-x-2">
                  <a
                    href="/admin/blog/{post.id}"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </a>
                  
                  {#if post.status === 'published'}
                    <a
                      href="/blog/{post.slug}"
                      target="_blank"
                      class="text-green-600 hover:text-green-900"
                    >
                      View
                    </a>
                    <form method="POST" action="?/unpublish" class="inline">
                      <input type="hidden" name="id" value={post.id} />
                      <button
                        type="submit"
                        class="text-yellow-600 hover:text-yellow-900"
                        onclick={(e) => {
                          if (!confirm('Unpublish this post?')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Unpublish
                      </button>
                    </form>
                  {:else if post.status === 'draft'}
                    <form method="POST" action="?/publish" class="inline">
                      <input type="hidden" name="id" value={post.id} />
                      <button
                        type="submit"
                        class="text-green-600 hover:text-green-900"
                      >
                        Publish
                      </button>
                    </form>
                  {/if}
                  
                  <form method="POST" action="?/archive" class="inline">
                    <input type="hidden" name="id" value={post.id} />
                    <button
                      type="submit"
                      class="text-gray-600 hover:text-gray-900"
                      onclick={(e) => {
                        if (!confirm('Archive this post?')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Archive
                    </button>
                  </form>
                  
                  <form method="POST" action="?/delete" class="inline">
                    <input type="hidden" name="id" value={post.id} />
                    <button
                      type="submit"
                      class="text-red-600 hover:text-red-900"
                      onclick={(e) => {
                        if (!confirm('Delete this post permanently?')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="mt-8 flex items-center justify-between">
      <div class="text-sm text-gray-500">
        Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {Math.min(pagination.currentPage * pagination.perPage, pagination.totalPosts)} of {pagination.totalPosts} posts
      </div>
      
      {#if pagination.totalPages > 1}
        <div class="flex items-center space-x-2">
          <!-- Previous Button -->
          {#if pagination.hasPrev}
            <a
              href="?page={pagination.currentPage - 1}"
              class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            >
              Previous
            </a>
          {:else}
            <span class="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md text-gray-400 cursor-not-allowed">
              Previous
            </span>
          {/if}
          
          <!-- Page Numbers -->
          {#each Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const start = Math.max(1, pagination.currentPage - 2);
            const end = Math.min(pagination.totalPages, start + 4);
            return start + i;
          }).filter(page => page <= pagination.totalPages) as page}
            {#if page === pagination.currentPage}
              <span class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md">
                {page}
              </span>
            {:else}
              <a
                href="?page={page}"
                class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                {page}
              </a>
            {/if}
          {/each}
          
          <!-- Next Button -->
          {#if pagination.hasNext}
            <a
              href="?page={pagination.currentPage + 1}"
              class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            >
              Next
            </a>
          {:else}
            <span class="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md text-gray-400 cursor-not-allowed">
              Next
            </span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>