<script lang="ts">
  import { onMount } from 'svelte';
  import { isUserAdmin } from '$lib/utils/adminHelper';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);

  interface PaymentData {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    customer_email: string;
    failure_reason?: string;
    retry_count: number;
  }

  let payments: PaymentData[] = $state([]);
  let isLoading = $state(true);
  let isAdmin = $state(false);
  let stats = $state({
    total_revenue: 0,
    successful_payments: 0,
    failed_payments: 0,
    conversion_rate: 0
  });

  onMount(async () => {
    if (session?.user) {
      try {
        const { data: canManage, error: permissionError } = await supabase.rpc('can_manage_scholarships');
        if (canManage) {
          isAdmin = true;
          await loadPaymentData();
        } else {
          isAdmin = false;
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        isAdmin = false;
      }
    }
  });

  async function loadPaymentData() {
    isLoading = true;
    console.log('🔄 Loading payment data...');
    
    try {
      // Get payment statistics
      const { data: paymentStats, error: statsError } = await supabase
        .from('user_subscriptions')
        .select('status, created_at, plan_type');
      
      if (statsError) {
        console.error('Error loading payment stats:', statsError);
      } else {
        // Calculate stats
        const total = paymentStats?.length || 0;
        const successful = paymentStats?.filter(p => p.status === 'active').length || 0;
        const failed = paymentStats?.filter(p => p.status === 'past_due').length || 0;
        
        stats = {
          total_revenue: successful * 12, // Rough estimate
          successful_payments: successful,
          failed_payments: failed,
          conversion_rate: total > 0 ? (successful / total) * 100 : 0
        };
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
    
    isLoading = false;
  }

  async function retryFailedPayment(subscriptionId: string) {
    try {
      const response = await fetch('/api/stripe/retry-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscriptionId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Payment retry successful!');
        await loadPaymentData();
      } else {
        alert(`Payment retry failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      alert('Failed to retry payment');
    }
  }
</script>

<svelte:head>
  <title>Payment Dashboard - Abroaducate Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Payment Dashboard</h1>
      <p class="mt-2 text-gray-600">Monitor payment status and manage failed payments</p>
    </div>

    {#if !isAdmin}
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-center">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p class="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    {:else}
      <!-- Payment Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Revenue</p>
              <p class="text-2xl font-semibold text-gray-900">${stats.total_revenue}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Successful Payments</p>
              <p class="text-2xl font-semibold text-gray-900">{stats.successful_payments}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Failed Payments</p>
              <p class="text-2xl font-semibold text-gray-900">{stats.failed_payments}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p class="text-2xl font-semibold text-gray-900">{stats.conversion_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Issues Alert -->
      {#if stats.failed_payments > 0}
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-red-800">Payment Issues Detected</h3>
              <p class="text-red-700 mt-1">
                You have {stats.failed_payments} failed payments that need attention. 
                Consider implementing payment retry logic and notifying affected customers.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="mb-8 flex flex-wrap gap-4">
        <button
          onclick={loadPaymentData}
          class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh Data
        </button>
        
        <a
          href="https://dashboard.stripe.com/payments"
          target="_blank"
          class="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition duration-200 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          View Stripe Dashboard
        </a>
      </div>

      <!-- Payment Recommendations -->
      <div class="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-blue-900 mb-4">💡 Payment Optimization Recommendations</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-4 rounded-lg border border-blue-200">
            <h4 class="font-semibold text-blue-800 mb-2">🔧 Technical Fixes</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Configure STRIPE_WEBHOOK_SECRET environment variable</li>
              <li>• Enable automatic payment retry logic</li>
              <li>• Set up payment failure notifications</li>
              <li>• Implement dunning management</li>
            </ul>
          </div>
          <div class="bg-white p-4 rounded-lg border border-blue-200">
            <h4 class="font-semibold text-blue-800 mb-2">📈 Business Improvements</h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Add multiple payment methods (PayPal, etc.)</li>
              <li>• Implement payment plans for students</li>
              <li>• Add promotional codes and discounts</li>
              <li>• Improve payment UX with better error messages</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Payment Activity
          </h3>
        </div>
        
        {#if isLoading}
          <div class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Loading payment data...</p>
          </div>
        {:else}
          <div class="p-6">
            <div class="text-center text-gray-500">
              <p>Payment data will be displayed here once webhook is properly configured.</p>
              <p class="text-sm mt-2">Check the Stripe dashboard for detailed payment information.</p>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
