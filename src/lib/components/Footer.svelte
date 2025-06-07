<script lang="ts">
    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
</script>

<footer class="footer-section">
    <div class="footer-container">
        <div class="footer-column footer-brand-column">
            <a href="/" class="footer-logo">
                AbroaducateSOPGPT
            </a>
            <p class="brand-description">
                Empowering students worldwide to create compelling Statements of Purpose using advanced AI technology.
            </p>
            <div class="social-icons">
                <a href="#" class="social-icon" aria-label="Facebook"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
                <a href="#" class="social-icon" aria-label="Twitter"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c11 3 21-10 21-12.5a4.49 4.49 0 0 0 .5-2.2z"></path></svg></a>
                <a href="#" class="social-icon" aria-label="LinkedIn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
                <a href="#" class="social-icon" aria-label="GitHub"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 3c0 0-1.04-.35-3.47 1.36A12.6 12.6 0 0 0 12 2.15c-2.32 0-4.65.65-6.64 1.48C2.68 2.65 1.64 3 1.64 3c-.15 3.14 2.68 6.09 5.25 6.46-.09.2-.17.4-.17.61v.75c0 1.25-.66 2.51-1.67 3.37A9.97 9.97 0 0 1 10 18.52c0 1 .3 2 1 3h2.64M12 6.5C12 5 12 4 12 3"/></svg></a>
            </div>
        </div>

        <div class="footer-column">
            <h3 class="column-title">Tools</h3>
            <ul class="link-list">
                <li><a href="#" class="footer-link">GPA Converter</a></li>
                <li><a href="#" class="footer-link">SOP Samples</a></li>
            </ul>
        </div>

        <div class="footer-column">
            <h3 class="column-title">Resources</h3>
            <ul class="link-list">
                <li><a href="https://abroaducate.com/blog" target="_blank" rel="noopener noreferrer" class="footer-link">Blog</a></li>
            </ul>
        </div>

        <div class="footer-column">
            <h3 class="column-title">Contact Us</h3>
            <ul class="link-list contact-details">
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    info@abroaducate.com
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    24/7 Support Available
                </li>
                <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    Global Presence
                </li>
            </ul>
        </div>
    </div>

    <div class="footer-bottom">
        <p class="copyright">&copy; {new Date().getFullYear()} Abroaducate SOP. Generator. All rights reserved.</p>
        <a href="#" class="back-to-top" on:click|preventDefault={scrollToTop}>
            Back to Top <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </a>
    </div>
</footer>

<style lang="postcss">
    .footer-section {
        background-color: #0F172A; /* Dark background from image */
        color: #CBD5E1; /* Light text color */
        padding: 4rem 1rem;
        font-family: 'Inter', sans-serif;
    }

    .footer-container {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 2fr repeat(3, 1fr); /* Adjust column widths */
        gap: 2rem;
        padding-bottom: 2.5rem;
        border-bottom: 1px solid #334155;
    }

    .footer-column {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .footer-brand-column {
        /* Specific styling for the brand column if needed */
    }

    .footer-logo {
        font-size: 1.875rem; /* Larger font size for brand name */
        font-weight: 700;
        color: #F8FAFC;
        text-decoration: none;
        margin-bottom: 1rem;
        transition: color 0.2s ease;
    }

    .footer-logo:hover {
        color: #63B3ED;
    }

    .brand-description {
        font-size: 0.9rem;
        color: #94A3B8;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }

    .social-icons {
        display: flex;
        gap: 1rem;
    }

    .social-icon {
        color: #94A3B8;
        transition: color 0.2s ease;
    }

    .social-icon:hover {
        color: #E2E8F0;
    }

    .social-icon svg {
        width: 20px;
        height: 20px;
    }

    .column-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #F8FAFC;
        margin-bottom: 1.25rem;
    }

    .link-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .link-list li {
        margin-bottom: 0.75rem;
    }

    .footer-link {
        color: #CBD5E1;
        text-decoration: none;
        font-size: 0.95rem;
        transition: color 0.2s ease;
    }

    .footer-link:hover {
        color: #63B3ED;
    }

    .contact-details li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: #CBD5E1;
        font-size: 0.95rem;
        line-height: 1.5;
    }

    .contact-details li svg {
        color: #63B3ED; /* Icon color from image */
        flex-shrink: 0;
    }

    .footer-bottom {
        max-width: 1200px;
        margin: 2rem auto 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .copyright {
        font-size: 0.85rem;
        color: #94A3B8;
    }

    .back-to-top {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #94A3B8;
        text-decoration: none;
        font-size: 0.85rem;
        transition: color 0.2s ease;
    }

    .back-to-top:hover {
        color: #E2E8F0;
    }

    .back-to-top svg {
        width: 16px;
        height: 16px;
    }

    @media (max-width: 1024px) {
        .footer-container {
            grid-template-columns: 1.5fr repeat(3, 1fr);
        }
    }

    @media (max-width: 768px) {
        .footer-container {
            grid-template-columns: 1fr 1fr; /* 2 columns on tablet */
            justify-items: start;
        }

        .footer-brand-column {
            grid-column: span 2; /* Brand spans full width */
            align-items: center;
            text-align: center;
        }

        .social-icons {
            justify-content: center;
        }

        .footer-column {
            align-items: center;
            text-align: center;
        }

        .contact-details li {
            justify-content: center;
            text-align: left; /* Keep text aligned for readability */
        }
    }

    @media (max-width: 480px) {
        .footer-container {
            grid-template-columns: 1fr; /* Single column on mobile */
        }

        .footer-brand-column {
            grid-column: span 1;
        }

        .footer-column {
            width: 100%;
            align-items: center;
        }
    }
</style> 