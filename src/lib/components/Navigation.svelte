<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    
    export let session: any = null;
    export let supabase: any;
    
    let showAccountMenu = false;
    let userPlan = 'free'; // Will be fetched from database
    
    // Navigation items with plan restrictions
    const navItems = [
        { label: 'Dashboard', href: '/dashboard', requiresAuth: true, icon: '📊' },
        { label: 'Analytics', href: '/analytics', requiresAuth: true, minimumPlan: 'professional', icon: '📈', badge: 'Pro+' }
    ];
    
    // Account menu items
    const accountMenuItems = [
        { label: 'Account Settings', href: '/account', icon: '⚙️' },
        { label: 'Subscription', href: '/account#subscription', icon: '💳' },
        { label: 'Usage', href: '/account#usage', icon: '📊' }
    ];
    
    onMount(async () => {
        if (session?.user) {
            // Fetch user subscription status
            userPlan = await fetchUserPlan(session.user.id);
        }
    });
    
    async function fetchUserPlan(userId: string) {
        try {
            const { data, error } = await supabase
                .from('user_subscriptions')
                .select('plan_type')
                .eq('user_id', userId)
                .in('status', ['active','trialing'])
                .single();
            
            return data?.plan_type || 'free';
        } catch (error) {
            console.error('Error fetching user plan:', error);
            return 'free';
        }
    }
    
    function hasAccess(item: any): boolean {
        if (!item.minimumPlan) return true;
        
        const planHierarchy: Record<'free' | 'professional' | 'elite', number> = {
            free: 0,
            professional: 1,
            elite: 2
        };

        const validPlans = ['free', 'professional', 'elite'] as const;
        const currentPlan = (validPlans as readonly string[]).includes(userPlan)
            ? (userPlan as 'free' | 'professional' | 'elite')
            : 'free';
        const requiredPlan = (validPlans as readonly string[]).includes(item.minimumPlan)
            ? (item.minimumPlan as 'free' | 'professional' | 'elite')
            : 'free';

        return planHierarchy[currentPlan] >= planHierarchy[requiredPlan];
    }
    
    async function handleLogout() {
        await supabase.auth.signOut();
        showAccountMenu = false;
        goto('/');
    }
    
    function toggleAccountMenu() {
        showAccountMenu = !showAccountMenu;
    }
    
    // Close account menu when clicking outside
    function handleClickOutside(event: Event) {
        const target = event.target as HTMLElement | null;
        if (!target) return;
        if (!target.closest('.account-menu-container')) {
            showAccountMenu = false;
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<nav class="navigation">
    <div class="nav-container">
        <!-- Logo -->
        <div class="nav-brand">
            <a href="/" class="brand-link">
                <img src="/logo-icon.svg" alt="Abroaducate" class="brand-icon-svg" />
                <span class="brand-text">Abroaducate</span>
            </a>
        </div>
        
        <!-- Navigation Links -->
        <div class="nav-links">
            {#if session?.user}
                {#each navItems as item}
                    {#if hasAccess(item)}
                        <a 
                            href={item.href} 
                            class="nav-link"
                            class:active={$page.url.pathname === item.href}
                        >
                            <span class="nav-icon">{item.icon}</span>
                            {item.label}
                            {#if item.badge}
                                <span class="nav-badge">{item.badge}</span>
                            {/if}
                        </a>
                    {:else}
                        <button 
                            class="nav-link disabled"
                            title="Upgrade to {item.minimumPlan} plan to access this feature"
                            on:click={() => goto('/account#subscription')}
                        >
                            <span class="nav-icon">{item.icon}</span>
                            {item.label}
                            <span class="nav-badge upgrade">Upgrade</span>
                        </button>
                    {/if}
                {/each}
            {/if}
        </div>
        
        <!-- Account Section -->
        <div class="nav-account">
            {#if session?.user}
                <div class="account-menu-container">
                    <!-- Plan Badge -->
                    <div class="plan-badge" class:free={userPlan === 'free'} class:professional={userPlan === 'professional'} class:elite={userPlan === 'elite'}>
                        {userPlan.toUpperCase()}
                    </div>
                    
                    <!-- Account Button -->
                    <button class="account-button" on:click={toggleAccountMenu}>
                        <div class="user-avatar">
                            {session.user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span class="account-chevron" class:open={showAccountMenu}>▼</span>
                    </button>
                    
                    <!-- Account Dropdown -->
                    {#if showAccountMenu}
                        <div class="account-menu">
                            <div class="account-header">
                                <div class="user-info">
                                    <div class="user-email">{session.user.email}</div>
                                    <div class="user-plan">{userPlan} Plan</div>
                                </div>
                            </div>
                            
                            <div class="menu-divider"></div>
                            
                            {#each accountMenuItems as menuItem}
                                <a href={menuItem.href} class="menu-item" on:click={() => showAccountMenu = false}>
                                    <span class="menu-icon">{menuItem.icon}</span>
                                    {menuItem.label}
                                </a>
                            {/each}
                            
                            <div class="menu-divider"></div>
                            
                            <button class="menu-item logout" on:click={handleLogout}>
                                <span class="menu-icon">🚪</span>
                                Logout
                            </button>
                        </div>
                    {/if}
                </div>
            {:else}
                <a href="/auth/login" class="login-button">
                    Sign In
                </a>
            {/if}
        </div>
    </div>
</nav>

<style>
    .navigation {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0;
        position: sticky;
        top: 0;
        z-index: 100;
        backdrop-filter: blur(10px);
    }
    
    .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 2rem;
    }
    
    .nav-brand {
        display: flex;
        align-items: center;
    }
    
    .brand-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: white;
        font-weight: 700;
        font-size: 1.2rem;
    }
    
    .brand-icon {
        font-size: 1.5rem;
    }
    
    .brand-icon-svg {
        width: 1.5rem;
        height: 1.5rem;
    }
    
    .nav-links {
        display: flex;
        gap: 2rem;
        align-items: center;
    }
    
    .nav-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
        font-weight: 500;
        border: none;
        background: none;
        cursor: pointer;
    }
    
    .nav-link:hover:not(.disabled) {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
    
    .nav-link.active {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }
    
    .nav-link.disabled {
        opacity: 0.6;
        cursor: pointer;
    }
    
    .nav-badge {
        background: #10B981;
        color: white;
        font-size: 0.7rem;
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
        font-weight: 600;
    }
    
    .nav-badge.upgrade {
        background: #F59E0B;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    .nav-account {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .account-menu-container {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .plan-badge {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.3rem 0.6rem;
        border-radius: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .plan-badge.free {
        background: rgba(107, 114, 128, 0.8);
        color: white;
    }
    
    .plan-badge.professional {
        background: rgba(16, 185, 129, 0.8);
        color: white;
    }
    
    .plan-badge.elite {
        background: rgba(147, 51, 234, 0.8);
        color: white;
    }
    
    .account-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.5rem;
        padding: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .account-button:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    .account-chevron {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8rem;
        transition: transform 0.2s ease;
    }
    
    .account-chevron.open {
        transform: rotate(180deg);
    }
    
    .account-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.5rem;
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        min-width: 200px;
        overflow: hidden;
        z-index: 110;
    }
    
    .account-header {
        padding: 1rem;
        background: #F8FAFC;
        border-bottom: 1px solid #E5E7EB;
    }
    
    .user-email {
        font-size: 0.9rem;
        font-weight: 600;
        color: #374151;
    }
    
    .user-plan {
        font-size: 0.8rem;
        color: #6B7280;
        text-transform: capitalize;
    }
    
    .menu-divider {
        height: 1px;
        background: #E5E7EB;
    }
    
    .menu-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        text-decoration: none;
        color: #374151;
        background: none;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-size: 0.9rem;
    }
    
    .menu-item:hover {
        background: #F3F4F6;
    }
    
    .menu-item.logout {
        color: #DC2626;
    }
    
    .menu-item.logout:hover {
        background: #FEF2F2;
    }
    
    .login-button {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .login-button:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    @media (max-width: 768px) {
        .nav-container {
            padding: 1rem;
        }
        
        .nav-links {
            gap: 1rem;
        }
        
        .brand-text {
            display: none;
        }
        
        .nav-link {
            padding: 0.5rem;
        }
        
        .nav-link span:not(.nav-icon) {
            display: none;
        }
    }
</style> 