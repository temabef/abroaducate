<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  // State variables
  let hasData = false;
  let academicProfile: any = null;
  let analysis: any = null;
  let loading = true;
  let dataSource = '';
  let activeTab = 'overview';

  // UI state
  let showAnalysis = false;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'strengths', label: 'Strengths', icon: '💪' },
    { id: 'areas', label: 'Growth Areas', icon: '📈' },
    { id: 'trends', label: 'Trends', icon: '📉' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' },
    { id: 'competitiveness', label: 'Competitiveness', icon: '🎯' }
  ];

  onMount(() => {
    loadAcademicData();
  });

  async function loadAcademicData() {
    loading = true;
    
    try {
      // Check for stored GPA converter data
      const gpaData = localStorage.getItem('gpaConverterData');
      if (gpaData) {
        const data = JSON.parse(gpaData);
        if (data.courses && data.courses.length > 0) {
          hasData = true;
          dataSource = 'stored';
          academicProfile = extractProfileFromStoredData(data);
          
          // Import and run analysis
          const module = await import('$lib/academicAnalyzer/analysisEngine.js');
          analysis = module.analyzeAcademicProfile(academicProfile);
          showAnalysis = true;
        }
      }
      
      if (!hasData) {
        // No data available
        dataSource = 'none';
      }
    } catch (error) {
      console.error('Error loading academic data:', error);
    }
    
    loading = false;
  }

  function extractProfileFromStoredData(data: any) {
    const courses = data.courses || [];
    const totalCredits = courses.reduce((sum: number, course: any) => sum + course.credits, 0);
    const totalPoints = courses.reduce((sum: number, course: any) => sum + course.usGPA * course.credits, 0);
    const calculatedGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

    // Group courses by year
    const academicYears = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Postgraduate'];
    const coursesByYear: Record<string, any> = {};
    academicYears.forEach(year => {
      const yearCourses = courses.filter((c: any) => c.year === year);
      if (yearCourses.length > 0) {
        const yearCredits = yearCourses.reduce((sum: number, course: any) => sum + course.credits, 0);
        const yearPoints = yearCourses.reduce((sum: number, course: any) => sum + course.usGPA * course.credits, 0);
        coursesByYear[year] = {
          courses: yearCourses,
          gpa: yearCredits > 0 ? (yearPoints / yearCredits).toFixed(2) : '0.00',
          totalCredits: yearCredits,
          courseCount: yearCourses.length
        };
      }
    });

    // Categorize by subject
    const coursesBySubject = categorizeBySubject(courses);

    // Analyze grade distribution
    const gradeDistribution = analyzeGradeDistribution(courses);

    return {
      hasData: true,
      totalGPA: calculatedGPA,
      totalCourses: courses.length,
      studentInfo: {
        studentName: data.studentName || '',
        universityName: data.universityName || '',
        programOfStudy: data.programOfStudy || ''
      },
      coursesByYear: coursesByYear,
      coursesBySubject: coursesBySubject,
      gradeDistribution: gradeDistribution,
      creditHours: {
        total: totalCredits,
        average: courses.length > 0 ? parseFloat((totalCredits / courses.length).toFixed(1)) : 0,
        courseCount: courses.length
      },
      gradingSystem: {
        country: data.selectedCountry,
        system: data.selectedGradingSystem
      },
      extractedAt: new Date().toISOString()
    };
  }

  function categorizeBySubject(courses: any[]) {
    const subjectCategories: Record<string, string[]> = {
      'Science': ['chemistry', 'biology', 'physics', 'anatomy', 'physiology', 'biochemistry', 'microbiology'],
      'Mathematics': ['mathematics', 'math', 'calculus', 'statistics', 'algebra', 'geometry'],
      'Engineering': ['engineering', 'mechanical', 'electrical', 'civil', 'chemical', 'computer'],
      'Business': ['business', 'management', 'economics', 'finance', 'accounting', 'marketing'],
      'Liberal Arts': ['english', 'literature', 'history', 'philosophy', 'art', 'music'],
      'Social Sciences': ['psychology', 'sociology', 'political', 'anthropology', 'geography'],
      'Language': ['language', 'foreign', 'spanish', 'french', 'german', 'chinese'],
      'Other': []
    };

    const categorizedCourses: Record<string, any[]> = {};
    
    // Initialize categories
    Object.keys(subjectCategories).forEach(category => {
      categorizedCourses[category] = [];
    });

    courses.forEach(course => {
      const courseName = (course.name || '').toLowerCase();
      const courseCode = (course.code || '').toLowerCase();
      
      let categorized = false;
      
      // Try to categorize based on course name and code
      for (const [category, keywords] of Object.entries(subjectCategories)) {
        if (category === 'Other') continue;
        
        const isMatch = keywords.some(keyword => 
          courseName.includes(keyword) || courseCode.includes(keyword)
        );
        
        if (isMatch) {
          categorizedCourses[category].push(course);
          categorized = true;
          break;
        }
      }
      
      // If not categorized, put in 'Other'
      if (!categorized) {
        categorizedCourses['Other'].push(course);
      }
    });

    // Calculate GPA for each subject area
    const result: Record<string, any> = {};
    Object.keys(categorizedCourses).forEach(category => {
      const courses = categorizedCourses[category];
      if (courses.length > 0) {
        const totalCredits = courses.reduce((sum: number, course: any) => sum + (course.credits || 0), 0);
        const totalGradePoints = courses.reduce((sum: number, course: any) => sum + ((course.usGPA || 0) * (course.credits || 0)), 0);
        
        result[category] = {
          courses: courses,
          gpa: totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00',
          totalCredits: totalCredits,
          courseCount: courses.length
        };
      } else {
        result[category] = {
          courses: [],
          gpa: '0.00',
          totalCredits: 0,
          courseCount: 0
        };
      }
    });

    return result;
  }

  function analyzeGradeDistribution(courses: any[]) {
    const gradeCount: Record<string, number> = {};
    const gpaRanges: Record<string, number> = {
      'A Range (3.7-4.0)': 0,
      'B Range (2.7-3.6)': 0,
      'C Range (1.7-2.6)': 0,
      'D Range (0.7-1.6)': 0,
      'F Range (0.0-0.6)': 0
    };

    courses.forEach(course => {
      const grade = course.grade;
      const gpa = course.usGPA || 0;
      
      // Count individual grades
      gradeCount[grade] = (gradeCount[grade] || 0) + 1;
      
      // Count GPA ranges
      if (gpa >= 3.7) gpaRanges['A Range (3.7-4.0)']++;
      else if (gpa >= 2.7) gpaRanges['B Range (2.7-3.6)']++;
      else if (gpa >= 1.7) gpaRanges['C Range (1.7-2.6)']++;
      else if (gpa >= 0.7) gpaRanges['D Range (0.7-1.6)']++;
      else gpaRanges['F Range (0.0-0.6)']++;
    });

    return {
      byGrade: gradeCount,
      byGPARange: gpaRanges,
      totalCourses: courses.length
    };
  }

  function switchTab(tabId: string) {
    activeTab = tabId;
  }

  function getGPAColor(gpa: number): string {
    if (gpa >= 3.7) return 'text-green-600';
    if (gpa >= 3.3) return 'text-blue-600';
    if (gpa >= 3.0) return 'text-yellow-600';
    if (gpa >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  }

  function getGPABgColor(gpa: number): string {
    if (gpa >= 3.7) return 'bg-green-100 border-green-200';
    if (gpa >= 3.3) return 'bg-blue-100 border-blue-200';
    if (gpa >= 3.0) return 'bg-yellow-100 border-yellow-200';
    if (gpa >= 2.5) return 'bg-orange-100 border-orange-200';
    return 'bg-red-100 border-red-200';
  }

  function formatPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  function refreshAnalysis() {
    loadAcademicData();
  }

  function goToGPAConverter() {
    goto('/gpa-converter');
  }
</script>

<svelte:head>
  <title>Academic Profile Analyzer | Abroaducate</title>
  <meta name="description" content="Analyze your academic strengths, weaknesses, and competitiveness for studying abroad. Get personalized recommendations based on your GPA and course performance." />
  <meta name="keywords" content="academic analysis, GPA analyzer, study abroad, academic strengths, university admissions, academic profile" />
</svelte:head>

<div class="max-w-7xl mx-auto p-6">
  <!-- Header -->
  <div class="text-center mb-8">
    <div class="mb-4">
      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        Free Academic Analysis Tool
      </span>
    </div>
    <h1 class="text-4xl font-bold text-gray-900 mb-4">
      🎓 Academic Profile Analyzer
    </h1>
    <p class="text-xl text-gray-600 max-w-3xl mx-auto">
      Get comprehensive insights into your academic performance, identify strengths and growth areas, 
      and receive personalized recommendations for your study abroad journey.
    </p>
    <div class="mt-6 flex justify-center">
      <div class="flex items-center space-x-6 text-sm text-gray-500">
        <div class="flex items-center space-x-1">
          <span>📊</span>
          <span>Detailed Analysis</span>
        </div>
        <div class="flex items-center space-x-1">
          <span>💡</span>
          <span>Actionable Insights</span>
        </div>
        <div class="flex items-center space-x-1">
          <span>🎯</span>
          <span>University Matching</span>
        </div>
      </div>
    </div>
  </div>

  {#if loading}
    <!-- Loading State -->
    <div class="flex justify-center items-center min-h-64">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Analyzing your academic profile...</p>
      </div>
    </div>
  {:else if !hasData}
    <!-- Quick Academic Assessment Form -->
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Introduction -->
      <div class="text-center">
        <div class="mb-4">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ⚡ Quick Assessment - FREE
          </span>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          Quick Academic Profile Assessment
        </h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Get instant insights into your study abroad competitiveness in just 3 minutes. No transcript upload required!
        </p>
        <div class="mt-6 flex justify-center">
          <div class="flex items-center space-x-6 text-sm text-gray-500">
            <div class="flex items-center space-x-1">
              <span>⚡</span>
              <span>3-minute setup</span>
            </div>
            <div class="flex items-center space-x-1">
              <span>🎯</span>
              <span>Instant results</span>
            </div>
            <div class="flex items-center space-x-1">
              <span>🆓</span>
              <span>Completely free</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Assessment Form -->
      <div class="bg-white rounded-xl shadow-lg border p-8 space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Basic Academic Info -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">📋 Basic Information</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your full name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Current University/College</label>
              <input 
                type="text" 
                placeholder="e.g., University of Ghana"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select your field...</option>
                <option value="computer_science">Computer Science</option>
                <option value="engineering">Engineering</option>
                <option value="business">Business Administration</option>
                <option value="medicine">Medicine</option>
                <option value="law">Law</option>
                <option value="economics">Economics</option>
                <option value="psychology">Psychology</option>
                <option value="biology">Biology</option>
                <option value="chemistry">Chemistry</option>
                <option value="physics">Physics</option>
                <option value="mathematics">Mathematics</option>
                <option value="literature">Literature</option>
                <option value="history">History</option>
                <option value="political_science">Political Science</option>
                <option value="sociology">Sociology</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Academic Year Level</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select year level...</option>
                <option value="year1">1st Year</option>
                <option value="year2">2nd Year</option>
                <option value="year3">3rd Year</option>
                <option value="year4">4th Year</option>
                <option value="year5">5th Year</option>
                <option value="final">Final Year</option>
                <option value="graduate">Graduate/Recent Graduate</option>
              </select>
            </div>
          </div>

          <!-- Academic Performance -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">📊 Academic Performance</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Current GPA/Grade</label>
              <div class="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="e.g., 3.85"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="4.0">4.0 Scale</option>
                  <option value="5.0">5.0 Scale</option>
                  <option value="percentage">Percentage</option>
                  <option value="letter">Letter Grade</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Academic Strengths (Select up to 3)</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span class="text-sm">Mathematics & Quantitative Skills</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span class="text-sm">Research & Analytical Thinking</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span class="text-sm">Communication & Writing</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span class="text-sm">Leadership & Teamwork</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span class="text-sm">Technical/Laboratory Skills</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span class="text-sm">Languages & Cultural Competency</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Areas for Improvement</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select area to improve...</option>
                <option value="gpa">Overall GPA</option>
                <option value="research">Research Experience</option>
                <option value="extracurricular">Extracurricular Activities</option>
                <option value="language">English Proficiency</option>
                <option value="test_scores">Standardized Test Scores</option>
                <option value="work_experience">Work Experience</option>
                <option value="none">No significant areas</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Study Abroad Goals -->
        <div class="border-t pt-6 space-y-6">
          <h3 class="text-lg font-semibold text-gray-900">🎯 Study Abroad Goals</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Target Degree Level</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select degree level...</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="phd">PhD/Doctorate</option>
                <option value="certificate">Certificate Program</option>
                <option value="exchange">Exchange Program</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Priority Countries (Select up to 3)</label>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span>🇺🇸 United States</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span>🇨🇦 Canada</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span>🇬🇧 United Kingdom</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span>🇦🇺 Australia</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span>🇩🇪 Germany</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="rounded text-blue-600 mr-2">
                  <span>🇳🇱 Netherlands</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Scholarship Interest Level</label>
            <div class="flex space-x-4">
              <label class="flex items-center">
                <input type="radio" name="scholarship_interest" class="mr-2">
                <span class="text-sm">💰 Must have full funding</span>
              </label>
              <label class="flex items-center">
                <input type="radio" name="scholarship_interest" class="mr-2">
                <span class="text-sm">📊 Partial funding preferred</span>
              </label>
              <label class="flex items-center">
                <input type="radio" name="scholarship_interest" class="mr-2">
                <span class="text-sm">💳 Can self-fund</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="border-t pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <button class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            🎯 Generate My Profile Assessment
          </button>
          <button 
            on:click={goToGPAConverter}
            class="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            📊 Or Upload Full Transcript
          </button>
        </div>
      </div>

      <!-- Feature Comparison -->
      <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
        <h3 class="text-xl font-bold text-gray-900 text-center mb-6">Choose Your Analysis Level</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Quick Assessment -->
          <div class="bg-white rounded-lg p-6 border">
            <div class="text-center mb-4">
              <div class="text-2xl mb-2">⚡</div>
              <h4 class="font-bold text-gray-900">Quick Assessment</h4>
              <div class="text-green-600 font-medium">FREE</div>
            </div>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Competitiveness analysis</li>
              <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>University tier recommendations</li>
              <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>General improvement areas</li>
              <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Scholarship readiness score</li>
              <li class="flex items-center"><span class="text-green-500 mr-2">✓</span>Country-specific insights</li>
            </ul>
          </div>

          <!-- Comprehensive Analysis -->
          <div class="bg-white rounded-lg p-6 border border-purple-200">
            <div class="text-center mb-4">
              <div class="text-2xl mb-2">🔬</div>
              <h4 class="font-bold text-gray-900">Comprehensive Analysis</h4>
              <div class="text-purple-600 font-medium">PREMIUM</div>
            </div>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-center"><span class="text-purple-500 mr-2">✓</span>Full transcript analysis</li>
              <li class="flex items-center"><span class="text-purple-500 mr-2">✓</span>Subject-specific insights</li>
              <li class="flex items-center"><span class="text-purple-500 mr-2">✓</span>Grade trend analysis</li>
              <li class="flex items-center"><span class="text-purple-500 mr-2">✓</span>Advanced recommendations</li>
              <li class="flex items-center"><span class="text-purple-500 mr-2">✓</span>Course-level feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  {:else if analysis && analysis.hasAnalysis}
    <!-- Main Analysis Interface -->
    <div class="space-y-6">
      <!-- Data Source Indicator -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center space-x-2">
          <div class="text-green-600">✅</div>
          <div class="text-sm text-green-800">
            Analysis based on {dataSource === 'stored' ? 'your saved GPA data' : 'live session data'} 
            | Last updated: {new Date(academicProfile.extractedAt).toLocaleString()}
          </div>
          <button
            on:click={refreshAnalysis}
            class="ml-auto text-green-600 hover:text-green-800 text-sm font-medium"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Quick Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold {getGPAColor(academicProfile.totalGPA)} mb-2">
            {academicProfile.totalGPA.toFixed(2)}
          </div>
          <div class="text-gray-600 text-sm">Overall GPA</div>
          <div class="text-xs text-gray-500 mt-1">{analysis.overall.gpaCategory}</div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-gray-900 mb-2">
            {academicProfile.totalCourses}
          </div>
          <div class="text-gray-600 text-sm">Total Courses</div>
          <div class="text-xs text-gray-500 mt-1">{academicProfile.creditHours.total} Credits</div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-gray-900 mb-2">
            {analysis.strengths.length}
          </div>
          <div class="text-gray-600 text-sm">Key Strengths</div>
          <div class="text-xs text-green-600 mt-1">Identified</div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-gray-900 mb-2">
            {analysis.competitiveness.percentile}th
          </div>
          <div class="text-gray-600 text-sm">Percentile</div>
          <div class="text-xs text-blue-600 mt-1">{analysis.competitiveness.level}</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {#each tabs as tab}
              <button
                on:click={() => switchTab(tab.id)}
                class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }"
              >
                <span class="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            {/each}
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          {#if activeTab === 'overview'}
            <!-- Overview Tab -->
            <div class="space-y-6">
              <!-- Student Information -->
              {#if academicProfile.studentInfo.studentName}
                <div class="bg-gray-50 rounded-lg p-4">
                  <h3 class="font-semibold text-gray-900 mb-2">📋 Academic Profile</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span class="font-medium text-gray-700">Student:</span>
                      <span class="text-gray-600 ml-2">{academicProfile.studentInfo.studentName}</span>
                    </div>
                    {#if academicProfile.studentInfo.universityName}
                      <div>
                        <span class="font-medium text-gray-700">University:</span>
                        <span class="text-gray-600 ml-2">{academicProfile.studentInfo.universityName}</span>
                      </div>
                    {/if}
                    {#if academicProfile.studentInfo.programOfStudy}
                      <div>
                        <span class="font-medium text-gray-700">Program:</span>
                        <span class="text-gray-600 ml-2">{academicProfile.studentInfo.programOfStudy}</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- Performance Overview -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Overall Performance -->
                <div class="bg-white border rounded-lg p-6">
                  <h3 class="font-semibold text-gray-900 mb-4">🎯 Overall Performance</h3>
                  <div class="{getGPABgColor(academicProfile.totalGPA)} rounded-lg p-4 mb-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-2xl font-bold {getGPAColor(academicProfile.totalGPA)}">
                          {academicProfile.totalGPA.toFixed(2)} GPA
                        </div>
                        <div class="text-sm text-gray-600">{analysis.overall.gpaDescription}</div>
                      </div>
                      <div class="text-3xl">
                        {#if academicProfile.totalGPA >= 3.7}🏆
                        {:else if academicProfile.totalGPA >= 3.3}⭐
                        {:else if academicProfile.totalGPA >= 3.0}👍
                        {:else}📈{/if}
                      </div>
                    </div>
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Credit Load:</span>
                      <span class="font-medium">{analysis.overall.creditLoadAssessment}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Total Credits:</span>
                      <span class="font-medium">{academicProfile.creditHours.total}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Avg Credits/Course:</span>
                      <span class="font-medium">{academicProfile.creditHours.average}</span>
                    </div>
                  </div>
                </div>

                <!-- Grade Distribution -->
                <div class="bg-white border rounded-lg p-6">
                  <h3 class="font-semibold text-gray-900 mb-4">📊 Grade Distribution</h3>
                  <div class="space-y-3">
                    {#each Object.entries(academicProfile.gradeDistribution.byGPARange) as [range, count]}
                      {@const percentage = formatPercentage(count, academicProfile.totalCourses)}
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">{range}</span>
                        <div class="flex items-center space-x-2">
                          <div class="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              class="h-2 rounded-full {
                                range.includes('A') ? 'bg-green-500' :
                                range.includes('B') ? 'bg-blue-500' :
                                range.includes('C') ? 'bg-yellow-500' :
                                range.includes('D') ? 'bg-orange-500' : 'bg-red-500'
                              }" 
                              style="width: {percentage}%"
                            ></div>
                          </div>
                          <span class="text-sm font-medium w-12 text-right">{percentage}%</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Subject Performance -->
              <div class="bg-white border rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 mb-4">📚 Subject Area Performance</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each Object.entries(academicProfile.coursesBySubject) as [subject, data]}
                    {#if data.courseCount > 0}
                      <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="font-medium text-gray-900 text-sm">{subject}</h4>
                          <span class="text-xs text-gray-500">{data.courseCount} courses</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-lg font-bold {getGPAColor(parseFloat(data.gpa))}">{data.gpa}</span>
                          <span class="text-xs text-gray-500">{data.totalCredits} credits</span>
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>

          {:else if activeTab === 'strengths'}
            <!-- Strengths Tab -->
            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">💪 Your Academic Strengths</h3>
              {#if analysis.strengths.length > 0}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {#each analysis.strengths as strength}
                    <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div class="flex items-start space-x-3">
                        <div class="text-2xl">{strength.icon}</div>
                        <div class="flex-1">
                          <h4 class="font-semibold text-green-900 mb-1">{strength.title}</h4>
                          <p class="text-green-700 text-sm mb-2">{strength.description}</p>
                          <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {strength.category}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                              strength.impact === 'high' ? 'bg-red-100 text-red-800' :
                              strength.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }">
                              {strength.impact} impact
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">🌱</div>
                  <p class="text-gray-600">Keep working hard! Strengths will be identified as your academic profile develops.</p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'areas'}
            <!-- Growth Areas Tab -->
            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">📈 Areas for Growth</h3>
              {#if analysis.weaknesses.length > 0}
                <div class="space-y-4">
                  {#each analysis.weaknesses as weakness}
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <div class="flex items-start space-x-3">
                        <div class="text-2xl">{weakness.icon}</div>
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-orange-900">{weakness.title}</h4>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                              weakness.severity === 'high' ? 'bg-red-100 text-red-800' :
                              weakness.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }">
                              {weakness.severity} priority
                            </span>
                          </div>
                          <p class="text-orange-700 text-sm mb-2">{weakness.description}</p>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {weakness.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">🎉</div>
                  <p class="text-gray-600">Great job! No significant areas for improvement identified.</p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'trends'}
            <!-- Trends Tab -->
            <div class="space-y-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">📉 Academic Trends</h3>
              {#if analysis.trends.hasEnoughData}
                <div class="bg-white border rounded-lg p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h4 class="font-semibold text-gray-900">GPA Trend Analysis</h4>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {
                      analysis.trends.trendDirection === 'improving' ? 'bg-green-100 text-green-800' :
                      analysis.trends.trendDirection === 'declining' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }">
                      {analysis.trends.trendDirection === 'improving' ? '📈 Improving' :
                       analysis.trends.trendDirection === 'declining' ? '📉 Declining' :
                       '➡️ Stable'}
                    </span>
                  </div>
                  <p class="text-gray-600 mb-4">{analysis.trends.trendDescription}</p>
                  
                  <!-- Yearly GPA Chart -->
                  <div class="space-y-3">
                    {#each analysis.trends.gpaTrend as yearData}
                      <div class="flex items-center space-x-4">
                        <div class="w-20 text-sm font-medium text-gray-700">{yearData.year}</div>
                        <div class="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            class="h-6 rounded-full {getGPAColor(yearData.gpa).replace('text-', 'bg-').replace('-600', '-500')} flex items-center justify-center text-white text-sm font-medium"
                            style="width: {(yearData.gpa / 4.0) * 100}%"
                          >
                            {yearData.gpa.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                  
                  <div class="mt-4 text-sm text-gray-600">
                    <strong>Change:</strong> {analysis.trends.gpaChange > 0 ? '+' : ''}{analysis.trends.gpaChange} points over {analysis.trends.yearsAnalyzed} years
                  </div>
                </div>
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">📊</div>
                  <p class="text-gray-600">{analysis.trends.message}</p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'recommendations'}
            <!-- Recommendations Tab -->
            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">💡 Personalized Recommendations</h3>
              {#if analysis.recommendations.length > 0}
                <div class="space-y-6">
                  {#each analysis.recommendations as rec}
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div class="flex items-start space-x-3">
                        <div class="text-2xl">💡</div>
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-blue-900">{rec.title}</h4>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }">
                              {rec.priority} priority
                            </span>
                          </div>
                          <p class="text-blue-700 text-sm mb-3">{rec.description}</p>
                          <div class="space-y-2">
                            <h5 class="font-medium text-blue-900 text-sm">Action Steps:</h5>
                            <ul class="space-y-1">
                              {#each rec.actionItems as action}
                                <li class="flex items-start space-x-2 text-sm text-blue-700">
                                  <span class="text-blue-500 mt-1">•</span>
                                  <span>{action}</span>
                                </li>
                              {/each}
                            </ul>
                          </div>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-3">
                            {rec.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">🎯</div>
                  <p class="text-gray-600">Excellent! Your academic profile shows strong performance across all areas.</p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'competitiveness'}
            <!-- Competitiveness Tab -->
            <div class="space-y-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">🎯 Admissions Competitiveness</h3>
              
              <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
                <div class="text-center mb-6">
                  <h4 class="text-2xl font-bold text-gray-900 mb-2">{analysis.competitiveness.level}</h4>
                  <p class="text-gray-600">{analysis.competitiveness.description}</p>
                  <div class="mt-4 flex items-center justify-center space-x-4">
                    <div class="text-center">
                      <div class="text-3xl font-bold text-blue-600">{analysis.competitiveness.gpaScore.toFixed(2)}</div>
                      <div class="text-sm text-gray-600">Your GPA</div>
                    </div>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-green-600">{analysis.competitiveness.percentile}th</div>
                      <div class="text-sm text-gray-600">Percentile</div>
                    </div>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-white rounded-lg p-4">
                    <h5 class="font-semibold text-gray-900 mb-2">🎓 Opportunities</h5>
                    <ul class="space-y-2">
                      {#each analysis.competitiveness.opportunities as opportunity}
                        <li class="flex items-start space-x-2 text-sm">
                          <span class="text-green-500 mt-1">✓</span>
                          <span class="text-gray-700">{opportunity}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                  
                  {#if analysis.insights.length > 0}
                    <div class="bg-white rounded-lg p-4 md:col-span-2">
                      <h5 class="font-semibold text-gray-900 mb-2">🔍 Key Insights</h5>
                      <div class="space-y-2">
                        {#each analysis.insights as insight}
                          <div class="flex items-start space-x-2">
                            <span class="text-blue-500 mt-1">
                              {#if insight.type === 'strength'}💪
                              {:else if insight.type === 'achievement'}🏆
                              {:else}💡{/if}
                            </span>
                            <div>
                              <div class="font-medium text-gray-900 text-sm">{insight.title}</div>
                              <div class="text-gray-600 text-sm">{insight.description}</div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
              
              {#if analysis.riskFactors.length > 0}
                <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h4 class="font-semibold text-red-900 mb-4">⚠️ Risk Factors to Address</h4>
                  <div class="space-y-3">
                    {#each analysis.riskFactors as risk}
                      <div class="flex items-start space-x-3">
                        <span class="text-red-500 mt-1">⚠️</span>
                        <div>
                          <div class="font-medium text-red-900">{risk.type}</div>
                          <div class="text-red-700 text-sm">{risk.description}</div>
                        </div>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                          risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                          risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }">
                          {risk.severity}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            on:click={refreshAnalysis}
            class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh Analysis
          </button>
          <button
            on:click={goToGPAConverter}
            class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Update Transcript
          </button>
          <a 
            href="/universities" 
            class="inline-flex items-center justify-center px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            Find Matching Universities
          </a>
        </div>
      </div>
    </div>

    <!-- Success Stats Section -->
    <div class="mt-16 bg-gray-100 rounded-lg p-8">
      <div class="text-center mb-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Trusted Academic Analysis for African Students</h3>
        <p class="text-gray-600">Empowering students with data-driven insights for study abroad success</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div class="text-3xl font-bold text-blue-600">50+</div>
          <div class="text-sm text-gray-600">Academic Systems</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-green-600">1,200+</div>
          <div class="text-sm text-gray-600">Profiles Analyzed</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-purple-600">100%</div>
          <div class="text-sm text-gray-600">FREE Analysis</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-yellow-600">7,000+</div>
          <div class="text-sm text-gray-600">Universities Tracked</div>
        </div>
      </div>
    </div>

    <!-- Call to Action Section -->
    <div class="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-center text-white">
      <h3 class="text-2xl font-bold mb-4">Ready to Take the Next Step in Your Study Abroad Journey?</h3>
      <p class="text-purple-100 mb-6">
        Now that you understand your academic profile, use our comprehensive suite of tools to find the perfect universities and secure funding for your dreams.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/universities" class="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
          🏛️ Find Matching Universities
        </a>
        <a href="/scholarships" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-purple-600 transition duration-200">
          💰 Discover Scholarships
        </a>
        <a href="/sop" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-purple-600 transition duration-200">
          📝 Generate Statement of Purpose
        </a>
        <a href="/gpa-converter" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-purple-600 transition duration-200">
          📊 Update Your GPA Data
        </a>
      </div>
    </div>
  {:else}
    <!-- Error State -->
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div class="text-4xl mb-4">❌</div>
      <h2 class="text-xl font-bold text-red-900 mb-2">Analysis Error</h2>
      <p class="text-red-700 mb-4">There was an issue analyzing your academic profile.</p>
      <button
        on:click={refreshAnalysis}
        class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  {/if}
</div>

 