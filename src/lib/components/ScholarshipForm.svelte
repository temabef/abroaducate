<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let formData: any;
  export let editingScholarship: any;
  export let showAddForm: boolean = false;

  const dispatch = createEventDispatcher();

  // Validation error states
  let titleError = '';
  let providerError = '';
  let amountError = '';
  let deadlineError = '';
  let locationError = '';
  let fieldError = '';
  let levelError = '';
  let typeError = '';
  let descriptionError = '';
  let requirementsError = '';
  let websiteError = '';
  let minGpaError = '';
  let minIeltsError = '';
  let minToeflError = '';
  let ageLimitError = '';
  let nationalityRestrictionsError = '';
  let universityNameError = '';
  let programNameError = '';
  let departmentError = '';
  let fundingTypeError = '';
  let applicationMethodError = '';
  let professorNameError = '';
  let professorEmailError = '';
  let positionDetailsError = '';

  // Validation functions
  function validateTitle() {
    const title = formData.title.trim();
    if (!title) {
      titleError = 'Title is required';
    } else if (title.length < 3) {
      titleError = 'Title must be at least 3 characters';
    } else {
      titleError = '';
    }
  }

  function validateProvider() {
    const provider = formData.provider.trim();
    if (!provider) {
      providerError = 'Provider is required';
    } else if (provider.length < 2) {
      providerError = 'Provider must be at least 2 characters';
    } else {
      providerError = '';
    }
  }

  function validateAmount() {
    const amount = formData.amount.trim();
    if (amount && amount.length < 3) {
      amountError = 'Amount must be at least 3 characters';
    } else {
      amountError = '';
    }
  }

  function validateDeadline() {
    const deadline = formData.deadline;
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      if (deadlineDate < today) {
        deadlineError = 'Deadline cannot be in the past';
      } else {
        deadlineError = '';
      }
    } else {
      deadlineError = '';
    }
  }

  function validateLocation() {
    const location = formData.location.trim();
    if (location && location.length < 2) {
      locationError = 'Location must be at least 2 characters';
    } else {
      locationError = '';
    }
  }

  function validateField() {
    const field = formData.field.trim();
    if (field && field.length < 2) {
      fieldError = 'Field must be at least 2 characters';
    } else {
      fieldError = '';
    }
  }

  function validateLevel() {
    const level = formData.level;
    if (!level) {
      levelError = 'Level is required';
    } else {
      levelError = '';
    }
  }

  function validateType() {
    const type = formData.type;
    if (!type) {
      typeError = 'Type is required';
    } else {
      typeError = '';
    }
  }

  function validateDescription() {
    const description = formData.description.trim();
    if (!description) {
      descriptionError = 'Description is required';
    } else if (description.length < 10) {
      descriptionError = 'Description must be at least 10 characters';
    } else {
      descriptionError = '';
    }
  }

  function validateRequirements() {
    const requirements = formData.requirements.trim();
    if (requirements && requirements.length < 5) {
      requirementsError = 'Requirements must be at least 5 characters';
    } else {
      requirementsError = '';
    }
  }

  function validateWebsite() {
    const website = formData.website.trim();
    if (website) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(website)) {
        websiteError = 'Website must be a valid URL starting with http:// or https://';
      } else {
        websiteError = '';
      }
    } else {
      websiteError = '';
    }
  }

  function validateMinGpa() {
    const minGpa = formData.min_gpa;
    if (minGpa !== '' && minGpa !== null) {
      const gpa = parseFloat(minGpa);
      if (isNaN(gpa) || gpa < 0 || gpa > 4.0) {
        minGpaError = 'GPA must be between 0 and 4.0';
      } else {
        minGpaError = '';
      }
    } else {
      minGpaError = '';
    }
  }

  function validateMinIelts() {
    const minIelts = formData.min_ielts;
    if (minIelts !== '' && minIelts !== null) {
      const ielts = parseFloat(minIelts);
      if (isNaN(ielts) || ielts < 0 || ielts > 9.0) {
        minIeltsError = 'IELTS score must be between 0 and 9.0';
      } else {
        minIeltsError = '';
      }
    } else {
      minIeltsError = '';
    }
  }

  function validateMinToefl() {
    const minToefl = formData.min_toefl;
    if (minToefl !== '' && minToefl !== null) {
      const toefl = parseInt(minToefl);
      if (isNaN(toefl) || toefl < 0 || toefl > 120) {
        minToeflError = 'TOEFL score must be between 0 and 120';
      } else {
        minToeflError = '';
      }
    } else {
      minToeflError = '';
    }
  }

  function validateAgeLimit() {
    const ageLimit = formData.age_limit;
    if (ageLimit !== '' && ageLimit !== null) {
      const age = parseInt(ageLimit);
      if (isNaN(age) || age < 0 || age > 100) {
        ageLimitError = 'Age limit must be between 0 and 100';
      } else {
        ageLimitError = '';
      }
    } else {
      ageLimitError = '';
    }
  }

  function validateNationalityRestrictions() {
    const restrictions = formData.nationality_restrictions.trim();
    if (restrictions && restrictions.length < 2) {
      nationalityRestrictionsError = 'Nationality restrictions must be at least 2 characters';
    } else {
      nationalityRestrictionsError = '';
    }
  }

  function validateUniversityName() {
    const universityName = formData.university_name.trim();
    if (formData.funding_category === 'Graduate Program Funding' && !universityName) {
      universityNameError = 'University name is required for graduate program funding';
    } else if (universityName && universityName.length < 2) {
      universityNameError = 'University name must be at least 2 characters';
    } else {
      universityNameError = '';
    }
  }

  function validateProgramName() {
    const programName = formData.program_name.trim();
    if (formData.funding_category === 'Graduate Program Funding' && !programName) {
      programNameError = 'Program name is required for graduate program funding';
    } else if (programName && programName.length < 2) {
      programNameError = 'Program name must be at least 2 characters';
    } else {
      programNameError = '';
    }
  }

  function validateDepartment() {
    const department = formData.department.trim();
    if (department && department.length < 2) {
      departmentError = 'Department must be at least 2 characters';
    } else {
      departmentError = '';
    }
  }

  function validateFundingType() {
    const fundingType = formData.funding_type;
    if (formData.funding_category === 'Graduate Program Funding' && !fundingType) {
      fundingTypeError = 'Funding type is required for graduate program funding';
    } else {
      fundingTypeError = '';
    }
  }

  function validateApplicationMethod() {
    const applicationMethod = formData.application_method.trim();
    if (formData.funding_category === 'Graduate Program Funding' && !applicationMethod) {
      applicationMethodError = 'Application method is required for graduate program funding';
    } else if (applicationMethod && applicationMethod.length < 2) {
      applicationMethodError = 'Application method must be at least 2 characters';
    } else {
      applicationMethodError = '';
    }
  }

  function validateProfessorName() {
    const professorName = formData.professor_name.trim();
    if (formData.funding_category === 'Advertised Position' && !professorName) {
      professorNameError = 'Professor name is required for advertised positions';
    } else if (professorName && professorName.length < 2) {
      professorNameError = 'Professor name must be at least 2 characters';
    } else {
      professorNameError = '';
    }
  }

  function validateProfessorEmail() {
    const professorEmail = formData.professor_email.trim();
    if (formData.funding_category === 'Advertised Position' && !professorEmail) {
      professorEmailError = 'Professor email is required for advertised positions';
    } else if (professorEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(professorEmail)) {
        professorEmailError = 'Please enter a valid email address';
      } else {
        professorEmailError = '';
      }
    } else {
      professorEmailError = '';
    }
  }

  function validatePositionDetails() {
    const positionDetails = formData.position_details.trim();
    if (formData.funding_category === 'Advertised Position' && !positionDetails) {
      positionDetailsError = 'Position details are required for advertised positions';
    } else if (positionDetails && positionDetails.length < 10) {
      positionDetailsError = 'Position details must be at least 10 characters';
    } else {
      positionDetailsError = '';
    }
  }

  // Validate all fields
  function validateAllFields() {
    validateTitle();
    validateProvider();
    validateAmount();
    validateDeadline();
    validateLocation();
    validateField();
    validateLevel();
    validateType();
    validateDescription();
    validateRequirements();
    validateWebsite();
    validateMinGpa();
    validateMinIelts();
    validateMinToefl();
    validateAgeLimit();
    validateNationalityRestrictions();
    validateUniversityName();
    validateProgramName();
    validateDepartment();
    validateFundingType();
    validateApplicationMethod();
    validateProfessorName();
    validateProfessorEmail();
    validatePositionDetails();
  }

  // Check if form is valid
  function isFormValid(): boolean {
    validateAllFields();
    return !titleError && !providerError && !amountError && !deadlineError && 
           !locationError && !fieldError && !levelError && !typeError && 
           !descriptionError && !requirementsError && !websiteError && 
           !minGpaError && !minIeltsError && !minToeflError && !ageLimitError && 
           !nationalityRestrictionsError && !universityNameError && !programNameError && 
           !departmentError && !fundingTypeError && !applicationMethodError && 
           !professorNameError && !professorEmailError && !positionDetailsError;
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (isFormValid()) {
      dispatch('save', formData);
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function resetForm() {
    formData = {
      title: '',
      provider: '',
      amount: '',
      deadline: '',
      location: '',
      field: '',
      level: '',
      type: '',
      description: '',
      requirements: '',
      website: '',
      min_gpa: '',
      min_ielts: '',
      min_toefl: '',
      age_limit: '',
      nationality_restrictions: '',
      is_active: true,
      funding_category: 'Traditional Scholarship',
      university_name: '',
      program_name: '',
      department: '',
      funding_type: '',
      application_method: '',
      professor_name: '',
      professor_email: '',
      position_details: '',
      has_automatic_funding: false
    };
  }
</script>

{#if showAddForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h2 class="text-xl font-bold mb-4">
        {editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}
      </h2>
      
      <form onsubmit={handleSubmit} class="space-y-4">
        <!-- Funding Category -->
        <div>
          <label for="scholarship-funding-category" class="block text-sm font-medium mb-1">Funding Category</label>
          <select id="scholarship-funding-category" bind:value={formData.funding_category} class="w-full border rounded px-3 py-2">
            <option value="Traditional Scholarship">Traditional Scholarship</option>
            <option value="Graduate Program Funding">Graduate Program Funding</option>
            <option value="Advertised Position">Advertised Position</option>
          </select>
        </div>

        <!-- Basic Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="scholarship-title" class="block text-sm font-medium mb-1">Title *</label>
            <input 
              id="scholarship-title"
              type="text" 
              bind:value={formData.title} 
              oninput={validateTitle}
              required 
              class="w-full border rounded px-3 py-2"
            />
            {#if titleError}
              <p class="text-red-500 text-sm mt-1">{titleError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-provider" class="block text-sm font-medium mb-1">Provider *</label>
            <input 
              id="scholarship-provider"
              type="text" 
              bind:value={formData.provider} 
              oninput={validateProvider}
              required 
              class="w-full border rounded px-3 py-2"
            />
            {#if providerError}
              <p class="text-red-500 text-sm mt-1">{providerError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-amount" class="block text-sm font-medium mb-1">Amount</label>
            <input 
              id="scholarship-amount"
              type="text" 
              bind:value={formData.amount} 
              oninput={validateAmount}
              class="w-full border rounded px-3 py-2"
            />
            {#if amountError}
              <p class="text-red-500 text-sm mt-1">{amountError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-deadline" class="block text-sm font-medium mb-1">Deadline</label>
            <input 
              id="scholarship-deadline"
              type="date" 
              bind:value={formData.deadline} 
              onchange={validateDeadline}
              class="w-full border rounded px-3 py-2"
            />
            {#if deadlineError}
              <p class="text-red-500 text-sm mt-1">{deadlineError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-location" class="block text-sm font-medium mb-1">Location</label>
            <input 
              id="scholarship-location"
              type="text" 
              bind:value={formData.location} 
              oninput={validateLocation}
              class="w-full border rounded px-3 py-2"
            />
            {#if locationError}
              <p class="text-red-500 text-sm mt-1">{locationError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-field" class="block text-sm font-medium mb-1">Field</label>
            <input 
              id="scholarship-field"
              type="text" 
              bind:value={formData.field} 
              oninput={validateField}
              class="w-full border rounded px-3 py-2"
            />
            {#if fieldError}
              <p class="text-red-500 text-sm mt-1">{fieldError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-level" class="block text-sm font-medium mb-1">Level</label>
            <select 
              id="scholarship-level"
              bind:value={formData.level} 
              onchange={validateLevel}
              class="w-full border rounded px-3 py-2"
            >
              <option value="">Select Level</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Graduate">Graduate</option>
              <option value="PhD">PhD</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
            {#if levelError}
              <p class="text-red-500 text-sm mt-1">{levelError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-type" class="block text-sm font-medium mb-1">Type</label>
            <select 
              id="scholarship-type"
              bind:value={formData.type} 
              onchange={validateType}
              class="w-full border rounded px-3 py-2"
            >
              <option value="">Select Type</option>
              <option value="Merit-based">Merit-based</option>
              <option value="Need-based">Need-based</option>
              <option value="Research-based">Research-based</option>
            </select>
            {#if typeError}
              <p class="text-red-500 text-sm mt-1">{typeError}</p>
            {/if}
          </div>
        </div>

        <!-- Graduate Funding Fields (conditional) -->
        {#if formData.funding_category === 'Graduate Program Funding'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded">
            <h3 class="md:col-span-2 font-medium text-blue-900">Graduate Program Details</h3>
            <div>
              <label for="scholarship-university-name" class="block text-sm font-medium mb-1">University Name</label>
              <input 
                id="scholarship-university-name"
                type="text" 
                bind:value={formData.university_name} 
                oninput={validateUniversityName}
                class="w-full border rounded px-3 py-2"
              />
              {#if universityNameError}
                <p class="text-red-500 text-sm mt-1">{universityNameError}</p>
              {/if}
            </div>
            <div>
              <label for="scholarship-program-name" class="block text-sm font-medium mb-1">Program Name</label>
              <input 
                id="scholarship-program-name"
                type="text" 
                bind:value={formData.program_name} 
                oninput={validateProgramName}
                class="w-full border rounded px-3 py-2"
              />
              {#if programNameError}
                <p class="text-red-500 text-sm mt-1">{programNameError}</p>
              {/if}
            </div>
            <div>
              <label for="scholarship-department" class="block text-sm font-medium mb-1">Department</label>
              <input 
                id="scholarship-department"
                type="text" 
                bind:value={formData.department} 
                oninput={validateDepartment}
                class="w-full border rounded px-3 py-2"
              />
              {#if departmentError}
                <p class="text-red-500 text-sm mt-1">{departmentError}</p>
              {/if}
            </div>
            <div>
              <label for="scholarship-funding-type" class="block text-sm font-medium mb-1">Funding Type</label>
              <select 
                id="scholarship-funding-type"
                bind:value={formData.funding_type} 
                onchange={validateFundingType}
                class="w-full border rounded px-3 py-2"
              >
                <option value="">Select Type</option>
                <option value="Full Funding">Full Funding</option>
                <option value="RA">Research Assistantship</option>
                <option value="TA">Teaching Assistantship</option>
                <option value="Fellowship">Fellowship</option>
              </select>
              {#if fundingTypeError}
                <p class="text-red-500 text-sm mt-1">{fundingTypeError}</p>
              {/if}
            </div>
            <div class="md:col-span-2">
              <label for="scholarship-application-method" class="block text-sm font-medium mb-1">Application Method</label>
              <input 
                id="scholarship-application-method"
                type="text" 
                bind:value={formData.application_method} 
                oninput={validateApplicationMethod}
                class="w-full border rounded px-3 py-2"
              />
              {#if applicationMethodError}
                <p class="text-red-500 text-sm mt-1">{applicationMethodError}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Advertised Position Fields (conditional) -->
        {#if formData.funding_category === 'Advertised Position'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded">
            <h3 class="md:col-span-2 font-medium text-green-900">Position Details</h3>
            <div>
              <label for="scholarship-professor-name" class="block text-sm font-medium mb-1">Professor Name</label>
              <input 
                id="scholarship-professor-name"
                type="text" 
                bind:value={formData.professor_name} 
                oninput={validateProfessorName}
                class="w-full border rounded px-3 py-2"
              />
              {#if professorNameError}
                <p class="text-red-500 text-sm mt-1">{professorNameError}</p>
              {/if}
            </div>
            <div>
              <label for="scholarship-professor-email" class="block text-sm font-medium mb-1">Professor Email</label>
              <input 
                id="scholarship-professor-email"
                type="email" 
                bind:value={formData.professor_email} 
                oninput={validateProfessorEmail}
                class="w-full border rounded px-3 py-2"
              />
              {#if professorEmailError}
                <p class="text-red-500 text-sm mt-1">{professorEmailError}</p>
              {/if}
            </div>
            <div class="md:col-span-2">
              <label for="scholarship-position-details" class="block text-sm font-medium mb-1">Position Details</label>
              <textarea 
                id="scholarship-position-details"
                bind:value={formData.position_details} 
                oninput={validatePositionDetails}
                rows="3" 
                class="w-full border rounded px-3 py-2"
              ></textarea>
              {#if positionDetailsError}
                <p class="text-red-500 text-sm mt-1">{positionDetailsError}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Description and Requirements -->
        <div>
          <label for="scholarship-description" class="block text-sm font-medium mb-1">Description</label>
          <textarea 
            id="scholarship-description"
            bind:value={formData.description} 
            oninput={validateDescription}
            rows="4" 
            class="w-full border rounded px-3 py-2"
          ></textarea>
          {#if descriptionError}
            <p class="text-red-500 text-sm mt-1">{descriptionError}</p>
          {/if}
        </div>

        <div>
          <label for="scholarship-requirements" class="block text-sm font-medium mb-1">Requirements (one per line)</label>
          <textarea 
            id="scholarship-requirements"
            bind:value={formData.requirements} 
            oninput={validateRequirements}
            rows="4" 
            class="w-full border rounded px-3 py-2"
          ></textarea>
          {#if requirementsError}
            <p class="text-red-500 text-sm mt-1">{requirementsError}</p>
          {/if}
        </div>

        <!-- Additional Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="scholarship-website" class="block text-sm font-medium mb-1">Website</label>
            <input 
              id="scholarship-website"
              type="url" 
              bind:value={formData.website} 
              oninput={validateWebsite}
              class="w-full border rounded px-3 py-2"
            />
            {#if websiteError}
              <p class="text-red-500 text-sm mt-1">{websiteError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-nationality-restrictions" class="block text-sm font-medium mb-1">Nationality Restrictions (comma-separated)</label>
            <input 
              id="scholarship-nationality-restrictions"
              type="text" 
              bind:value={formData.nationality_restrictions} 
              oninput={validateNationalityRestrictions}
              class="w-full border rounded px-3 py-2"
            />
            {#if nationalityRestrictionsError}
              <p class="text-red-500 text-sm mt-1">{nationalityRestrictionsError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-min-gpa" class="block text-sm font-medium mb-1">Minimum GPA</label>
            <input 
              id="scholarship-min-gpa"
              type="number" 
              step="0.1" 
              bind:value={formData.min_gpa} 
              oninput={validateMinGpa}
              class="w-full border rounded px-3 py-2"
            />
            {#if minGpaError}
              <p class="text-red-500 text-sm mt-1">{minGpaError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-min-ielts" class="block text-sm font-medium mb-1">Minimum IELTS</label>
            <input 
              id="scholarship-min-ielts"
              type="number" 
              step="0.5" 
              bind:value={formData.min_ielts} 
              oninput={validateMinIelts}
              class="w-full border rounded px-3 py-2"
            />
            {#if minIeltsError}
              <p class="text-red-500 text-sm mt-1">{minIeltsError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-min-toefl" class="block text-sm font-medium mb-1">Minimum TOEFL</label>
            <input 
              id="scholarship-min-toefl"
              type="number" 
              bind:value={formData.min_toefl} 
              oninput={validateMinToefl}
              class="w-full border rounded px-3 py-2"
            />
            {#if minToeflError}
              <p class="text-red-500 text-sm mt-1">{minToeflError}</p>
            {/if}
          </div>
          <div>
            <label for="scholarship-age-limit" class="block text-sm font-medium mb-1">Age Limit</label>
            <input 
              id="scholarship-age-limit"
              type="number" 
              bind:value={formData.age_limit} 
              oninput={validateAgeLimit}
              class="w-full border rounded px-3 py-2"
            />
            {#if ageLimitError}
              <p class="text-red-500 text-sm mt-1">{ageLimitError}</p>
            {/if}
          </div>
        </div>

        <div>
          <label class="flex items-center">
            <input type="checkbox" bind:checked={formData.is_active} class="mr-2">
            Active
          </label>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <button 
            type="submit" 
            disabled={!isFormValid()}
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingScholarship ? 'Update' : 'Add'} Scholarship
          </button>
          <button type="button" onclick={handleCancel} class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
{/if} 
