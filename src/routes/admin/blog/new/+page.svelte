<script lang="ts">
  import WordPressLikeBlogEditor from '$lib/components/admin/WordPressLikeBlogEditor.svelte';
  import type { PageData, ActionData } from './$types';
  
  let { data, form }: { data: PageData; form: ActionData } = $props();

  let title = $state('');
  let slug = $state('');

  let content = $state('');
  let cover_image_url = $state('');
  let status = $state('draft');
  let editorComponent: any;

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function onTitleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    title = target.value;
    if (!slug) {
      slug = generateSlug(title);
    }
  }

  function insertImageToEditor() {
    if (!cover_image_url.trim()) {
      alert('Please enter an image URL first');
      return;
    }
    
    const altText = prompt('Enter alt text for the image:') || 'Image';
    const imageMarkdown = `![${altText}](${cover_image_url})\n\n`;
    
    // Insert at the current cursor position in the editor
    if (editorComponent && editorComponent.insertAtCursor) {
      editorComponent.insertAtCursor(imageMarkdown);
    } else {
      // Fallback: append to content
      content += imageMarkdown;
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900">Create New Blog Post</h1>
    <p class="text-gray-600 mt-2">Write and publish your blog post</p>
  </div>

  {#if form?.success === false}
    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600">{form.message}</p>
    </div>
  {/if}

  <form method="POST" class="space-y-6">
    <!-- Title -->
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
        Title *
      </label>
      <input
        id="title"
        name="title"
        type="text"
        required
        bind:value={title}
        oninput={onTitleChange}
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
        placeholder="Enter your blog post title..."
      />
    </div>

    <!-- Slug -->
    <div>
      <label for="slug" class="block text-sm font-medium text-gray-700 mb-2">
        URL Slug
      </label>
      <input
        id="slug"
        name="slug"
        type="text"
        bind:value={slug}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="url-friendly-version"
      />
      <p class="text-sm text-gray-500 mt-1">Leave empty to auto-generate from title</p>
    </div>



    <!-- Cover Image -->
    <div>
      <label for="cover_image_url" class="block text-sm font-medium text-gray-700 mb-2">
        Cover Image URL
      </label>
      <div class="flex gap-2">
        <input
          id="cover_image_url"
          name="cover_image_url"
          type="url"
          bind:value={cover_image_url}
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/image.jpg"
        />
        <button
          type="button"
          onclick={() => insertImageToEditor()}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Insert to Editor
        </button>
      </div>
      {#if cover_image_url}
        <div class="mt-2">
          <img src={cover_image_url} alt="Cover preview" class="w-32 h-20 object-cover rounded border" 
               onerror={(e) => { e.target.style.display = 'none'; }} />
        </div>
      {/if}
    </div>

    <!-- Content Editor -->
    <div>
      <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
        Content *
      </label>
      <input type="hidden" name="content" value={content} />
      <div class="editor-container" style="height: 82vh; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 8px;">
        <WordPressLikeBlogEditor bind:value={content} bind:this={editorComponent} />
      </div>
    </div>

    <!-- Status and Actions -->
    <div class="flex items-center justify-between pt-6 border-t border-gray-200">
      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          id="status"
          name="status"
          bind:value={status}
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div class="flex gap-3">
        <a
          href="/admin/blog"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {status === 'published' ? 'Publish Post' : 'Save Draft'}
        </button>
      </div>
    </div>
  </form>
</div>