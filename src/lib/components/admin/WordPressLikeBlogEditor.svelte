<script lang="ts">
  // @ts-ignore - types provided via ambient d.ts
  import MarkdownIt from 'markdown-it';
  // @ts-ignore - types provided via ambient d.ts
  import sanitizeHtml from 'sanitize-html';
  import { supabase } from '$lib/supabase';
  import { compressImage, validateImageFile, generateImageFilename } from '$lib/utils/imageUtils';

  let { value = $bindable(''), placeholder = 'Start writing your blog post...' } = $props<{ value?: string; placeholder?: string }>();
  
  let showPreview = $state(false);
  let isFullscreen = $state(false);
  let wordCount = $state(0);
  let readingTime = $state(0);
  let showFormatDropdown = $state(false);
  let currentFormat = $state('paragraph');
  
  const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

  let textareaEl: HTMLTextAreaElement | null = $state(null);
  let isUploading = $state(false);
  let uploadError: string | null = $state(null);
  let uploadProgress = $state(0);

  // Auto-save functionality
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastSaved = $state<Date | null>(null);
  let hasUnsavedChanges = $state(false);
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
  let autoSaveEnabled = $state(true);
  let isDragOver = $state(false);
  let dragCounter = $state(0);

  // Undo/Redo system
  let undoHistory: string[] = $state([]);
  let redoHistory: string[] = $state([]);
  let lastSavedValue = $state('');
  let typingTimer: ReturnType<typeof setTimeout>;
  let isTyping = $state(false);

  function saveStateForUndo() {
    const currentValue = value || '';
    if (currentValue !== lastSavedValue) {
      // Add current lastSavedValue to undo history
      if (lastSavedValue !== '') {
        undoHistory = [...undoHistory, lastSavedValue];
        console.log('Saved state for undo. History length:', undoHistory.length);
        if (undoHistory.length > 50) {
          undoHistory = undoHistory.slice(-50); // Keep last 50 states
        }
      }
      redoHistory = []; // Clear redo history when new changes are made
      lastSavedValue = currentValue;
    }
  }

  function undo() {
    console.log('Undo called. History length:', undoHistory.length);
    if (undoHistory.length > 0) {
      const currentValue = value || '';
      const previousValue = undoHistory[undoHistory.length - 1];
      
      console.log('Undoing from:', currentValue.substring(0, 50), 'to:', previousValue.substring(0, 50));
      
      // Add current value to redo stack
      redoHistory = [...redoHistory, currentValue];
      
      // Remove last item from undo stack
      undoHistory = undoHistory.slice(0, -1);
      
      // Set the previous value
      value = previousValue;
      lastSavedValue = previousValue;
      
      // Focus and set cursor to end
      setTimeout(() => {
        if (textareaEl) {
          textareaEl.focus();
          textareaEl.setSelectionRange(textareaEl.value.length, textareaEl.value.length);
        }
      }, 0);
    } else {
      console.log('No undo history available');
    }
  }

  function redo() {
    if (redoHistory.length > 0) {
      const currentValue = value || '';
      const nextValue = redoHistory[redoHistory.length - 1];
      
      // Add current value to undo stack
      undoHistory = [...undoHistory, currentValue];
      
      // Remove last item from redo stack
      redoHistory = redoHistory.slice(0, -1);
      
      // Set the next value
      value = nextValue;
      lastSavedValue = nextValue;
      
      // Focus and set cursor to end
      setTimeout(() => {
        if (textareaEl) {
          textareaEl.focus();
          textareaEl.setSelectionRange(textareaEl.value.length, textareaEl.value.length);
        }
      }, 0);
    }
  }

  // Auto-save function
  async function performAutoSave() {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;
    
    saveStatus = 'saving';
    try {
      // Simulate auto-save (in real implementation, this would save to localStorage or server)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store in localStorage as backup
      localStorage.setItem('blog-editor-autosave', JSON.stringify({
        content: value,
        timestamp: Date.now()
      }));
      
      saveStatus = 'saved';
      lastSaved = new Date();
      hasUnsavedChanges = false;
      
      // Clear saved status after 3 seconds
      setTimeout(() => {
        if (saveStatus === 'saved') saveStatus = 'idle';
      }, 3000);
    } catch (error) {
      saveStatus = 'error';
      console.error('Auto-save failed:', error);
      setTimeout(() => {
        if (saveStatus === 'error') saveStatus = 'idle';
      }, 5000);
    }
  }

  $effect(() => {
    // Calculate word count and reading time
    const words = value.trim().split(/\s+/).filter(Boolean);
    wordCount = words.length;
    readingTime = Math.max(1, Math.round(wordCount / 200));
    
    // Detect current format when content changes
    detectCurrentFormat();
    
    // Initialize undo system with initial value
    if (lastSavedValue === '' && value) {
      lastSavedValue = value;
      // Start with empty history so first edit creates an undo point
      undoHistory = [];
      redoHistory = [];
    }
    
    // Mark as having unsaved changes and trigger auto-save
    if (value) {
      hasUnsavedChanges = true;
      saveStatus = 'idle';
      
      // Auto-save after 3 seconds of inactivity
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        performAutoSave();
      }, 3000) as ReturnType<typeof setTimeout>;
    }
  });

  function wrapSelection(prefix: string, suffix: string = prefix) {
    if (!textareaEl) return;
    
    // Save state for undo
    saveStateForUndo();
    
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

  export function insertAtCursor(text: string) {
    if (!textareaEl) return;
    
    // Save state for undo
    saveStateForUndo();
    
    const start = textareaEl.selectionStart || 0;
    const end = textareaEl.selectionEnd || 0;
    value = value.slice(0, start) + text + value.slice(end);
    const pos = start + text.length;
    queueMicrotask(() => {
      textareaEl?.focus();
      textareaEl?.setSelectionRange(pos, pos);
    });
  }

  // Format options for dropdown
  const formatOptions = [
    { value: 'paragraph', label: 'Paragraph', shortcut: 'Ctrl+Alt+7' },
    { value: 'h1', label: 'Heading 1', shortcut: 'Ctrl+Alt+1' },
    { value: 'h2', label: 'Heading 2', shortcut: 'Ctrl+Alt+2' },
    { value: 'h3', label: 'Heading 3', shortcut: 'Ctrl+Alt+3' },
    { value: 'h4', label: 'Heading 4', shortcut: 'Ctrl+Alt+4' },
    { value: 'h5', label: 'Heading 5', shortcut: 'Ctrl+Alt+5' },
    { value: 'h6', label: 'Heading 6', shortcut: 'Ctrl+Alt+6' }
  ];

  function applyFormat(format: string) {
    if (!textareaEl) return;
    
    // Save state for undo
    saveStateForUndo();
    
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    const currentLine = value.substring(lineStart, actualLineEnd);
    
    // Remove existing heading markers
    const cleanLine = currentLine.replace(/^#+\s*/, '');
    
    let replacement = cleanLine;
    if (format.startsWith('h')) {
      const level = parseInt(format.slice(1));
      const hashes = '#'.repeat(level);
      replacement = `${hashes} ${cleanLine}`;
    }
    
    const newValue = value.substring(0, lineStart) + replacement + value.substring(actualLineEnd);
    value = newValue;
    
    // Update current format and close dropdown
    currentFormat = format;
    showFormatDropdown = false;
    
    // Update cursor position
    const newCursorPos = lineStart + replacement.length;
    textareaEl.focus();
    setTimeout(() => {
      textareaEl?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  function insertHeading(level: number) {
    applyFormat(`h${level}`);
  }

  // Detect current format based on cursor position
  function detectCurrentFormat() {
    if (!textareaEl) return;
    
    const start = textareaEl.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    const currentLine = value.substring(lineStart, actualLineEnd);
    
    const headingMatch = currentLine.match(/^(#+)\s/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      currentFormat = `h${level}`;
    } else {
      currentFormat = 'paragraph';
    }
  }

  // Get CSS class for heading styles in dropdown
  function getHeadingClass(format: string) {
    switch (format) {
      case 'h1': return 'text-2xl font-bold';
      case 'h2': return 'text-xl font-bold';
      case 'h3': return 'text-lg font-semibold';
      case 'h4': return 'text-base font-semibold';
      case 'h5': return 'text-sm font-medium';
      case 'h6': return 'text-xs font-medium';
      default: return '';
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.format-dropdown') && !target.closest('.format-dropdown-btn')) {
      showFormatDropdown = false;
    }
    if (!target.closest('[class*="table"]') && !target.closest('.btn-tool[title*="Table"]')) {
      showTableBuilder = false;
    }
  }

  // Smart link insertion with title detection
  async function insertSmartLink() {
    if (!textareaEl) return;
    
    const url = prompt('Enter URL:');
    if (!url) return;
    
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      // Use selected text as link text
      wrapSelection('[', `](${url})`);
    } else {
      // Try to fetch page title
      let linkText = url;
      try {
        // This would normally fetch the page title, but for demo purposes we'll use the URL
        // In a real implementation, you'd make a server-side request to avoid CORS issues
        const domain = new URL(url).hostname.replace('www.', '');
        linkText = domain;
      } catch (e) {
        linkText = url;
      }
      
      const linkMarkdown = `[${linkText}](${url})`;
      const newValue = value.substring(0, start) + linkMarkdown + value.substring(end);
      value = newValue;
      
      // Position cursor after the link
      const newCursorPos = start + linkMarkdown.length;
      textareaEl.focus();
      setTimeout(() => {
        textareaEl?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  }

  // Insert image by URL (for content, not cover image)
  function insertImageUrl() {
    const url = prompt('Enter Image URL:');
    if (!url) return;
    
    const altText = prompt('Enter alt text for the image:') || 'Image';
    const imageMarkdown = `![${altText}](${url})\n\n`;
    insertAtCursor(imageMarkdown);
  }

  // Auto-convert URLs to links
  function autoLinkify() {
    if (!textareaEl) return;
    
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const newValue = value.replace(urlRegex, (match: string) => {
      // Don't convert if already part of a markdown link
      const beforeMatch = value.substring(0, value.indexOf(match));
      if (beforeMatch.endsWith('](') || beforeMatch.includes(`[`) && !beforeMatch.includes(`](${match})`)) {
        return match;
      }
      return `[${match}](${match})`;
    });
    
    if (newValue !== value) {
      saveStateForUndo();
      value = newValue;
    }
  }

  function insertList(ordered = false) {
    const prefix = ordered ? '1. ' : '- ';
    insertAtCursor(`\n\n${prefix}List item 1\n${prefix}List item 2\n${prefix}List item 3\n\n`);
  }

  // Table builder variables
  let showTableBuilder = $state(false);
  let tableRows = $state(3);
  let tableCols = $state(3);

  function insertTable() {
    showTableBuilder = true;
  }

  function buildTable() {
    let table = '\n\n';
    
    // Header row
    table += '|';
    for (let col = 1; col <= tableCols; col++) {
      table += ` Header ${col} |`;
    }
    table += '\n';
    
    // Separator row
    table += '|';
    for (let col = 1; col <= tableCols; col++) {
      table += '----------|';
    }
    table += '\n';
    
    // Data rows
    for (let row = 1; row <= tableRows; row++) {
      table += '|';
      for (let col = 1; col <= tableCols; col++) {
        table += ` Row ${row} Col ${col} |`;
      }
      table += '\n';
    }
    
    table += '\n';
    insertAtCursor(table);
    showTableBuilder = false;
  }

  function insertSimpleTable() {
    const table = `\n\n| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |
| Row 3    | Data     | Data     |\n\n`;
    insertAtCursor(table);
  }

  function insertCodeBlock() {
    if (!textareaEl) return;
    
    // Check if user has selected text
    const start = textareaEl.selectionStart || 0;
    const end = textareaEl.selectionEnd || 0;
    const selectedText = value.substring(start, end);
    
    if (selectedText.trim()) {
      // Wrap selected text in code block
      const language = prompt('Enter language (optional):') || '';
      const codeBlock = `\n\n\`\`\`${language}\n${selectedText}\n\`\`\`\n\n`;
      insertAtCursor(codeBlock);
    } else {
      // Insert template code block
      const language = prompt('Enter language (javascript, python, css, html, etc.):') || 'javascript';
      let template = '';
      
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          template = '// Your JavaScript code here\nfunction example() {\n  console.log("Hello World!");\n}';
          break;
        case 'python':
        case 'py':
          template = '# Your Python code here\ndef example():\n    print("Hello World!")';
          break;
        case 'html':
          template = '<!-- Your HTML code here -->\n<div class="example">\n  <h1>Hello World!</h1>\n</div>';
          break;
        case 'css':
          template = '/* Your CSS code here */\n.example {\n  color: #333;\n  font-size: 16px;\n}';
          break;
        case 'bash':
        case 'shell':
          template = '# Your shell commands here\necho "Hello World!"\nls -la';
          break;
        case 'sql':
          template = '-- Your SQL code here\nSELECT * FROM users\nWHERE active = true;';
          break;
        default:
          template = `// Your ${language} code here\n// Add your code below`;
      }
      
      const codeBlock = `\n\n\`\`\`${language}\n${template}\n\`\`\`\n\n`;
      insertAtCursor(codeBlock);
    }
  }

  function insertQuote() {
    insertAtCursor('\n\n> This is a blockquote\n> \n> You can write multiple lines\n\n');
  }

  function insertHorizontalRule() {
    insertAtCursor('\n\n---\n\n');
  }



  async function uploadImage(file: File) {
    uploadError = null;
    uploadProgress = 0;
    if (!file) return;
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      uploadError = validation.error || 'Invalid file';
      return;
    }
    
    isUploading = true;
    
    try {
      // Compress image if it's too large (> 500KB)
      let processedFile = file;
      if (file.size > 500000) {
        uploadProgress = 25;
        processedFile = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 800,
          quality: 0.8,
          format: 'jpeg'
        });
      }
      
      uploadProgress = 50;
      
      // Generate unique filename
      const path = generateImageFilename(processedFile.name);
      
      const { error: upErr } = await supabase.storage.from('blog').upload(path, processedFile, {
        cacheControl: '3600',
        upsert: false
      });
      
      uploadProgress = 75;
      
      if (upErr) throw upErr;
      
      const { data } = supabase.storage.from('blog').getPublicUrl(path);
      const url = data?.publicUrl || '';
      
      uploadProgress = 100;
      
      if (url) {
        const altText = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        insertAtCursor(`\n\n![${altText}](${url})\n\n`);
      }
    } catch (e: any) {
      uploadError = e?.message || 'Upload failed';
    } finally {
      isUploading = false;
      uploadProgress = 0;
    }
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter++;
    if (e.dataTransfer?.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].type.startsWith('image/')) {
          isDragOver = true;
          break;
        }
      }
    }
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      isDragOver = false;
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter = 0;
    isDragOver = false;
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          uploadImage(file);
        }
      }
    }
  }

  function onPaste(e: ClipboardEvent) {
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

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    if (isFullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (!isFullscreen && document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  function renderHtml(): string {
    const html = md.render(value || '');
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption', 'iframe', 'table', 'thead', 'tbody', 'tr', 'th', 'td']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'loading', 'width', 'height'],
        a: ['href', 'name', 'target', 'rel'],
        iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen'],
        table: ['class'],
        th: ['align', 'colspan', 'rowspan'],
        td: ['align', 'colspan', 'rowspan']
      },
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' })
      }
    });
  }

  // Handle typing for undo/redo
  function onInput() {
    hasUnsavedChanges = true;
    
    // Save state for undo before starting to type (first keystroke)
    if (!isTyping) {
      isTyping = true;
      // Save the previous state before typing starts
      saveStateForUndo();
    }
    
    // Reset the timer each keystroke
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      isTyping = false;
      // This will be ready for the next typing session
    }, 2000); // Give 2 seconds before considering typing stopped
  }

  // Keyboard shortcuts
  function onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          wrapSelection('**', '**');
          break;
        case 'i':
          e.preventDefault();
          wrapSelection('*', '*');
          break;
        case 'k':
          e.preventDefault();
          insertSmartLink();
          break;
        case 'Enter':
          e.preventDefault();
          showPreview = !showPreview;
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
      }
      
      // Format shortcuts with Alt key
      if (e.altKey) {
        const key = e.key;
        if (key >= '1' && key <= '6') {
          e.preventDefault();
          applyFormat(`h${key}`);
        } else if (key === '7') {
          e.preventDefault();
          applyFormat('paragraph');
        }
      }
    }
    
    // Undo/Redo shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
    
    // Detect format on cursor movement
    setTimeout(detectCurrentFormat, 0);
  }
