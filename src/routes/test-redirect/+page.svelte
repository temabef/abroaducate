<script lang="ts">
    import { goto } from '$app/navigation';
    
    function testRedirect() {
        console.log('Testing redirect to submit-sop');
        goto('/submit-sop');
    }
</script>

<div style="padding: 2rem; text-align: center;">
    <h1>Test Redirect</h1>
    <p>This page tests if navigation works properly.</p>
    <button on:click={testRedirect} style="padding: 1rem 2rem; background: blue; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Test Redirect to Submit SOP
    </button>
    <br><br>
    <a href="/submit-sop" style="color: blue; text-decoration: underline;">Direct link to Submit SOP</a>
</div> 