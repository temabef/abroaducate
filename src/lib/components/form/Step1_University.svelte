<script lang="ts">
	import { formStore } from '$lib/stores';
    import { get } from 'svelte/store';

    const countries = [
        'United States of America', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands', 'Ireland', 'New Zealand', 'Singapore', 'Japan', '──────────',
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus',
        'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
        'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
        'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'Gabon', 'Gambia', 'Georgia', 'Ghana',
        'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
        'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Italy', 'Ivory Coast',
        'Jamaica', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
        'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
        'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
        'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
        'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Nicaragua', 'Niger', 'Nigeria',
        'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama',
        'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
        'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
        'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia',
        'Seychelles', 'Sierra Leone', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
        'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
        'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
        'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
        'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Vanuatu',
        'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
    ];

    let data = get(formStore);

    // Real-time validation state
    let universityError = '';
    let countryError = '';
    let programError = '';
    let aspirationError = '';
    let qualitiesError = '';

    // Real-time validation logic
    $: universityError = $formStore.universityData.university.trim().length < 2 ? 'University name is required (min 2 characters).' : '';
    $: countryError = !$formStore.universityData.country ? 'Country is required.' : '';
    $: programError = $formStore.universityData.program.trim().length < 2 ? 'Program is required (min 2 characters).' : '';
    $: aspirationError = (!$formStore.isBestChoiceSelected && $formStore.selectedAspirations.length === 0) ? 'Please select an aspiration option.' : ($formStore.isBestChoiceSelected && !$formStore.customAspiration.trim() ? 'Please provide your custom aspiration.' : '');
    $: qualitiesError = (!$formStore.isCustomQuality && $formStore.selectedQualities.length === 0) ? 'Please select at least one quality.' : ($formStore.isCustomQuality && !$formStore.customQualityReason.trim() ? 'Please provide a reason for your custom quality.' : '');

    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        formStore.update(s => ({
            ...s,
            universityData: {
                ...s.universityData,
                [target.name]: target.value
            }
        }));
    }

    function handleAspirationChange(aspiration: string) {
        formStore.update(s => ({
            ...s,
            selectedAspirations: [aspiration], // Only one selection
            isBestChoiceSelected: false, // Clear custom when selecting predefined
            customAspiration: ''
        }));
    }

    function handleCustomAspirationChange(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        formStore.update(s => ({ ...s, customAspiration: target.value }));
    }

    function toggleCustomAspiration() {
        formStore.update(s => ({ 
            ...s, 
            isBestChoiceSelected: !s.isBestChoiceSelected,
            selectedAspirations: !s.isBestChoiceSelected ? [] : s.selectedAspirations, // Clear predefined when selecting custom
            customAspiration: !s.isBestChoiceSelected ? s.customAspiration : ''
        }));
    }

    function handleQualityChange(quality: string) {
        formStore.update(s => {
            const qualities = s.selectedQualities;
            if (qualities.includes(quality)) {
                return { ...s, selectedQualities: qualities.filter(q => q !== quality) };
            } else {
                return { ...s, selectedQualities: [...qualities, quality] };
            }
        });
    }
</script>

