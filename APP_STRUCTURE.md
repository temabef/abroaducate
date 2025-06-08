# SOP App Structure & Navigation Workflow

## 🏗 **Page Hierarchy**

```
📱 SOP Application
├── 🏠 Home Page (/)
│   ├── Hero Section
│   ├── Features Overview
│   ├── Pricing Cards (Free, Basic $4.99, Pro $29.99)
│   └── Call-to-Action
│
├── 📊 Dashboard (/dashboard)
│   ├── SOP Display & Editing
│   ├── AI Enhancement Tools
│   ├── Analytics Panel
│   └── Quick Actions
│
├── 👤 Account (/account)
│   ├── Profile Information
│   ├── Subscription Management
│   │   ├── Current Plan Display
│   │   ├── Upgrade/Downgrade Options
│   │   ├── Billing History
│   │   └── Cancel Subscription
│   ├── Usage Statistics
│   └── Logout Button
│
├── 🎯 Analytics (/analytics) [Basic+ Plans]
│   ├── Tone Analysis Results
│   ├── Readability Scores
│   ├── Word Count Optimization
│   ├── Plagiarism Check Results
│   └── Improvement Suggestions
│
└── 💳 Subscription (/subscribe)
    ├── Plan Comparison
    ├── Payment Integration (Stripe)
    ├── Success/Error Pages
    └── Confirmation
```

## 🧭 **Navigation Bar Structure**

```typescript
// Main Navigation Component
interface NavigationItem {
    label: string;
    href: string;
    requiresAuth: boolean;
    minimumPlan?: 'free' | 'basic' | 'pro';
}

const navigationItems: NavigationItem[] = [
    { label: 'Home', href: '/', requiresAuth: false },
    { label: 'Dashboard', href: '/dashboard', requiresAuth: true },
    { label: 'Analytics', href: '/analytics', requiresAuth: true, minimumPlan: 'basic' },
    { label: 'Account', href: '/account', requiresAuth: true }
];
```

## 🔄 **User Journey Workflows**

### **New User Journey**
```mermaid
graph TD
    A[Visit Home Page] --> B{Authenticated?}
    B -->|No| C[Sign Up with Google]
    B -->|Yes| D[Redirect to Dashboard]
    C --> E[Fill SOP Form]
    E --> F[Generate First SOP]
    F --> G[View Results on Dashboard]
    G --> H[See Upgrade Prompt]
    H --> I{Want Premium?}
    I -->|Yes| J[Go to Account Page]
    I -->|No| K[Continue with Free]
    J --> L[Choose Plan & Pay]
    L --> M[Enhanced Features Unlocked]
```

### **Returning User Journey**
```mermaid
graph TD
    A[Login] --> B[Dashboard]
    B --> C{Current Plan?}
    C -->|Free| D[Limited Features]
    C -->|Basic/Pro| E[Full Features]
    D --> F[Usage Limit Reached?]
    F -->|Yes| G[Upgrade Prompt]
    F -->|No| H[Continue Creating]
    G --> I[Account Page]
    E --> J[Access All Features]
```

## 📊 **Account Page Layout**

```typescript
// Account page sections
interface AccountSection {
    title: string;
    component: string;
    visibility: 'always' | 'authenticated' | 'subscribed';
}

const accountSections: AccountSection[] = [
    {
        title: 'Profile Information',
        component: 'ProfileCard',
        visibility: 'authenticated'
    },
    {
        title: 'Current Subscription',
        component: 'SubscriptionCard',
        visibility: 'authenticated'
    },
    {
        title: 'Usage Statistics',
        component: 'UsageCard',
        visibility: 'authenticated'
    },
    {
        title: 'Billing & Payment',
        component: 'BillingCard',
        visibility: 'subscribed'
    },
    {
        title: 'Account Settings',
        component: 'SettingsCard',
        visibility: 'authenticated'
    }
];
``` 