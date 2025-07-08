/**
 * 🧪 Abroaducate User Testing Script
 * Run this in your browser console to test different user scenarios
 */

class UserTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  // Test navigation and public pages for anonymous users
  async testAnonymousUser() {
    console.log('🔍 Testing Anonymous User Access...');
    
    const publicPages = [
      '/',
      '/gpa-converter', 
      '/universities/database',
      '/pricing',
      '/test-prep'
    ];
    
    const restrictedPages = [
      '/dashboard',
      '/sop',
      '/cover-letters',
      '/personal-statements',
      '/academic-cv',
      '/ai-features-demo',
      '/analytics'
    ];
    
    // Test public pages should load
    for (const page of publicPages) {
      await this.testPageAccess(page, true, `Anonymous user should access ${page}`);
    }
    
    // Test restricted pages should redirect/prompt
    for (const page of restrictedPages) {
      await this.testPageAccess(page, false, `Anonymous user should be restricted from ${page}`);
    }
    
    this.logResults('Anonymous User Tests');
  }

  // Test free user limitations
  async testFreeUser() {
    console.log('🆓 Testing Free User Limitations...');
    
    // Check if user is logged in and free
    const userPlan = await this.getCurrentUserPlan();
    if (userPlan !== 'free') {
      console.warn('⚠️ Not logged in as free user. Switch to free account first.');
      return;
    }
    
    // Test usage limits
    await this.testUsageLimits('free', {
      sops: 1,
      aiImprovements: 3,
      plagiarismChecks: 1
    });
    
    // Test upgrade prompts
    await this.testUpgradePrompts([
      '/cover-letters',
      '/personal-statements', 
      '/academic-cv',
      '/analytics'
    ]);
    
    this.logResults('Free User Tests');
  }

  // Test professional user features
  async testProfessionalUser() {
    console.log('⭐ Testing Professional User Features...');
    
    const userPlan = await this.getCurrentUserPlan();
    if (userPlan !== 'professional') {
      console.warn('⚠️ Not logged in as professional user. Switch accounts first.');
      return;
    }
    
    // Test enhanced limits
    await this.testUsageLimits('professional', {
      sops: 10,
      aiImprovements: 50,
      plagiarismChecks: 10,
      inlineEdits: 50
    });
    
    // Test premium features access
    const premiumPages = [
      '/analytics',
      '/advanced-ai',
      '/priority-support'
    ];
    
    for (const page of premiumPages) {
      await this.testPageAccess(page, true, `Professional user should access ${page}`);
    }
    
    this.logResults('Professional User Tests');
  }

  // Test elite user unlimited access
  async testEliteUser() {
    console.log('👑 Testing Elite User Unlimited Access...');
    
    const userPlan = await this.getCurrentUserPlan();
    if (userPlan !== 'elite') {
      console.warn('⚠️ Not logged in as elite user. Switch accounts first.');
      return;
    }
    
    // Test unlimited access
    await this.testUnlimitedAccess();
    
    // Test elite-exclusive features
    const eliteFeatures = [
      'custom-templates',
      'white-label-branding',
      'priority-ai-processing',
      'advanced-analytics'
    ];
    
    for (const feature of eliteFeatures) {
      await this.testFeatureAvailability(feature, true);
    }
    
    this.logResults('Elite User Tests');
  }

  // Helper method to test page access
  async testPageAccess(url, shouldHaveAccess, description) {
    try {
      const response = await fetch(url);
      const isAccessible = response.ok && !response.redirected;
      
      const result = {
        test: description,
        expected: shouldHaveAccess,
        actual: isAccessible,
        passed: shouldHaveAccess === isAccessible,
        url: url,
        status: response.status
      };
      
      this.testResults.push(result);
      console.log(result.passed ? '✅' : '❌', result.test);
      
    } catch (error) {
      console.error('❌ Error testing page access:', error);
      this.testResults.push({
        test: description,
        passed: false,
        error: error.message
      });
    }
  }

  // Helper to get current user plan
  async getCurrentUserPlan() {
    try {
      const response = await fetch('/api/get-user-profile');
      const data = await response.json();
      return data.subscription?.plan_type || 'free';
    } catch (error) {
      console.error('Error getting user plan:', error);
      return null;
    }
  }

  // Test usage limits for specific plan
  async testUsageLimits(planType, limits) {
    console.log(`📊 Testing ${planType} plan usage limits:`, limits);
    
    for (const [feature, limit] of Object.entries(limits)) {
      await this.testFeatureLimit(feature, limit);
    }
  }

  // Test a specific feature limit
  async testFeatureLimit(feature, limit) {
    try {
      const response = await fetch('/api/check-usage-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, requestedAmount: 1 })
      });
      
      const data = await response.json();
      const withinLimit = data.allowed;
      const currentUsage = data.currentUsage || 0;
      
      console.log(`📈 ${feature}: ${currentUsage}/${limit} used`);
      
      this.testResults.push({
        test: `${feature} usage limit check`,
        expected: currentUsage <= limit,
        actual: withinLimit,
        passed: (currentUsage <= limit) === withinLimit,
        details: `${currentUsage}/${limit}`
      });
      
    } catch (error) {
      console.error(`❌ Error testing ${feature} limits:`, error);
    }
  }

  // Test upgrade prompts on restricted pages
  async testUpgradePrompts(pages) {
    console.log('💰 Testing upgrade prompts...');
    
    for (const page of pages) {
      // This would need to be adapted based on your actual upgrade prompt implementation
      const hasUpgradePrompt = document.querySelector('.upgrade-modal, .upgrade-prompt, [data-upgrade]');
      console.log(`${hasUpgradePrompt ? '✅' : '❌'} Upgrade prompt on ${page}`);
    }
  }

  // Test unlimited access for elite users
  async testUnlimitedAccess() {
    console.log('♾️ Testing unlimited access...');
    
    const unlimitedFeatures = [
      'sops_created',
      'ai_improvements_used', 
      'inline_edits_used',
      'plagiarism_checks'
    ];
    
    for (const feature of unlimitedFeatures) {
      const response = await fetch('/api/check-usage-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, requestedAmount: 999 })
      });
      
      const data = await response.json();
      const isUnlimited = data.allowed === true;
      
      this.testResults.push({
        test: `${feature} unlimited access`,
        passed: isUnlimited,
        details: data.limit === null ? 'Unlimited' : `Limited to ${data.limit}`
      });
      
      console.log(isUnlimited ? '✅' : '❌', `${feature} unlimited access`);
    }
  }

  // Test feature availability
  async testFeatureAvailability(feature, shouldBeAvailable) {
    const featureElement = document.querySelector(`[data-feature="${feature}"], .${feature}`);
    const isAvailable = featureElement && !featureElement.hasAttribute('disabled');
    
    this.testResults.push({
      test: `${feature} availability`,
      expected: shouldBeAvailable,
      actual: isAvailable,
      passed: shouldBeAvailable === isAvailable
    });
    
    console.log(shouldBeAvailable === isAvailable ? '✅' : '❌', `${feature} availability`);
  }

  // Log test results summary
  logResults(testSuite) {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`\n📊 ${testSuite} Results: ${passed}/${total} passed`);
    
    const failed = this.testResults.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log('❌ Failed tests:');
      failed.forEach(test => console.log(`  - ${test.test}`));
    }
    
    // Clear results for next test suite
    this.testResults = [];
  }

  // Run mobile responsiveness tests
  testMobileResponsiveness() {
    console.log('📱 Testing mobile responsiveness...');
    
    const breakpoints = [
      { name: 'Mobile', width: 375 },
      { name: 'Tablet', width: 768 },
      { name: 'Desktop', width: 1024 },
      { name: 'Large Desktop', width: 1440 }
    ];
    
    breakpoints.forEach(bp => {
      // Simulate viewport resize
      if (window.innerWidth !== bp.width) {
        console.log(`📏 Test at ${bp.name} width (${bp.width}px) - manually resize browser`);
      }
      
      // Check for mobile-specific elements
      const mobileMenu = document.querySelector('.mobile-menu, [data-mobile-menu]');
      const desktopNav = document.querySelector('.desktop-nav, [data-desktop-nav]');
      
      if (bp.width < 768 && !mobileMenu) {
        console.log('❌ Mobile menu not found at mobile breakpoint');
      }
      
      if (bp.width >= 1024 && !desktopNav) {
        console.log('❌ Desktop navigation not found at desktop breakpoint');
      }
    });
  }

  // Test performance
  async testPerformance() {
    console.log('⚡ Testing performance...');
    
    const startTime = performance.now();
    
    try {
      const response = await fetch('/');
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`🏠 Home page load time: ${loadTime.toFixed(2)}ms`);
      
      if (loadTime > 3000) {
        console.log('❌ Home page loads slowly (>3s)');
      } else {
        console.log('✅ Home page loads quickly (<3s)');
      }
      
    } catch (error) {
      console.error('❌ Performance test failed:', error);
    }
  }

  // Run all tests for current user
  async runAllTests() {
    console.log('🚀 Running comprehensive user tests...');
    
    const userPlan = await this.getCurrentUserPlan();
    console.log(`👤 Current user plan: ${userPlan || 'Not logged in'}`);
    
    if (!userPlan) {
      await this.testAnonymousUser();
    } else {
      switch (userPlan) {
        case 'free':
          await this.testFreeUser();
          break;
        case 'professional':
          await this.testProfessionalUser();
          break;
        case 'elite':
          await this.testEliteUser();
          break;
        default:
          console.log('❓ Unknown user plan:', userPlan);
      }
    }
    
    this.testMobileResponsiveness();
    await this.testPerformance();
    
    console.log('🎉 All tests completed!');
  }
}

// Create global tester instance
window.userTester = new UserTester();

// Usage instructions
console.log(`
🧪 Abroaducate User Testing Script Loaded!

Usage:
  userTester.runAllTests()              - Run all tests for current user
  userTester.testAnonymousUser()        - Test anonymous user access
  userTester.testFreeUser()            - Test free user limitations  
  userTester.testProfessionalUser()    - Test professional features
  userTester.testEliteUser()           - Test elite unlimited access
  userTester.testMobileResponsiveness() - Test responsive design
  userTester.testPerformance()         - Test page load times

To test all user types:
1. Log out: userTester.testAnonymousUser()
2. Create/login as free user: userTester.testFreeUser()
3. Upgrade to professional: userTester.testProfessionalUser()  
4. Upgrade to elite: userTester.testEliteUser()
`);

// Auto-run tests for current user
userTester.runAllTests(); 