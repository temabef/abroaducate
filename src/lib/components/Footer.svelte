<script lang="ts">
    import { Facebook, Twitter, Linkedin, Instagram } from 'svelte-simples';

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
                <a href="https://www.facebook.com/temabef" class="social-icon" aria-label="Facebook"><Facebook size={20} color="#F8FAFC"/></a>
                <a href="https://twitter.com/temabef" class="social-icon" aria-label="Twitter"><Twitter size={20} color="#F8FAFC"/></a>
                <a href="https://www.linkedin.com/in/saheedkolawole/" class="social-icon" aria-label="LinkedIn"><Linkedin size={20} color="#F8FAFC"/></a>
                <a href="https://www.instagram.com/temabef" class="social-icon" aria-label="Instagram"><Instagram size={20} color="#F8FAFC"/></a>
            </div>
        </div>

        <div class="footer-column">
            <h3 class="column-title">Tools</h3>
            <ul class="link-list">
                <li><a href="/gpa-converter" class="footer-link">GPA Converter</a></li>
                <li><a href="/sop-samples" class="footer-link">SOP Samples</a></li>
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
        <button class="back-to-top" on:click={scrollToTop}>
            Back to Top <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
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
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        background-color: #64748B; /* Medium gray background for icon shape */
        border-radius: 50%; /* Circular shape */
        transition: background-color 0.2s ease, transform 0.2s ease;
    }

    .social-icon:hover {
        background-color: #E2E8F0; /* Lighter hover effect for background */
        transform: translateY(-2px);
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
        background: none;
        border: none;
        cursor: pointer;
        transition: color 0.2s ease;
    }

    .back-to-top:hover {
        color: #E2E8F0;
    }

    @media (max-width: 768px) {
        .footer-container {
            grid-template-columns: 1fr;
            text-align: center;
        }

        .footer-column {
            align-items: center;
        }

        .social-icons {
            justify-content: center;
        }

        .contact-details li {
            justify-content: center;
        }

        .footer-bottom {
            flex-direction: column;
            text-align: center;
        }
    }
</style> 