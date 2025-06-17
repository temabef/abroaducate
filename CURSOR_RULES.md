# Cursor Rules for Abroaducate Development

## Overview

This document outlines the coding standards, linting rules, and best practices for developing the Abroaducate platform using Cursor IDE. These rules are designed to maintain code quality, consistency, and developer efficiency across our SvelteKit application.

## Code Style & Formatting

### Indentation & Spacing
- Use 2 spaces for indentation (not tabs)
- Include a single blank line between logical sections of code
- Use a single space after keywords like `if`, `for`, `while`
- No trailing whitespace at the end of lines

### Line Length
- Maximum line length: 100 characters
- Break long lines at logical points (after operators, commas)

### Naming Conventions
- **Components**: PascalCase (e.g., `UniversityMatcher.svelte`)
- **Files**: kebab-case for non-component files (e.g., `germany-university-integration.ts`)
- **Variables/Functions**: camelCase (e.g., `getUserProfile`)
- **Stores**: camelCase with a descriptive name (e.g., `universityStore`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

### File Structure
- Each Svelte component should be in its own file
- Group related components in subdirectories
- Keep components under 300 lines when possible; extract functionality for larger components

## SvelteKit Specific Rules

### Component Structure
- Order component sections consistently:
  1. Script
  2. Script setup / props
  3. Reactive statements
  4. Functions
  5. Lifecycle methods
  6. Template
  7. Style

```svelte
<script lang="ts">
  // Imports
  import { onMount } from 'svelte';
  
  // Props
  export let universityData;
  
  // Local state
  let isLoading = true;
  
  // Reactive statements
  $: filteredUniversities = universityData?.filter(u => u.country === selectedCountry);
  
  // Functions
  function handleSelection() {
    // Implementation
  }
  
  // Lifecycle
  onMount(() => {
    // Setup code
    isLoading = false;
  });
</script>

<!-- Template -->
<div>
  <!-- Content -->
</div>

<style>
  /* Styles */
</style>
```

### Prop Definitions
- Always use TypeScript for prop definitions
- Provide default values where appropriate
- Document complex props with comments

```svelte
<script lang="ts">
  // Clearly defined props with types and defaults
  export let universities: University[] = [];
  export let selectedCountry: string = 'US';
  export let maxResults: number = 10;
  
  // Complex object with documentation
  /**
   * Configuration options for filtering universities
   * @property {string[]} countries - List of countries to include
   * @property {boolean} includeRankings - Whether to show rankings
   */
  export let filterOptions: FilterOptions = {
    countries: [],
    includeRankings: true
  };
</script>
```

### Event Handling
- Use event forwarding with createEventDispatcher
- Name custom events with a verb-noun pattern
- Provide typed event detail

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    universitySelect: { id: string, name: string };
    filterChange: { filter: string, value: any };
  }>();
  
  function selectUniversity(id: string, name: string) {
    dispatch('universitySelect', { id, name });
  }
</script>
```

## TypeScript Rules

### Type Definitions
- Create interfaces/types for all data structures
- Place shared types in `src/app.d.ts` or dedicated type files
- Use explicit return types for non-trivial functions
- Avoid `any` type; use `unknown` when type is truly unknown

### Type Examples
```typescript
// Good
interface University {
  id: string;
  name: string;
  country: string;
  ranking?: number;
}

function getUniversityById(id: string): Promise<University | null> {
  // Implementation
}

// Avoid
function processData(data: any): any {
  // Implementation
}
```

### Null Checking
- Use null checking with the optional chaining operator (`?.`)
- Provide fallbacks with nullish coalescing (`??`)
- Avoid non-null assertions (`!`) when possible

```typescript
// Good
const universityName = university?.name ?? 'Unknown University';

// Avoid
const universityName = university!.name;
```

## State Management

### Svelte Stores
- Use Svelte stores for shared application state
- Keep store files small and focused on a single responsibility
- Document the purpose and structure of each store

```typescript
// stores/universityStore.ts
import { writable } from 'svelte/store';
import type { University } from '../types';

export const universities = writable<University[]>([]);
export const selectedUniversity = writable<University | null>(null);
export const isLoading = writable<boolean>(false);

