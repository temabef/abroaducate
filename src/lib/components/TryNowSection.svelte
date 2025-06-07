<script lang="ts">
    function scrollToForm() {
        const formSection = document.getElementById('form-section');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
</script>

<section class="try-now-section">
    <div class="content-wrapper">
        <button class="try-now-button" on:click={scrollToForm}>
            Try Now
        </button>
        <p class="credit-info">
            Try it free with 1 credit.
        </p>
        <p class="plan-info">
            Get an unlimited monthly plan starting at $5.99.
        </p>
    </div>
</section>

<style lang="postcss">
    .try-now-section {
        background-color: #F8FAFC; /* Light gray background */
        padding: 4rem 1rem;
        text-align: center;
        margin-top: 3rem; /* Space from the section above */
        margin-bottom: 3rem; /* Space from the section below */
    }

    .content-wrapper {
        max-width: 600px;
        margin: 0 auto;
    }

    .try-now-button {
        background-color: #3699F9; /* Blue button */
        color: white;
        padding: 1rem 2.5rem;
        border-radius: 9999px; /* Fully rounded */
        font-weight: 600;
        font-size: 1.125rem;
        border: none;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    .try-now-button:hover {
        background-color: #2680E5; /* Darker blue on hover */
        transform: translateY(-2px);
    }

    .credit-info {
        font-size: 1rem;
        color: #64748B; /* Slate gray */
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
    }

    .plan-info {
        font-size: 1.125rem;
        color: #334155; /* Darker slate gray */
        font-weight: 500;
    }
</style>