</script>

<div class="blog-editor flex flex-col h-full {isFullscreen ? 'fullscreen' : ''}" class:border={!isFullscreen} class:rounded-lg={!isFullscreen} onclick={handleClickOutside}>
  <!-- Toolbar -->
  <div class="toolbar flex flex-wrap items-center gap-1 p-3 border-b bg-gray-50">
    <!-- Text Formatting -->
    <div class="flex items-center gap-1 pr-2 border-r">
      <button type="button" class="btn-tool" onclick={() => wrapSelection('**', '**')} title="Bold (Ctrl+B)">
        <strong>B</strong>
      </button>
      <button type="button" class="btn-tool" onclick={() => wrapSelection('*', '*')} title="Italic (Ctrl+I)">
        <em>I</em>
      </button>
      <button type="button" class="btn-tool" onclick={() => wrapSelection('~~', '~~')} title="Strikethrough">
        <s>S</s>
      </button>
      <button type="button" class="btn-tool" onclick={() => wrapSelection('`', '`')} title="Inline Code">
        {'</>'}
      </button>
    </div>

    <!-- Format Dropdown -->
    <div class="relative pr-2 border-r">
      <button 
        type="button" 
        class="format-dropdown-btn px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-2 min-w-[140px]"
        onclick={() => showFormatDropdown = !showFormatDropdown}
        title="Format text"
      >
        <span class="format-display">
          {formatOptions.find(opt => opt.value === currentFormat)?.label || 'Paragraph'}
        </span>
        <svg class="w-4 h-4 {showFormatDropdown ? 'rotate-180' : ''} transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      {#if showFormatDropdown}
        <div class="format-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
          {#each formatOptions as option}
            <button
              type="button"
              class="format-option w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0 {currentFormat === option.value ? 'bg-blue-50 text-blue-700' : ''}"
              onclick={() => applyFormat(option.value)}
            >
              <span class="format-label text-sm {option.value.startsWith('h') ? getHeadingClass(option.value) : ''}">{option.label}</span>
              <span class="text-xs text-gray-400">{option.shortcut}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Table Builder Modal -->
    {#if showTableBuilder}
      <div class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
        <h3 class="text-sm font-semibold mb-3">Insert Table</h3>
        
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Columns</label>
            <input 
              type="range" 
              min="2" 
              max="8" 
              bind:value={tableCols}
              class="w-full"
            />
            <div class="text-xs text-gray-500 text-center">{tableCols} columns</div>
          </div>
          
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Rows</label>
            <input 
              type="range" 
              min="2" 
              max="10" 
              bind:value={tableRows}
              class="w-full"
            />
            <div class="text-xs text-gray-500 text-center">{tableRows} rows</div>
          </div>
          
          <!-- Table Preview -->
          <div class="border rounded p-2 bg-gray-50">
            <div class="text-xs text-gray-600 mb-1">Preview:</div>
            <div class="grid gap-1" style="grid-template-columns: repeat({tableCols}, 1fr);">
              {#each Array(tableCols) as _, col}
                <div class="text-xs p-1 bg-blue-100 border text-center font-medium">H{col + 1}</div>
              {/each}
              {#each Array(tableRows) as _, row}
                {#each Array(tableCols) as _, col}
                  <div class="text-xs p-1 bg-white border text-center">R{row + 1}C{col + 1}</div>
                {/each}
              {/each}
            </div>
          </div>
        </div>
        
        <div class="flex justify-between mt-4">
          <button 
            type="button"
            class="px-3 py-1 text-xs border rounded hover:bg-gray-50"
            onclick={() => showTableBuilder = false}
          >
            Cancel
          </button>
          <div class="flex gap-2">
            <button 
              type="button"
              class="px-3 py-1 text-xs border rounded hover:bg-gray-50"
              onclick={insertSimpleTable}
            >
              Simple Table
            </button>
            <button 
              type="button"
              class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              onclick={buildTable}
            >
              Insert Table
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Lists and Structure -->
    <div class="flex items-center gap-1 pr-2 border-r">
      <button type="button" class="btn-tool" onclick={() => insertList(false)} title="Bullet List">•</button>
      <button type="button" class="btn-tool" onclick={() => insertList(true)} title="Numbered List">1.</button>
      <button type="button" class="btn-tool" onclick={() => insertQuote()} title="Quote">❝</button>
      <button type="button" class="btn-tool" onclick={() => insertHorizontalRule()} title="Horizontal Rule">—</button>
    </div>

    <!-- Advanced -->
    <div class="flex items-center gap-1 pr-2 border-r">
              <button type="button" class="btn-tool" onclick={() => insertCodeBlock()} title="Code Block">{'{ }'}</button>
      <button type="button" class="btn-tool" onclick={() => insertTable()} title="Table">⚏</button>
      <button type="button" class="btn-tool" onclick={insertSmartLink} title="Insert Link (Ctrl+K)">🔗</button>
      <button type="button" class="btn-tool" onclick={autoLinkify} title="Convert URLs to Links">🌐</button>
    </div>

    <!-- Media -->
    <div class="flex items-center gap-1 pr-2 border-r">
      <button type="button" class="btn-tool" onclick={insertImageUrl} title="Insert Image by URL">🖼️</button>
      <label class="btn-tool cursor-pointer" title="Upload Image (Drag & Drop)">
        {#if isUploading}
          <span class="text-xs">{uploadProgress}%</span>
        {:else}
          📷
        {/if}
        <input type="file" accept="image/*" class="hidden" onchange={(e) => uploadImage((e.target as HTMLInputElement).files?.[0] as File)} />
      </label>
    </div>

    <!-- Undo/Redo -->
    <div class="flex items-center gap-1 pr-2 border-r">
      <button 
        type="button" 
        class="btn-tool {undoHistory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
        onclick={undo}
        disabled={undoHistory.length === 0}
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button 
        type="button" 
        class="btn-tool {redoHistory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
        onclick={redo}
        disabled={redoHistory.length === 0}
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>
    </div>

    <!-- View Controls -->
    <div class="flex items-center gap-1 ml-auto">
      <button type="button" class="btn-tool" onclick={() => showPreview = !showPreview} title="Preview (Ctrl+Enter)">
        {showPreview ? '✏️' : '👁️'}
      </button>
      <button type="button" class="btn-tool" onclick={toggleFullscreen} title="Fullscreen">
        {isFullscreen ? '⤓' : '⤢'}
      </button>
    </div>
  </div>

  <!-- Upload Progress -->
  {#if isUploading && uploadProgress > 0}
    <div class="px-3 py-2 bg-blue-50 border-b">
      <div class="flex items-center gap-2 text-sm text-blue-600">
        <span>Uploading image...</span>
        <div class="flex-1 bg-blue-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: {uploadProgress}%"></div>
        </div>
        <span>{uploadProgress}%</span>
      </div>
    </div>
  {/if}

  <!-- Upload Error -->
  {#if uploadError}
    <div class="px-3 py-2 text-sm text-red-600 border-b bg-red-50">
      ❌ {uploadError}
    </div>
  {/if}

  <!-- Editor/Preview Area -->
  <div class="editor-area flex flex-1 overflow-hidden" class:h-screen={isFullscreen}>
    {#if !showPreview}
      <!-- Editor -->
      <div class="flex-1 relative overflow-hidden">
        <textarea
          bind:this={textareaEl}
          bind:value={value}
          placeholder={placeholder}
          class="w-full h-full p-4 font-mono text-sm outline-none resize-none overflow-y-auto {isDragOver ? 'drag-over' : ''}"
          style="min-height: 100%;"
          ondragenter={onDragEnter}
          ondragleave={onDragLeave}
          ondragover={onDragOver}
          ondrop={onDrop}
          onpaste={onPaste}
          onkeydown={onKeyDown}
          oninput={onInput}
        ></textarea>
        
        <!-- Drag Overlay -->
        {#if isDragOver}
          <div class="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 flex items-center justify-center z-10">
            <div class="text-center text-blue-700">
              <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p class="text-lg font-medium">Drop images to upload</p>
              <p class="text-sm opacity-75">Supports JPG, PNG, GIF, WebP</p>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Preview -->
      <div class="flex-1 overflow-y-auto">
        <div class="prose prose-lg max-w-none p-6">
          {@html renderHtml()}
        </div>
      </div>
    {/if}
  </div>

  <!-- Status Bar -->
  <div class="status-bar flex items-center justify-between px-4 py-2 text-xs text-gray-600 border-t bg-gray-50">
    <div class="flex items-center gap-4">
      <span>{wordCount} words</span>
      <span>{readingTime} min read</span>
      
      <!-- Auto-save status -->
      <div class="flex items-center gap-2">
        {#if saveStatus === 'saving'}
          <div class="flex items-center gap-1 text-blue-600">
            <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Saving...</span>
          </div>
        {:else if saveStatus === 'saved'}
          <div class="flex items-center gap-1 text-green-600">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span>Saved</span>
          </div>
        {:else if saveStatus === 'error'}
          <div class="flex items-center gap-1 text-red-600">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <span>Save failed</span>
          </div>
        {:else if hasUnsavedChanges}
          <span class="text-amber-600">● Unsaved changes</span>
        {/if}
        
        {#if lastSaved}
          <span class="text-gray-500">Last saved: {lastSaved.toLocaleTimeString()}</span>
        {/if}
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <button 
        type="button" 
        class="text-xs hover:text-gray-800 {autoSaveEnabled ? 'text-green-600' : 'text-gray-400'}"
        onclick={() => autoSaveEnabled = !autoSaveEnabled}
        title="{autoSaveEnabled ? 'Disable' : 'Enable'} auto-save"
      >
        Auto-save: {autoSaveEnabled ? 'ON' : 'OFF'}
      </button>
      <span class="text-gray-400">•</span>
      <span>Drag & drop images • Paste from clipboard • Ctrl+B/I/K shortcuts</span>
    </div>
  </div>
</div>

<style>
  .blog-editor {
    overflow: hidden;
  }
  
  .blog-editor.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    background: white;
  }
  
  .btn-tool {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    text-align: center;
    min-width: 32px;
    transition: background-color 0.15s ease-in-out;
  }
  
  .btn-tool:hover {
    background-color: #f3f4f6;
  }
  
  .editor-area {
    min-height: 500px;
  }
  
  .prose {
    color: #1f2937;
  }
  
  .prose img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
  
  .prose table {
    border-collapse: collapse;
    border: 1px solid #d1d5db;
    width: 100%;
  }
  
  .prose th,
  .prose td {
    border: 1px solid #d1d5db;
    padding: 1rem;
  }
  
  .prose th {
    background-color: #f3f4f6;
    font-weight: 600;
  }
  
  .prose blockquote {
    border-left: 4px solid #3b82f6;
    padding-left: 1rem;
    font-style: italic;
    color: #374151;
  }
  
  .prose code {
    background-color: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
  
  .prose pre {
    background-color: #111827;
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }
  
  .prose pre code {
    background: transparent;
    padding: 0;
  }

  /* Format Dropdown Styling */
  .format-dropdown {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    background: white;
    max-height: 300px;
    overflow-y: auto;
  }

  .format-dropdown-btn {
    transition: all 0.2s ease;
    background: white;
  }

  .format-dropdown-btn:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .format-option {
    transition: all 0.15s ease;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
  }

  .format-option:hover {
    background: #f9fafb !important;
  }

  .format-option:last-child {
    border-bottom: none;
  }

  .format-label {
    transition: all 0.15s ease;
  }

  /* WordPress-like heading preview styles in dropdown */
  .format-option .text-2xl { font-size: 1.25rem; }
  .format-option .text-xl { font-size: 1.125rem; }
  .format-option .text-lg { font-size: 1.063rem; }
  .format-option .text-base { font-size: 1rem; }
  .format-option .text-sm { font-size: 0.95rem; }
  .format-option .text-xs { font-size: 0.9rem; }

  /* Drag and Drop Styling */
  .drag-over {
    background-color: #fefce8 !important;
    border-color: #eab308 !important;
  }

  .editor-area {
    position: relative;
  }
</style>
