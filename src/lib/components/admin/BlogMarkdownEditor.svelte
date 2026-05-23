<script lang="ts">
  // @ts-ignore - types provided via ambient d.ts
  import MarkdownIt from 'markdown-it';
  // @ts-ignore - types provided via ambient d.ts
  import sanitizeHtml from 'sanitize-html';
  import { supabase } from '$lib/supabase';

  let { value = $bindable(''), placeholder = 'Write your post content in Markdown...' } = $props<{ value?: string; placeholder?: string }>();
  let showPreview = $state(false);

  const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

  let textareaEl: HTMLTextAreaElement | null = $state(null);
  let isUploading = $state(false);
  let uploadError: string | null = $state(null);

  function wrapSelection(prefix: string, suffix: string = prefix) {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart || 0;
    const end = textareaEl.selectionEnd || 0;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    const next = `${before}${prefix}${selected || 'text'}${suffix}${after}`;
    value = next;
    queueMicrotask(() => {
      if (!textareaEl) return;
      const cursor = start + prefix.length + (selected ? selected.length : 4);
      textareaEl.focus();
      textareaEl.setSelectionRange(cursor, cursor);
    });
  }

  function insertAtCursor(text: string) {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart || 0;
    const end = textareaEl.selectionEnd || 0;
    value = value.slice(0, start) + text + value.slice(end);
    const pos = start + text.length;
    queueMicrotask(() => {
      textareaEl?.focus();
      textareaEl?.setSelectionRange(pos, pos);
    });
  }

  async function uploadImage(file: File) {
    uploadError = null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      uploadError = 'Please select an image file';
      return;
    }
    isUploading = true;
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `images/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('blog').upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('blog').getPublicUrl(path);
      const url = data?.publicUrl || '';
      if (url) insertAtCursor(`\n\n![image](${url})\n\n`);
    } catch (e: any) {
      uploadError = e?.message || 'Upload failed';
    } finally {
      isUploading = false;
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadImage(file);
  }

  function renderHtml(): string {
    const html = md.render(value || '');
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'figure', 'figcaption', 'iframe']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'loading'],
        a: ['href', 'name', 'target', 'rel'],
        iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen']
      },
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' })
      }
    });
  }
</script>

<div class="border rounded-lg overflow-hidden">
  <div class="flex flex-wrap items-center gap-2 p-2 border-b bg-gray-50">
    <button type="button" class="px-2 py-1 text-sm border rounded" onclick={() => wrapSelection('**', '**')}>Bold</button>
    <button type="button" class="px-2 py-1 text-sm border rounded" onclick={() => wrapSelection('*', '*')}>Italic</button>
    <button type="button" class="px-2 py-1 text-sm border rounded" onclick={() => wrapSelection('## ', '')}>H2</button>
    <button type="button" class="px-2 py-1 text-sm border rounded" onclick={() => wrapSelection('### ', '')}>H3</button>
    <button type="button" class="px-2 py-1 text-sm border rounded" onclick={() => wrapSelection('> ', '')}>Quote</button>
    <button type="button" class="px-2 py-1 text-sm border rounded" onclick={() => wrapSelection('- ', '')}>List</button>
    <button type="button" class="px-2 py-1 text-sm border rounded" onclick={() => insertAtCursor('```\ncode\n```\n')}>Code</button>
    <label class="px-2 py-1 text-sm border rounded cursor-pointer">
      {#if isUploading}Uploading...{:else}Insert Image{/if}
      <input type="file" accept="image/*" class="hidden" onchange={(e) => uploadImage((e.target as HTMLInputElement).files?.[0] as File)} />
    </label>
    <span class="ml-auto"></span>
    <button type="button" class="px-2 py-1 text-sm border rounded" onclick={() => showPreview = !showPreview}>{showPreview ? 'Edit' : 'Preview'}</button>
  </div>

  {#if uploadError}
    <div class="px-3 py-2 text-sm text-red-600 border-b bg-red-50">{uploadError}</div>
  {/if}

  {#if !showPreview}
    <textarea
      bind:this={textareaEl}
      bind:value={value}
      placeholder={placeholder}
      class="w-full min-h-[360px] p-3 font-mono outline-none"
      ondrop={onDrop}
    ></textarea>
  {:else}
    <div class="prose max-w-none p-4">
      {@html renderHtml()}
    </div>
  {/if}
</div>

<style>
  :global(.prose img) { max-width: 100%; height: auto; border-radius: 0.5rem; }
</style>