export function fetchUniversities() {
  isLoading.set(true);
  // Implementation
}
```

### Local State
- Prefer reactive statements for derived values
- Keep component state minimal and focused
- Initialize state values with appropriate defaults

## API & Service Interactions

### API Call Structure
- Use services for API calls, not components
- Handle errors consistently
- Include loading states for all asynchronous operations

```typescript
// services/universityService.ts
export async function fetchUniversities(country?: string): Promise<University[]> {
  try {
    const response = await fetch(`/api/universities/fetch?country=${country || ''}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching universities: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch universities:', error);
    throw error;
  }
}
```

### Error Handling
- Catch and handle errors at the appropriate level
- Display user-friendly error messages
- Log errors for debugging (but not sensitive data)
- Use consistent error handling patterns

## Performance Optimization

### Load Optimization
- Use SvelteKit's load functions appropriately
- Implement proper caching strategies
- Avoid unnecessary data fetching

```typescript
// routes/universities/+page.ts
import type { PageLoad } from './$types';
import { fetchUniversities } from '$lib/services/universityService';

export const load = (async ({ params, fetch }) => {
  return {
    universities: await fetchUniversities()
  };
}) satisfies PageLoad;
```

### Component Optimization
- Avoid unnecessary reactivity with `{#if}` blocks
- Use `{#key}` blocks when appropriate to force re-renders
- Break large components into smaller, focused ones

### Lazy Loading
- Lazy load heavy components and libraries
- Use dynamic imports for code splitting

```typescript
// Lazy loading a heavy component
import { onMount } from 'svelte';

let AcademicCVBuilder;
let showBuilder = false;

onMount(async () => {
  const module = await import('$lib/components/AcademicCVBuilder.svelte');
  AcademicCVBuilder = module.default;
  showBuilder = true;
});
```

## Accessibility Guidelines

### Basic Requirements
- All interactive elements must be keyboard accessible
- Maintain proper heading hierarchy (h1, h2, etc.)
- Include appropriate ARIA attributes
- Ensure sufficient color contrast (minimum 4.5:1 for normal text)

### Form Components
- All form controls must have associated labels
- Form validation must provide clear error messages
- Focus states must be visible

```svelte
<!-- Good form element example -->
<div>
  <label for="university-search" class="block text-sm font-medium">
    Search Universities
  </label>
  <input 
    id="university-search"
    type="search"
    aria-describedby="search-hint"
    class="form-input"
    bind:value={searchQuery}
  />
  <p id="search-hint" class="text-xs text-gray-500">
    Enter university name or country
  </p>
</div>
```

## Documentation

### Code Comments
- Use JSDoc for functions and complex code blocks
- Keep comments updated when code changes
- Focus on "why" not "what" in comments

```typescript
/**
 * Converts international GPA to US 4.0 scale
 * 
 * @param {number} gpa - Original GPA value
 * @param {string} country - Country code for the grading system
 * @returns {number} Converted GPA on 4.0 scale
 * 
 * Algorithm based on WES standards as of 2023
 */
function convertGPA(gpa: number, country: string): number {
  // Implementation
}
```

### Component Documentation
- Document complex components with README files or comments
- Include usage examples for reusable components
- Note any performance considerations

## Testing

### Test Structure
- Write unit tests for utility functions and services
- Create component tests for interactive components
- Implement integration tests for critical user flows

### Testing Guidelines
- Tests should be focused and independent
- Avoid testing implementation details
- Mock external dependencies appropriately

## Linting Configuration

### ESLint Rules
- Extend from recommended SvelteKit configuration
- Enforce TypeScript strict checking
- Disallow unused variables and imports
- Require consistent code style

### Example ESLint Configuration

```javascript
// eslint.config.js
export default {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    // Custom rules here
    'no-unused-vars': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always']
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  ]
};
```

## Git Workflow

### Commit Guidelines
- Use descriptive commit messages
- Structure commits logically (one feature/fix per commit)
- Follow conventional commits pattern: `type(scope): message`

```
feat(university-matcher): add filter by program type
fix(auth): resolve login redirect issue
docs(readme): update setup instructions
```

### Branch Strategy
- Use feature branches for new development
- Create fix branches for urgent repairs
- Use pull requests for code reviews

## IDE Configuration

### Cursor Extensions
- SvelteKit extension
- ESLint
- Prettier
- TypeScript

### Editor Settings
```json
{
  "editor.tabSize": 2,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "svelte.plugin.svelte.compilerWarnings": {
    "a11y-missing-attribute": "error",
    "a11y-img-redundant-alt": "error"
  }
}
```

## Conclusion

These Cursor rules are designed to improve code quality, maintainability, and development efficiency. They should evolve as the project grows and team feedback is incorporated. Regular reviews of these standards should be conducted to ensure they continue to serve the project's needs effectively. 