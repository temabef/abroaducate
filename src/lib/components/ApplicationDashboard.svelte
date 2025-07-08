<script lang="ts">
    import { goto } from '$app/navigation';
    import { tick } from 'svelte';
    import ConfirmModal from './ConfirmModal.svelte';

    interface JobApplication {
        id: string;
        title: string;
        company: string;
        applied: boolean;
        location: string;
        description: string;
        coverLetters: string[];
        expanded: boolean;
    }

    let jobApplications: JobApplication[] = [
        {
            id: '1',
            title: 'Software Engineer',
            company: 'Google',
            applied: true,
            location: 'Mountain View, CA',
            description: 'Developing cutting-edge search algorithms.',
            coverLetters: ['SOP for Google'],
            expanded: false
        },
        {
            id: '2',
            title: 'Product Manager',
            company: 'Microsoft',
            applied: false,
            location: 'Redmond, WA',
            description: 'Defining product strategy for new initiatives.',
            coverLetters: ['SOP for Microsoft'],
            expanded: false
        }
    ];

    let showDeleteModal = false;
    let jobToDelete: JobApplication | null = null;

    function toggleExpand(id: string) {
        jobApplications = jobApplications.map(job =>
            job.id === id ? { ...job, expanded: !job.expanded } : job
        );
    }

    function createNewJob() {
        goto('/'); // Navigate back to the main form page
    }

    function displayCoverLetters(jobId: string) {
        console.log(`Displaying cover letters for job ${jobId}`);
        // Future: Implement modal or new page to show cover letters
    }

    function createAdditionalCoverLetter(jobId: string) {
        console.log(`Creating additional cover letter for job ${jobId}`);
        // Future: Navigate back to form with pre-filled data or a special mode
    }

    function deleteJob(id: string) {
        const job = jobApplications.find(j => j.id === id);
        if (job) {
            jobToDelete = job;
            showDeleteModal = true;
        }
    }

    function confirmDelete() {
        if (jobToDelete) {
            jobApplications = jobApplications.filter(job => job.id !== jobToDelete?.id);
            jobToDelete = null;
        }
    }

    function cancelDelete() {
        jobToDelete = null;
    }
</script>

<div class="your-jobs-section">
    <h2 class="section-title">Your Jobs</h2>

    {#each jobApplications as job}
        <div class="job-card">
            <button class="job-header" on:click={() => toggleExpand(job.id)} aria-expanded={job.expanded} aria-controls="job-details-{job.id}">
                <span class="job-title">{job.title} @ {job.company}</span>
                <div class="applied-status">
                    Applied <input type="checkbox" bind:checked={job.applied} on:click|stopPropagation />
                    <span class="expand-toggle">{#if job.expanded}▲{:else}▼{/if}</span>
                </div>
            </button>

            {#if job.expanded}
                <div class="job-details">
                    <p><strong>Location:</strong> {job.location}</p>
                    <p><strong>Description:</strong> <button class="display-button" on:click={() => console.log(job.description)}>Display</button></p>
                    <div class="job-actions">
                        <button class="action-button" on:click={() => displayCoverLetters(job.id)}>Display Cover Letters</button>
                        <button class="action-button" on:click={() => createAdditionalCoverLetter(job.id)}>Create Additional Cover Letter</button>
                        <button class="delete-button" on:click={() => deleteJob(job.id)}>Delete</button>
                    </div>
                </div>
            {/if}
        </div>
    {/each}

    <button class="create-new-job-button" on:click={createNewJob}>
        Create New Job
    </button>
</div>

<!-- Delete Confirmation Modal -->
<ConfirmModal
  bind:show={showDeleteModal}
  title="Delete Job Application"
  message="Are you sure you want to delete the application for '{jobToDelete?.title}' at {jobToDelete?.company}? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  icon="danger"
  confirmClass="bg-red-600 hover:bg-red-700"
  on:confirm={confirmDelete}
  on:cancel={cancelDelete}
/>

<style lang="postcss">
    .your-jobs-section {
        background-color: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 1rem;
        padding: 2rem;
        max-width: 800px;
        margin: 2rem auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        font-family: 'Inter', sans-serif;
    }

    .section-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1E293B;
        text-align: center;
        margin-bottom: 2rem;
    }

    .job-card {
        border: 1px solid #CBD5E1;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        overflow: hidden;
        background-color: #F8FAFC;
        transition: all 0.2s ease-in-out;
    }

    .job-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .job-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background-color: #E2E8F0;
        cursor: pointer;
        border-bottom: 1px solid #CBD5E1;
    }

    .job-card:not(.job-card:last-child) .job-header {
        border-bottom: 1px solid #CBD5E1;
    }

    .job-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1E293B;
    }

    .applied-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #475569;
    }

    .applied-status input[type="checkbox"] {
        width: 1.125rem;
        height: 1.125rem;
        accent-color: #6D28D9; /* Purple checkbox */
    }

    .expand-toggle {
        font-size: 1.2rem;
        margin-left: 0.5rem;
        color: #6D28D9;
    }

    .job-details {
        padding: 1rem 1.5rem;
        background-color: #FFFFFF;
        border-top: 1px solid #E2E8F0;
    }

    .job-details p {
        margin-bottom: 0.75rem;
        font-size: 0.95rem;
        color: #475569;
    }

    .job-details p:last-child {
        margin-bottom: 0;
    }

    .display-button {
        background: none;
        border: none;
        color: #6D28D9;
        text-decoration: underline;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 500;
        padding: 0;
        margin-left: 0.5rem;
    }

    .job-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1rem;
    }

    .action-button,
    .delete-button {
        background-color: #8B5CF6;
        color: white;
        border: none;
        padding: 0.6rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }

    .action-button:hover {
        background-color: #7C3AED;
    }

    .delete-button {
        background-color: #EF4444;
    }

    .delete-button:hover {
        background-color: #DC2626;
    }

    .create-new-job-button {
        display: block;
        width: 100%;
        padding: 1rem;
        background-color: #2196F3;
        color: white;
        border: none;
        border-radius: 0.75rem;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        margin-top: 2rem;
        transition: background-color 0.2s ease;
    }

    .create-new-job-button:hover {
        background-color: #1976D2;
    }

    @media (max-width: 600px) {
        .your-jobs-section {
            padding: 1rem;
            margin: 1rem auto;
        }

        .job-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .job-title {
            font-size: 1rem;
        }

        .applied-status {
            width: 100%;
            justify-content: space-between;
        }

        .job-details {
            padding: 1rem;
        }

        .job-actions {
            flex-direction: column;
        }

        .action-button,
        .delete-button {
            width: 100%;
        }
    }
</style> 