<script lang="ts">
  import { supabase } from '$lib/supabase';

  let { value = $bindable(''), placeholder = 'Write your blog post content...' } = $props<{ value?: string; placeholder?: string }>();
  
  let showPreview = $state(false);
  let isUploading = $state(false);
  let uploadError: string | null = $state(null);
  let textareaEl: HTMLTextAreaElement | null = $state(null);
  
  // Undo/Redo functionality
  let undoHistory: string[] = $state([]);
  let redoHistory: string[] = $state([]);
  let lastValue = $state(value);
  
  // Save state for undo
  function saveState() {
    if (lastValue !== value) {
      undoHistory.push(lastValue);
      if (undoHistory.length > 50) {
        undoHistory = undoHistory.slice(-50); // Keep last 50 states
      }
      redoHistory = []; // Clear redo history when new changes are made
      lastValue = value;
    }
  }
  
  function undo() {
    if (undoHistory.length > 0) {
      redoHistory.push(value);
      value = undoHistory.pop() || '';
      lastValue = value;
    }
  }
  
  function redo() {
    if (redoHistory.length > 0) {
      undoHistory.push(value);
      value = redoHistory.pop() || '';
      lastValue = value;
    }
  }
  
  // Handle keyboard shortcuts
  function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
  }

  // Simple markdown rendering for preview
  function renderMarkdown(text: string): string {
    return text
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.*)$/gm, '<p>$1</p>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
  }

  function insertText(text: string) {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    value = value.slice(0, start) + text + value.slice(end);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      if (textareaEl) {
        textareaEl.focus();
        textareaEl.setSelectionRange(start + text.length, start + text.length);
      }
    }, 0);
  }

  function wrapText(prefix: string, suffix: string = prefix) {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const selected = value.slice(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    
    value = value.slice(0, start) + replacement + value.slice(end);
    
    setTimeout(() => {
      if (textareaEl) {
        textareaEl.focus();
        const newPos = start + prefix.length + (selected ? selected.length : 4);
        textareaEl.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  // Header functions for WordPress-style editor
  function addHeader(level: number) {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const selected = value.slice(start, end);
    const hashes = '#'.repeat(level);
    
    // Check if we're at the start of a line
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const beforeText = value.slice(lineStart, start);
    
    let replacement: string;
    if (beforeText.trim() === '') {
      // At start of line or line is empty
      replacement = `${hashes} ${selected || 'Heading'}`;
    } else {
      // In middle of line, add newline before
      replacement = `\n${hashes} ${selected || 'Heading'}`;
    }
    
    value = value.slice(0, start) + replacement + value.slice(end);
    
    setTimeout(() => {
      if (textareaEl) {
        textareaEl.focus();
        const newPos = start + replacement.length;
        textareaEl.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  function addBold() {
    wrapText('**', '**');
  }

  function addItalic() {
    wrapText('*', '*');
  }

  function addList() {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const beforeText = value.slice(lineStart, start);
    
    if (beforeText.trim() === '') {
      insertText('- ');
    } else {
      insertText('\n- ');
    }
  }

  function addNumberedList() {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const beforeText = value.slice(lineStart, start);
    
    if (beforeText.trim() === '') {
      insertText('1. ');
    } else {
      insertText('\n1. ');
    }
  }

  function addLink() {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const selected = value.slice(start, end);
    const replacement = `[${selected || 'Link Text'}](https://example.com)`;
    
    value = value.slice(0, start) + replacement + value.slice(end);
    
    setTimeout(() => {
      if (textareaEl) {
        textareaEl.focus();
        // Select the URL part for easy editing
        const urlStart = start + (selected || 'Link Text').length + 3;
        const urlEnd = urlStart + 'https://example.com'.length;
        textareaEl.setSelectionRange(urlStart, urlEnd);
      }
    }, 0);
  }

  async function uploadImage(file: File) {
    if (!file || !file.type.startsWith('image/')) {
      uploadError = 'Please select an image file';
      return;
    }

    uploadError = null;
    isUploading = true;

    try {
      // Compress image to save storage space (target: <100KB)
      let processedFile = file;
      
      if (file.size > 100000) { // If larger than 100KB
        processedFile = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 600,
          quality: 0.7
        });
        // Image compressed for storage optimization
      }

      const fileExt = processedFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('blog')
        .upload(filePath, processedFile);

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('blog').getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        const imageMarkdown = `\n![Blog Image](${data.publicUrl})\n`;
        insertText(imageMarkdown);
      }
    } catch (error: any) {
      uploadError = error.message || 'Upload failed';
    } finally {
      isUploading = false;
    }
  }

  // Simple image compression function
  async function compressImage(file: File, options: { maxWidth: number; maxHeight: number; quality: number }): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const ratio = Math.min(options.maxWidth / width, options.maxHeight / height);
        
        if (ratio < 1) {
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          options.quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.[0]) {
      uploadImage(files[0]);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadImage(file);
        break;
      }
    }
  }
</script>

<div class="border rounded-lg overflow-hidden bg-white">
  <!-- WordPress-Style Toolbar -->
  <div class="flex items-center gap-1 p-3 border-b bg-gray-50 flex-wrap">
    <!-- Header Buttons -->
    <div class="flex items-center gap-1 mr-2">
      <button 
        type="button" 
        class="px-2 py-1 text-sm border rounded hover:bg-gray-100 font-bold"
        onclick={() => addHeader(1)}
        title="Heading 1"
      >
        H1
      </button>
      <button 
        type="button" 
        class="px-2 py-1 text-sm border rounded hover:bg-gray-100 font-bold"
        onclick={() => addHeader(2)}
        title="Heading 2"
      >
        H2
      </button>
      <button 
        type="button" 
        class="px-2 py-1 text-sm border rounded hover:bg-gray-100 font-bold"
        onclick={() => addHeader(3)}
        title="Heading 3"
      >
        H3
      </button>
    </div>
    
    <!-- Divider -->
    <div class="h-6 w-px bg-gray-300 mx-1"></div>
    
    <!-- Text Formatting -->
    <div class="flex items-center gap-1 mr-2">
      <button 
        type="button" 
        class="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onclick={() => addBold()}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      
      <button 
        type="button" 
        class="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onclick={() => addItalic()}
        title="Italic"
      >
        <em>I</em>
      </button>
    </div>
    
    <!-- Divider -->
    <div class="h-6 w-px bg-gray-300 mx-1"></div>
    
    <!-- Lists and Links -->
    <div class="flex items-center gap-1 mr-2">
      <button 
        type="button" 
        class="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onclick={() => addList()}
        title="Bullet List"
      >
        • List
      </button>
      
      <button 
        type="button" 
        class="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onclick={() => addNumberedList()}
        title="Numbered List"
      >
        1. List
      </button>
      
      <button 
        type="button" 
        class="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onclick={() => addLink()}
        title="Insert Link"
      >
        🔗 Link
      </button>
    </div>
    
    <!-- Divider -->
    <div class="h-6 w-px bg-gray-300 mx-1"></div>
    
    <!-- Image Upload -->
    <label class="px-3 py-1 text-sm border rounded hover:bg-gray-100 cursor-pointer">
      {isUploading ? '⏳ Uploading...' : '📷 Image'}
      <input 
        type="file" 
        accept="image/*" 
        class="hidden" 
        onchange={(e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) uploadImage(file);
        }}
      />
    </label>
    
    <!-- Undo/Redo -->
    <div class="flex items-center gap-1 mr-2">
      <button 
        type="button" 
        class="px-2 py-1 text-sm border rounded hover:bg-gray-100 {undoHistory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
        onclick={undo}
        disabled={undoHistory.length === 0}
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      
      <button 
        type="button" 
        class="px-2 py-1 text-sm border rounded hover:bg-gray-100 {redoHistory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
        onclick={redo}
        disabled={redoHistory.length === 0}
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>
    </div>

    <!-- Preview Toggle -->
    <div class="ml-auto">
      <button 
        type="button" 
        class="px-3 py-1 text-sm border rounded hover:bg-gray-100 {showPreview ? 'bg-blue-100 border-blue-300' : ''}"
        onclick={() => showPreview = !showPreview}
      >
        {showPreview ? '✏️ Edit' : '👁️ Preview'}
      </button>
    </div>
  </div>

  <!-- Error Display -->
  {#if uploadError}
    <div class="px-3 py-2 text-sm text-red-600 bg-red-50 border-b">
      {uploadError}
    </div>
  {/if}

  <!-- Editor/Preview Area -->
  {#if showPreview}
    <div class="p-4 min-h-[400px] prose max-w-none">
      {@html renderMarkdown(value)}
    </div>
  {:else}
    <textarea
      bind:this={textareaEl}
      bind:value={value}
      {placeholder}
      class="w-full min-h-[400px] p-4 resize-none outline-none font-mono text-sm"
      ondrop={handleDrop}
      onpaste={handlePaste}
      onkeydown={handleKeyDown}
      oninput={saveState}
      ondragover={(e) => e.preventDefault()}
    ></textarea>
  {/if}
  
  <!-- Status Bar -->
  <div class="px-4 py-2 text-xs text-gray-500 border-t bg-gray-50">
    {value.trim().split(/\s+/).filter(Boolean).length} words • 
    {Math.max(1, Math.round(value.trim().split(/\s+/).filter(Boolean).length / 200))} min read • 
    Drag & drop images or paste from clipboard
  </div>
</div>

<style>
  .prose h1, .prose h2, .prose h3 {
    font-weight: bold;
    margin: 1rem 0 0.5rem 0;
  }
  
  .prose h1 {
    font-size: 1.5rem;
  }
  
  .prose h2 {
    font-size: 1.25rem;
  }
  
  .prose h3 {
    font-size: 1.125rem;
  }
  
  .prose p {
    margin: 0.5rem 0;
    line-height: 1.6;
  }
  
  .prose img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1rem 0;
  }
  
  .prose strong {
    font-weight: bold;
  }
  
  .prose em {
    font-style: italic;
  }
  
  .prose a {
    color: #2563eb;
    text-decoration: underline;
  }
</style>

