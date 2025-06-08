<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    let { supabase, session } = data;
    let invoices: any[] = [];
    let loading = true;
    
    onMount(async () => {
        if (!session?.user) {
            goto('/auth/login');
            return;
        }
        
        await loadBillingHistory();
    });
    
    async function loadBillingHistory() {
        try {
            const response = await fetch('/api/stripe/billing-history');
            
            if (response.ok) {
                const data = await response.json();
                invoices = data.invoices || [];
            }
        } catch (error) {
            console.error('Error loading billing history:', error);
        } finally {
            loading = false;
        }
    }
    
    function formatDate(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    function formatAmount(amount: number): string {
        return (amount / 100).toFixed(2);
    }
    
    function getStatusColor(status: string): string {
        switch (status) {
            case 'paid': return 'text-green-600 bg-green-100';
            case 'open': return 'text-yellow-600 bg-yellow-100';
            case 'void': return 'text-gray-600 bg-gray-100';
            case 'uncollectible': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    }
    
    function downloadInvoice(invoiceUrl: string) {
        window.open(invoiceUrl, '_blank');
    }
</script>

<svelte:head>
    <title>Billing History - SOP Generator</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6 pt-24">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Billing History</h1>
        <p class="text-gray-600">View and download your past invoices and payment history</p>
    </div>
    
    {#if loading}
        <div class="bg-white rounded-lg shadow-sm p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading billing history...</p>
        </div>
    {:else if invoices.length === 0}
        <div class="bg-white rounded-lg shadow-sm p-8 text-center">
            <div class="text-gray-400 mb-4">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No billing history</h3>
            <p class="text-gray-600 mb-4">You don't have any invoices yet</p>
            <a href="/subscribe" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Subscribe to a Plan
            </a>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Invoices</h2>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {#each invoices as invoice}
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">
                                        #{invoice.number || invoice.id.slice(-8)}
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        {invoice.description || 'Subscription payment'}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(invoice.created)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${formatAmount(invoice.amount_paid)} {invoice.currency.toUpperCase()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(invoice.status)}">
                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {#if invoice.invoice_pdf}
                                        <button 
                                            onclick={() => downloadInvoice(invoice.invoice_pdf)}
                                            class="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Download PDF
                                        </button>
                                    {/if}
                                    {#if invoice.hosted_invoice_url}
                                        <button 
                                            onclick={() => downloadInvoice(invoice.hosted_invoice_url)}
                                            class="text-blue-600 hover:text-blue-900"
                                        >
                                            View Online
                                        </button>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Summary Card -->
        <div class="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-900">
                        {invoices.length}
                    </div>
                    <div class="text-sm text-gray-600">Total Invoices</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">
                        ${invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_paid, 0) / 100}
                    </div>
                    <div class="text-sm text-gray-600">Total Paid</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">
                        {invoices.filter(i => i.status === 'paid').length}
                    </div>
                    <div class="text-sm text-gray-600">Paid Invoices</div>
                </div>
            </div>
        </div>
    {/if}
</div> 