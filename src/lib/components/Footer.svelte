<script lang="ts">
    import Fa from 'svelte-fa';
    import {
        faTwitter,
        faFacebook,
        faInstagram,
        faLinkedin
    } from '@fortawesome/free-brands-svg-icons';
    import {
        faEnvelope,
        faPhone,
        faLocationDot
    } from '@fortawesome/free-solid-svg-icons';

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
                <a href="https://twitter.com/placeholder" target="_blank" rel="noopener noreferrer">
                    <Fa icon={faTwitter} class="w-6 h-6" />
                </a>
                <a href="https://facebook.com/placeholder" target="_blank" rel="noopener noreferrer">
                    <Fa icon={faFacebook} class="w-6 h-6" />
                </a>
                <a href="https://instagram.com/placeholder" target="_blank" rel="noopener noreferrer">
                    <Fa icon={faInstagram} class="w-6 h-6" />
                </a>
                <a href="https://linkedin.com/placeholder" target="_blank" rel="noopener noreferrer">
                    <Fa icon={faLinkedin} class="w-6 h-6" />
                </a>
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
                <li><a href="/blog" class="footer-link">Blog</a></li>
            </ul>
        </div>

        <div class="footer-column">
            <h3 class="column-title">Contact Us</h3>
            <ul class="link-list contact-details">
                <li class="flex items-center space-x-2">
                    <Fa icon={faEnvelope} class="w-5 h-5" />
                    <span>contact@soptutorials.com</span>
                </li>
                <li class="flex items-center space-x-2">
                    <Fa icon={faPhone} class="w-5 h-5" />
                    <span>+1 (555) 123-4567</span>
                </li>
                <li class="flex items-center space-x-2">
                    <Fa icon={faLocationDot} class="w-5 h-5" />
                    <span>123 Main St, Anytown, USA</span>
                </li>
            </ul>
        </div>
    </div>

    <div class="footer-bottom">
        <p class="copyright">&copy; {new Date().getFullYear()} Abroaducate SOP. Generator. All rights reserved.</p>
        <button class="back-to-top" on:click={scrollToTop}>
            Back to Top
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