<div class="step-content">
    <h2 class="text-2xl font-bold mb-4 text-gray-800">University Information</h2>
    
    <!-- Instructional Text -->
    <div class="instruction-box mb-6">
        <p class="text-gray-600 text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
            <span class="font-medium">📚 University Application Details:</span> Please provide information about the university or college you are applying to.
        </p>
    </div>

    <div class="form-group mb-6">
        <label for="university" class="form-label">
            Which university or college are you applying to? <span class="required-asterisk">*</span>
        </label>
        <input 
            type="text" 
            id="university" 
            name="university" 
            class="form-input" 
            bind:value={$formStore.universityData.university} 
            on:input={handleChange} 
            placeholder="e.g., Harvard University, MIT, Oxford University" 
            required
        >
        {#if universityError}
            <div class="input-error">{universityError}</div>
        {/if}
    </div>

    <div class="form-group mb-6">
        <label for="country" class="form-label">
            Which country is the college or university located? <span class="required-asterisk">*</span>
        </label>
        <select 
            id="country" 
            name="country" 
            class="form-input" 
            bind:value={$formStore.universityData.country} 
            on:change={handleChange} 
            required
        >
            <option value="" disabled>Select a country</option>
            {#each countries as country}
                {#if country === '──────────'}
                    <option disabled>──────────</option>
                {:else}
                    <option value={country}>{country}</option>
                {/if}
            {/each}
        </select>
        {#if countryError}
            <div class="input-error">{countryError}</div>
        {/if}
    </div>

    <div class="form-group mb-6">
        <label for="program" class="form-label">
            What programme are you applying for? <span class="required-asterisk">*</span>
        </label>
        <input 
            type="text" 
            id="program" 
            name="program" 
            class="form-input" 
            bind:value={$formStore.universityData.program} 
            on:input={handleChange} 
            placeholder="e.g., Master of Science in Computer Science, Bachelor of Arts in Psychology" 
            required
        >
        {#if programError}
            <div class="input-error">{programError}</div>
        {/if}
    </div>

    <!-- Aspirations Section -->
    <fieldset class="form-section mb-6">
        <legend class="form-legend">What are your aspirations for this program? <span class="required-asterisk">*</span></legend>
        <p class="section-description">Choose one option that best describes your main aspiration. We recommend using the custom option for the best results.</p>
        
        <!-- Custom Aspiration (Recommended) -->
        <div class="custom-aspiration-section mb-4">
            <label class="radio-label custom-recommended">
                <input 
                    type="radio" 
                    name="aspiration" 
                    value="custom"
                    checked={$formStore.isBestChoiceSelected} 
                    on:change={toggleCustomAspiration} 
                    class="mr-2"
                >
                <span class="font-medium">✨ This program is the best choice for me because... (Recommended)</span>
            </label>
            {#if $formStore.isBestChoiceSelected}
                <textarea 
                    class="form-input mt-2" 
                    bind:value={$formStore.customAspiration} 
                    placeholder="Explain why this program is the best choice for you. Be specific about your goals, the program's unique offerings, and how they align..."
                    on:input={handleCustomAspirationChange}
                    rows="3"
                ></textarea>
            {/if}
        </div>

        <!-- Predefined Options -->
        <div class="predefined-aspirations">
            <h4 class="predefined-title">Or select from these common aspirations:</h4>
            <div class="aspirations-grid">
                {#each [
                    'Obtain a leadership position in a top company',
                    'Advance my career to senior/executive level',
                    'Develop innovative solutions to real-world problems',
                    'Teach at the university level and inspire others',
                    'Contribute to impactful policies or practices',
                    'Establish a successful consulting/entrepreneurial venture',
                    'Earn a doctoral degree and become a subject expert',
                    'Publish research and present at conferences',
                    'Work for a non-profit or governmental organization',
                    'Transition to a completely new field or industry',
                    'Build a strong professional network globally',
                    'Gain expertise to solve industry challenges'
                ] as aspiration}
                    <label class="radio-label aspiration-option">
                        <input 
                            type="radio" 
                            name="aspiration"
                            value={aspiration}
                            checked={$formStore.selectedAspirations.includes(aspiration)} 
                            on:change={() => handleAspirationChange(aspiration)} 
                            class="mr-2"
                        >
                        <span>{aspiration}</span>
                    </label>
                {/each}
            </div>
        </div>
        {#if aspirationError}
            <div class="input-error">{aspirationError}</div>
        {/if}
    </fieldset>

    <!-- University Qualities Section -->
    <fieldset class="form-section">
        <legend class="form-legend">What do you look for in a university? (Select 3 main qualities) <span class="required-asterisk">*</span></legend>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            {#each ['academic-excellence', 'research-opportunities', 'diverse-community', 'industry-connections', 'innovative-programs', 'global-reputation'] as quality}
            <label class="checkbox-label">
                <input type="checkbox" checked={$formStore.selectedQualities.includes(quality)} on:change={() => handleQualityChange(quality)} class="mr-2">
                {quality.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </label>
            {/each}
        </div>
        <label class="checkbox-label mt-4">
            <input type="checkbox" bind:checked={$formStore.isCustomQuality} class="mr-2">
            Other
        </label>
        {#if $formStore.isCustomQuality}
            <textarea class="form-input mt-2" bind:value={$formStore.customQualityReason} placeholder="Please specify what else you look for in a university..."></textarea>
        {/if}
        {#if qualitiesError}
            <div class="input-error">{qualitiesError}</div>
        {/if}
    </fieldset>
</div>

<style>
    /* Step-specific styles */
    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
        font-size: 0.95rem;
    }

    .form-legend {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #1F2937;
        display: block;
    }
    
    .required-asterisk {
        color: #DC2626;
        font-weight: bold;
        margin-left: 2px;
    }
    
    .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #D1D5DB;
        border-radius: 0.375rem;
        transition: border-color 0.2s;
        font-size: 0.95rem;
        background-color: #FFFFFF;
    }
    
    .form-input:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    
    .form-input:hover {
        border-color: #9CA3AF;
    }

    .radio-label, .checkbox-label {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 0.95rem;
        color: #374151;
        padding: 0.25rem 0;
    }

    .radio-label:hover, .checkbox-label:hover {
        color: #1F2937;
    }

    
    /* Remove any potential underlines */
    .form-input::after, 
    .form-input::before {
        display: none;
    }
    
    .instruction-box {
        margin-bottom: 1.5rem;
    }
    
    .instruction-box p {
        line-height: 1.4;
    }
    
    /* Form group spacing */
    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        border: 1px solid #E5E7EB;
        border-radius: 0.5rem;
        background-color: #F9FAFB;
    }
    
    /* Ensure consistent spacing */
    .step-content {
        padding: 0.5rem 0;
    }
    
    /* Placeholder styling */
    .form-input::placeholder {
        color: #9CA3AF;
        font-style: italic;
    }

    /* Radio and checkbox styling */
    input[type="radio"], input[type="checkbox"] {
        margin-right: 0.5rem;
        accent-color: #3B82F6;
    }

    /* Aspirations section styling */
    .section-description {
        color: #6B7280;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        font-style: italic;
    }

    .custom-aspiration-section {
        background-color: #F0F9FF;
        border: 2px solid #DBEAFE;
        border-radius: 0.5rem;
        padding: 1rem;
    }

    .custom-recommended {
        color: #1E40AF;
        font-weight: 500;
    }

    .custom-recommended span {
        color: #1E40AF;
    }

    .predefined-aspirations {
        margin-top: 1rem;
    }

    .predefined-title {
        color: #374151;
        font-size: 0.95rem;
        font-weight: 500;
        margin-bottom: 0.75rem;
    }

    .aspirations-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    @media (min-width: 768px) {
        .aspirations-grid {
            grid-template-columns: 1fr 1fr;
        }
    }

    .aspiration-option {
        background-color: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: 0.375rem;
        padding: 0.75rem;
        transition: all 0.2s;
    }

    .aspiration-option:hover {
        background-color: #F9FAFB;
        border-color: #D1D5DB;
    }

    .aspiration-option span {
        font-size: 0.9rem;
        line-height: 1.3;
    }

    .input-error {
        color: #DC2626;
        font-size: 0.85rem;
        margin-top: 0.25rem;
    }
</style> 