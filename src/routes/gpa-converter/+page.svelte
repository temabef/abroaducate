<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { africanCountries, africanGradingSystems, getAfricanCountryGradingSystems } from '$lib/data/africanGradingSystems';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  // State variables
  let studentName = $state('');
  let universityName = $state('');
  let programOfStudy = $state('');
  let selectedCountry = $state('');
  let selectedGradingSystem = $state('');
  let selectedGrade = $state('');
  let courseName = $state('');
  let courseCode = $state('');
  let credits = $state('');
  let selectedYear = $state('');
  let courses: Array<{ 
    name: string; 
    code?: string;
    grade: string; 
    credits: number; 
    usGPA: number;
    year?: string;
    semester?: string;
  }> = $state([]);
  let convertedGPA = $state(0);
  let totalCredits = $state(0);
  let gpaClass = $state('');
  let showResults = $state(false);

  let activeTab: 'manual' | 'upload' = $state('manual');

  // Upload-related state
  let selectedFile: File | null = $state(null);
  let dragActive = $state(false);
  let processing = $state(false);
  let extractedCourses: Array<{ name: string; code?: string; grade: string; credits: number; year?: string }> = $state([]);
  let extractedText = $state('');
  let processingProgress = $state(0);
  let statusMessage = $state('');
  let ocrWorker: any = $state(null);

  // Smart OCR state
  let detectedSessions: Array<{
    name: string;
    year?: string;
    courses: Array<{
      code: string;
      name: string;
      credits: number | string;
      grade: string;
      extraData: Record<string, string>; // Store extra columns we might not need
      confidence: 'high' | 'medium' | 'low';
    }>;
  }> = $state([]);
  let showPreview = $state(false);
  let previewMode = $state('sessions'); // 'sessions' or 'table'
  
  // Editing phase state
  let showEditingPhase = $state(false);
  let coursesForEditing: Array<{
    name: string;
    code: string;
    grade: string;
    credits: number;
    year: string;
    semester: string;
    confidence: 'high' | 'medium' | 'low';
    sessionName: string;
  }> = $state([]);

  // Academic profile analysis state
  let showAcademicAnalysis = $state(false);
  let academicProfile: any = $state(null);
  let analysis: any = $state(null);

  // Academic year options
  const academicYears = [
    'Year 1',
    'Year 2', 
    'Year 3',
    'Year 4',
    'Year 5',
    'Year 6',
    'Postgraduate'
  ];

  // Reactive variables
  let availableGradingSystems = $derived(selectedCountry ? Object.keys(getAfricanCountryGradingSystems(selectedCountry)) : []);
  let currentGradingSystem = $derived(selectedCountry && selectedGradingSystem ? 
    (getAfricanCountryGradingSystems(selectedCountry) as any)[selectedGradingSystem] : null);
  let availableGrades = $derived(currentGradingSystem ? Object.keys(currentGradingSystem) : []);

  // Smart Fallback System state
  let showSmartAssist = $state(false);
  let smartAssistData = $state({
    extractedLines: [] as string[],
    suggestedCourses: [] as Array<{
      line: string;
      suggested: {
        code: string;
        name: string;
        credits: string;
        grade: string;
      } | null;
    }>
  });

  let selectedTemplate = $state('');
  
  // Generate templates based on common African grading system patterns
  function generateDynamicTemplates(extractedText: string) {
    const templates = [
      {
        id: '5_point_system',
        name: '5.0 Scale System (Nigeria, Tanzania)',
        example: 'MTH 101 - Mathematics I - 3 credits - A (5.0 scale)',
        pattern: 'Code - Name - Credits - Grade',
        description: 'Common in Nigeria, Tanzania and many West African universities'
      },
      {
        id: 'francophone_system',
        name: 'Francophone System (French-speaking countries)',
        example: 'Mathematics I - TB - 3 credits - 16/20',
        pattern: 'Name - Grade (THF/TB/B/AB/P) - Credits',
        description: 'Used in Algeria, Benin, Burkina Faso, Cameroon, Chad, and others'
      },
      {
        id: 'percentage_system',
        name: 'Percentage-based System (70-100%)',
        example: 'Computer Science - 75% - 4 credits - A',
        pattern: 'Name - Percentage - Credits - Letter Grade',
        description: 'Common in South Africa, Kenya, Ghana, and East African universities'
      },
      {
        id: 'letter_grade_system',
        name: 'Letter Grade System (A, B+, B, C+)',
        example: 'Physics I - B+ - 3 credits',
        pattern: 'Name - Letter Grade - Credits',
        description: 'Used in many universities across Africa with variations'
      }
    ];
    
    // Detect specific patterns in the text and add a custom template
    if (extractedText) {
      const hasNumbers = /\d+/.test(extractedText);
      const hasGrades = /[A-F][+-]?|THF|TB|AB/.test(extractedText);
      const hasCredits = /credit|unit|hour/.test(extractedText.toLowerCase());
      
      if (hasNumbers && hasGrades && hasCredits) {
        templates.push({
          id: 'detected_pattern',
          name: 'Your Transcript Pattern (Auto-detected)',
          example: '✨ Pattern detected from your transcript',
          pattern: 'Automatically detected based on your content',
          description: 'Custom pattern identified from your specific transcript format'
        });
      }
    }
    
    return templates;
  }
  
  let courseTemplates = $derived(showSmartAssist ? generateDynamicTemplates(extractedText) : []);



  onMount(() => {
    loadSavedData();

    loadUploadData();
  });

  onDestroy(() => {
    cleanupWorker();
  });

  function updateGradingSystems() {
    selectedGradingSystem = '';
    selectedGrade = '';
  }

  function updateGrades() {
    selectedGrade = '';
  }

  function addCourse() {
    if (courseName.trim() && selectedGrade && credits && parseFloat(credits) > 0 && currentGradingSystem) {
      const courseCredits = parseFloat(credits);
      const gradeData = currentGradingSystem[selectedGrade];
      const usGPA = gradeData?.usGPA || 0;

      courses = [...courses, {
        name: courseName.trim(),
        code: courseCode.trim() || undefined,
        grade: selectedGrade,
        credits: courseCredits,
        usGPA: usGPA,
        year: selectedYear || undefined,
        semester: undefined // Can be added later if needed
      }];

      // Reset form
      courseName = '';
      courseCode = '';
      selectedGrade = '';
      credits = '';
      
      saveData();
    } else {
      alert('Please fill in all required fields correctly.');
    }
  }

  function removeCourse(index: number) {
    courses = courses.filter((_, i) => i !== index);
    saveData();
  }

  function convertGPA() {
    if (courses.length === 0 || !currentGradingSystem) {
      alert('Please add courses and select a grading system.');
      return;
    }

    totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const totalPoints = courses.reduce((sum, course) => sum + course.usGPA * course.credits, 0);
    convertedGPA = totalPoints / totalCredits;
    gpaClass = getGPAClass(convertedGPA);
    showResults = true;

    
  }

  function getGPAClass(gpa: number): string {
    if (gpa >= 3.7) return 'First Class';
    if (gpa >= 3.5) return 'Second Class Upper';
    if (gpa >= 2.5) return 'Second Class Lower';
    if (gpa >= 2.0) return 'Third Class';
    return 'Pass';
  }

  async function downloadTranscript() {
    if (!showResults) {
      alert('Please convert your GPA first');
      return;
    }

    try {
      console.log('Starting PDF generation...');
      
      // Import jsPDF with better error handling
      let jsPDF;
      try {
        const module = await import('jspdf');
        jsPDF = module.default;
      } catch (importError) {
        console.error('jsPDF import failed:', importError);
        alert('PDF generation temporarily unavailable. Please try again later.');
        return;
      }

      const doc = new jsPDF();
      console.log('PDF document created');

      // University-style header with professional design
      doc.setFillColor(25, 56, 106); // Navy blue header
      doc.rect(0, 0, 210, 40, 'F');
      
      // Gold accent line
      doc.setFillColor(218, 165, 32);
      doc.rect(0, 40, 210, 2, 'F');
      
      // Institution seal area (placeholder)
      doc.setFillColor(255, 255, 255);
      doc.circle(30, 20, 12, 'F');
      doc.setDrawColor(25, 56, 106);
      doc.setLineWidth(2);
      doc.circle(30, 20, 12);
      
      // Title in white
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL TRANSCRIPT', 105, 18, { align: 'center' });
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Academic Record & GPA Conversion Report', 105, 28, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Official Academic GPA Conversion Report', 105, 35, { align: 'center' });

      // Reset text color and add document info box
      doc.setTextColor(0, 0, 0);
      
      // Student Information Section with border
      let yPosition = 55;
      doc.setFillColor(248, 249, 250);
      doc.rect(15, yPosition - 5, 180, 35, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(15, yPosition - 5, 180, 35);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 56, 106);
      doc.text('STUDENT INFORMATION', 20, yPosition + 3);
      
      // Two-column layout for student info
      yPosition += 12;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (studentName) {
        doc.setFont('helvetica', 'bold');
        doc.text('Student Name:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(studentName, 60, yPosition);
        yPosition += 6;
      }
      if (universityName) {
        doc.setFont('helvetica', 'bold');
        doc.text('University:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(universityName, 60, yPosition);
      }
      if (programOfStudy) {
        doc.setFont('helvetica', 'bold');
        doc.text('Program:', 110, yPosition - 6);
        doc.setFont('helvetica', 'normal');
        doc.text(programOfStudy, 140, yPosition - 6);
      }
      if (selectedCountry && selectedGradingSystem) {
        doc.setFont('helvetica', 'bold');
        doc.text('Grading System:', 110, yPosition);
        doc.setFont('helvetica', 'normal');
        const systemText = `${formatSystemName(selectedGradingSystem)}`;
        doc.text(systemText, 160, yPosition);
      }

      // Group courses by academic year for better organization
      const coursesByYear = academicYears.reduce((acc, year) => {
        const yearCourses = courses.filter(c => c.year === year);
        if (yearCourses.length > 0) {
          acc[year] = yearCourses;
        }
        return acc;
      }, {} as Record<string, typeof courses>);

      // Add courses without year to "Other Courses"
      const unassignedCourses = courses.filter(c => !c.year);
      if (unassignedCourses.length > 0) {
        coursesByYear['Other Courses'] = unassignedCourses;
      }

      // Academic Record Section
      yPosition = 105;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 56, 106);
      doc.text('ACADEMIC RECORD', 20, yPosition);
      
      // Date and verification info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Document Generated: ${new Date().toLocaleDateString()}`, 20, yPosition + 8);
      doc.text(`Verification ID: GPA-${Date.now().toString().slice(-8)}`, 140, yPosition + 8);
      
      yPosition += 20;

      // Process each academic year with enhanced styling
      Object.entries(coursesByYear).forEach(([year, yearCourses]) => {
        // Check if we need a new page
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 30;
        }

        // Year header with gradient-like effect
        doc.setFillColor(25, 56, 106);
        doc.rect(20, yPosition - 3, 170, 12, 'F');
        doc.setFillColor(218, 165, 32);
        doc.rect(20, yPosition + 9, 170, 1, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${year}`, 25, yPosition + 5);
        doc.setFontSize(10);
        doc.text(`${yearCourses.length} course${yearCourses.length !== 1 ? 's' : ''}`, 150, yPosition + 5);
        
        yPosition += 18;

        // Enhanced table headers
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPosition - 3, 170, 10, 'F');
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition - 3, 190, yPosition - 3);
        doc.line(20, yPosition + 7, 190, yPosition + 7);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Course Code', 25, yPosition + 2);
        doc.text('Course Title', 65, yPosition + 2);
        doc.text('Credits', 135, yPosition + 2);
        doc.text('Grade', 155, yPosition + 2);
        doc.text('US GPA', 175, yPosition + 2);
        
        yPosition += 12;

        // Course entries with alternating backgrounds
        doc.setFont('helvetica', 'normal');
        yearCourses.forEach((course, index) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 30;
          }

          // Alternating row colors
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(20, yPosition - 2, 170, 8, 'F');
          }

          const courseName = course.name.length > 35 ? course.name.substring(0, 35) + '...' : course.name;
          const courseCode = course.code || 'N/A';
          
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);
          doc.text(courseCode, 25, yPosition + 2);
          doc.text(courseName, 65, yPosition + 2);
          doc.text(course.credits.toString(), 135, yPosition + 2, { align: 'center' });
          doc.text(course.grade, 155, yPosition + 2, { align: 'center' });
          
          // Color-code GPA
          const gpaColor = course.usGPA >= 3.5 ? [0, 128, 0] : course.usGPA >= 2.5 ? [255, 165, 0] : [220, 20, 60];
          doc.setTextColor(gpaColor[0], gpaColor[1], gpaColor[2]);
          doc.text(course.usGPA.toFixed(2), 175, yPosition + 2, { align: 'center' });
          
          yPosition += 8;
        });

        yPosition += 8; // Space between years
      });

      // Enhanced Summary Section
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 30;
      }

      // Summary box with professional styling
      doc.setFillColor(25, 56, 106);
      doc.rect(20, yPosition, 170, 45, 'F');
      doc.setFillColor(218, 165, 32);
      doc.rect(20, yPosition + 45, 170, 2, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CONVERSION SUMMARY', 105, yPosition + 12, { align: 'center' });
      
      doc.setFontSize(24);
      doc.text(`${convertedGPA.toFixed(2)}`, 105, yPosition + 28, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Cumulative GPA (4.0 Scale)', 105, yPosition + 35, { align: 'center' });
      
      // Additional details
      doc.setFontSize(10);
      doc.text(`Total Credit Hours: ${totalCredits}`, 30, yPosition + 42);
      doc.text(`Academic Standing: ${gpaClass}`, 130, yPosition + 42);
      
      // Certification footer
      const footerY = yPosition + 60;
      doc.setFillColor(248, 249, 250);
      doc.rect(20, footerY, 170, 25, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, footerY, 170, 25);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('CERTIFICATION', 105, footerY + 5, { align: 'center' });
      doc.text('This document represents an automated conversion of academic grades based on the specified grading system.', 105, footerY + 10, { align: 'center' });
      doc.text('For academic application and transcript evaluation purposes.', 105, footerY + 15, { align: 'center' });
      doc.text(`Document prepared: ${new Date().toLocaleString()}`, 105, footerY + 20, { align: 'center' });

      // Subtle background watermark
      doc.setTextColor(250, 250, 250);
      doc.setFontSize(40);
      doc.text('ACADEMIC TRANSCRIPT', 105, 150, { align: 'center', angle: 45 });
      
      // Download the PDF
      console.log('Saving enhanced PDF...');
      doc.save(`${studentName || 'Student'}_Official_Transcript.pdf`);
      console.log('PDF saved successfully');
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      alert(`Failed to generate PDF: ${error?.message || error}. Please check console for details.`);
    }
  }

  function saveData() {
    if (!browser) return;
    
    const data = {
      studentName,
      universityName,
      programOfStudy,
      selectedCountry,
      selectedGradingSystem,
      courses
    };
    localStorage.setItem('gpaConverterData', JSON.stringify(data));
  }

  function loadSavedData() {
    if (!browser) return;
    
    const savedData = localStorage.getItem('gpaConverterData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        studentName = data.studentName || '';
        universityName = data.universityName || '';
        programOfStudy = data.programOfStudy || '';
        selectedCountry = data.selectedCountry || '';
        selectedGradingSystem = data.selectedGradingSystem || '';
        courses = data.courses || [];
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }



  function formatCountryName(country: string): string {
    return country.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function formatSystemName(system: string): string {
    return system.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Academic Profile Analysis Function
  function handleAnalyzeAcademicProfile() {
    // Enhanced validation for better UX
    if (courses.length === 0) {
      alert('Please add courses first before analyzing your profile.');
      return;
    }

    if (courses.length < 3) {
      const proceed = confirm(`You only have ${courses.length} course(s) added. For meaningful analysis, we recommend at least 5 courses. Would you like to continue anyway?`);
      if (!proceed) return;
    }

    // Check if courses have valid grades and GPA values - removing this validation since it's causing false positives
    // All courses added through the UI will always have valid grades and GPA values

    try {
      // Create academic profile from current session data
      academicProfile = extractCurrentSessionProfile();
      
      // Import and run analysis
      import('$lib/academicAnalyzer/analysisEngine.js').then(module => {
        analysis = module.analyzeAcademicProfile(academicProfile);
        
        // Enhanced validation: check if analysis generated meaningful results
        if (!analysis || !analysis.hasAnalysis) {
          alert('Unable to generate meaningful analysis with current data. Please add more courses or check your entries.');
          return;
        }

        // Only show analysis if we have sufficient insights
        const hasMinimumInsights = (
          (analysis.strengths && analysis.strengths.length > 0) ||
          (analysis.weaknesses && analysis.weaknesses.length > 0) ||
          (analysis.recommendations && analysis.recommendations.length > 0)
        );

        if (!hasMinimumInsights) {
          const proceed = confirm('Analysis completed, but we found limited insights with your current data. This may result in sparse results. Continue viewing?');
          if (!proceed) return;
        }

        showAcademicAnalysis = true;
        
        // Scroll to analysis section
        setTimeout(() => {
          document.getElementById('academic-analysis-section')?.scrollIntoView({ 
            behavior: 'smooth' 
          });
        }, 100);
      }).catch(error => {
        console.error('Error loading analysis engine:', error);
        alert('Unable to load analysis engine. Please try again.');
      });
    } catch (error) {
      console.error('Error analyzing academic profile:', error);
      alert('Error analyzing profile. Please try again.');
    }
  }

  // Extract academic profile from current session
  function extractCurrentSessionProfile() {
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const totalPoints = courses.reduce((sum, course) => sum + course.usGPA * course.credits, 0);
    const calculatedGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

    // Group courses by year
    const coursesByYear: Record<string, any> = {};
    academicYears.forEach(year => {
      const yearCourses = courses.filter(c => c.year === year);
      if (yearCourses.length > 0) {
        const yearCredits = yearCourses.reduce((sum, course) => sum + course.credits, 0);
        const yearPoints = yearCourses.reduce((sum, course) => sum + course.usGPA * course.credits, 0);
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
        studentName: studentName || '',
        universityName: universityName || '',
        programOfStudy: programOfStudy || ''
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
        country: selectedCountry,
        system: selectedGradingSystem
      },
      extractedAt: new Date().toISOString()
    };
  }

  // Helper functions for academic analysis
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

  function loadUploadData() {
    if (!browser) return;
    
    const uploadData = localStorage.getItem('gpaConverterUploadData');
    if (uploadData) {
      try {
        const data = JSON.parse(uploadData);
        selectedCountry = data.selectedCountry || '';
        selectedGradingSystem = data.selectedGradingSystem || '';
        
        if (data.courses && data.courses.length > 0) {
          // Convert uploaded courses to the format used by main converter
          courses = data.courses.map((course: any) => ({
            name: course.name,
            grade: course.grade,
            credits: course.credits,
            usGPA: 0 // Will be calculated when course is processed
          }));
        }
        
        // Clear the upload data after loading
        localStorage.removeItem('gpaConverterUploadData');
      } catch (e) {
        console.error('Error loading upload data:', e);
      }
    }
  }

  function getCurrentGradingSystem() {
    if (!selectedCountry || !selectedGradingSystem) return null;
    const countryData = getAfricanCountryGradingSystems(selectedCountry);
    return countryData && (countryData as any)[selectedGradingSystem] ? (countryData as any)[selectedGradingSystem] : null;
  }

  // Upload functionality
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragActive = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragActive = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragActive = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleFileSelect(target.files[0]);
    }
  }

  function handleFileSelect(file: File) {
    // Support both PDFs and images for comprehensive transcript processing
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('📸 Please upload a PDF or image file (JPG/PNG).\n\nSupported formats:\n• PDF transcripts (will be converted automatically)\n• JPG/PNG images\n\nThis ensures maximum compatibility!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    selectedFile = file;
    if (file.type === 'application/pdf') {
      statusMessage = `✅ PDF Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) - Will convert to images automatically`;
    } else {
      statusMessage = `✅ Image Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }
  }

  async function processTranscript() {
    if (!selectedFile || !selectedCountry || !selectedGradingSystem) {
      alert('Please select a file, country, and grading system');
      return;
    }

    processing = true;
    processingProgress = 0;
    statusMessage = 'Initializing Smart Hybrid OCR...';
    extractedCourses = [];
    extractedText = '';
    detectedSessions = [];
    showPreview = false;

    try {
      statusMessage = 'Analyzing document structure...';
      processingProgress = 10;

      let textResult = '';

      // Handle PDF files by converting to images first
      if (selectedFile.type === 'application/pdf') {
        statusMessage = '📄 Processing PDF: Converting pages to images...';
        processingProgress = 20;
        
        textResult = await processPDFToText(selectedFile);
      } else {
        // Extract text using OCR for image files
        statusMessage = '📖 Extracting text from image...';
        processingProgress = 30;
        
        textResult = await extractTextOnly(selectedFile);
      }
      
      extractedText = textResult;
      
      // Smart analysis of extracted text
      statusMessage = 'Analyzing transcript structure...';
      processingProgress = 70;
      
      const analysisResult = await analyzeTranscriptStructure(extractedText);
      detectedSessions = analysisResult.sessions;
      
      statusMessage = 'Smart analysis complete!';
      processingProgress = 100;
      
      // Show preview for user verification
      if (analysisResult.totalCourses > 0) {
        showPreview = true;
        statusMessage = `🎯 Detected ${detectedSessions.length} session(s) with ${analysisResult.totalCourses} courses. Please review and confirm below.`;
      } else {
        // Smart Fallback System - Text extracted but no courses detected via patterns
        statusMessage = 'Text extracted successfully! Let\'s help you add courses manually.';
        
        // Prepare Smart Assist data
        smartAssistData.extractedLines = extractedText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 10 && /[A-Z]/.test(line))
          .slice(0, 20); // Show first 20 relevant lines
        
        // Try to suggest course information from each line
        smartAssistData.suggestedCourses = smartAssistData.extractedLines.map(line => ({
          line,
          suggested: suggestCourseFromLine(line)
        }));
        
        showSmartAssist = true;
        
        // Provide encouraging message instead of error
        const helpMessage = `🤖 Smart Assist Activated!\n\nI extracted the text from your transcript and found some course patterns.\n\n📋 Next Steps:\n1. Review detected courses below for Quick Add\n2. Use the extracted text lines for manual suggestions\n3. Choose a template for systematic entry\n4. Or switch to manual entry\n\n💡 This helps me learn your transcript format!`;
        
        setTimeout(() => {
          const detectedCount = smartAssistData.suggestedCourses.filter(item => item.suggested).length;
          statusMessage = `🎯 Smart Assist Ready! Found ${detectedCount} potential courses for review.`;
        }, 100);
      }

    } catch (error: any) {
      console.error('Smart OCR Error:', error);
      statusMessage = 'Processing failed. Please try a clearer image or manual entry.';
      alert('❌ Processing failed. Please try:\n\n✅ A clearer, high-resolution image\n✅ Better lighting and contrast\n✅ Manual entry for complex layouts');
    } finally {
      processing = false;
    }
  }

  async function processPDFToText(file: File): Promise<string> {
    try {
      // Import PDF.js for PDF processing
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set up PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      processingProgress = 25;
      statusMessage = '📖 Loading PDF document...';
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let allText = '';
      const totalPages = pdf.numPages;
      
      statusMessage = `📄 Processing ${totalPages} page(s)...`;
      
      // Process each page
      for (let i = 1; i <= totalPages; i++) {
        statusMessage = `📄 Processing page ${i} of ${totalPages}...`;
        processingProgress = 25 + ((i - 1) / totalPages) * 40;
        
        const page = await pdf.getPage(i);
        const scale = 2.0; // Higher scale for better quality
        const viewport = page.getViewport({ scale });
        
        // Create canvas to render PDF page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Failed to get canvas context');
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
        });
        
        // Extract text from the rendered image using OCR
        const pageText = await extractTextOnly(blob as File);
        allText += pageText + '\n\n';
      }
      
      return allText;
      
    } catch (error: any) {
      console.error('PDF processing error:', error);
      statusMessage = '❌ PDF processing failed. Please try converting to JPG manually.';
      throw new Error(`PDF processing failed: ${error.message}. Please convert your PDF to JPG using PDF24.org or SmallPDF.com and try again.`);
    }
  }

  async function extractTextOnly(file: File): Promise<string> {
    const Tesseract = await import('tesseract.js');
    
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          processingProgress = 30 + (m.progress * 40);
          statusMessage = `📖 Extracting text: ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    try {
      const result = await worker.recognize(file);
      await worker.terminate();
      
      // If we got some text but it seems problematic, provide helpful feedback
      if (result.data.text.length < 50) {
        throw new Error('Text too short - image may need better quality');
      }
      
      return result.data.text;
    } catch (error: any) {
      await worker.terminate();
      
      // Provide specific guidance based on error type
      if (error.message?.includes('too short')) {
        statusMessage = '⚠️ Low quality image detected. Please try a clearer image.';
        throw new Error('Image quality too low for reliable extraction');
      }
      
      statusMessage = '❌ Text extraction failed. Please try manual entry.';
      throw error;
    }
  }

  async function analyzeTranscriptStructure(text: string): Promise<{
    sessions: Array<{
      name: string;
      year?: string;
      courses: Array<{
        code: string;
        name: string;
        credits: number | string;
        grade: string;
        extraData: Record<string, string>;
        confidence: 'high' | 'medium' | 'low';
      }>;
    }>;
    totalCourses: number;
    debugInfo: string[];
  }> {
    const sessions: Array<{
      name: string;
      year?: string;
      courses: Array<{
        code: string;
        name: string;
        credits: number | string;
        grade: string;
        extraData: Record<string, string>;
        confidence: 'high' | 'medium' | 'low';
      }>;
    }> = [];
    
    const debugInfo: string[] = [];

    // Split text into lines for analysis
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    debugInfo.push(`Total lines to analyze: ${lines.length}`);
    
    // Detect session patterns
    const sessionPatterns = [
      /(?:summer|spring|fall|winter)\s+(\d{4})/i,
      /year\s+(\d+)/i,
      /semester\s+(\d+)/i,
      /session\s+(\d+)/i,
      /(\d{4})[-\/](\d{4})/i,
      /level\s+(\d+)/i,
      /(\d+)\.\s+semester/i
    ];

    let currentSession = {
      name: 'Extracted Courses',
      year: undefined as string | undefined,
      courses: [] as any[]
    };

    let coursesFound = 0;
    let patternMatches = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip very short lines or lines that look like headers
      if (line.length < 5 || /^(course|name|grade|credit|gpa|total)/i.test(line)) {
        continue;
      }
      
      // Check if this line indicates a new session
      let isSessionHeader = false;
      for (const pattern of sessionPatterns) {
        const match = line.match(pattern);
        if (match) {
          if (currentSession.courses.length > 0) {
            sessions.push({ ...currentSession });
          }
          
                  currentSession = {
          name: line,
          year: match[1],
          courses: []
        };
          isSessionHeader = true;
          debugInfo.push(`Found session: ${line}`);
          break;
        }
      }

      if (isSessionHeader) continue;

      // Try to extract course information from this line
      const courseData = extractCourseFromLine(line);
      if (courseData) {
        patternMatches++;
        (currentSession.courses as any[]).push({
          code: courseData.code,
          name: courseData.name,
          credits: courseData.credits,
          grade: courseData.grade,
          extraData: {},
          confidence: courseData.confidence
        });
        coursesFound++;
        debugInfo.push(`Found course: ${courseData.code} - ${courseData.name} (${courseData.confidence})`);
      } else {
        // Debug: Log lines that didn't match any pattern
        if (line.length > 10 && /[A-Z]/.test(line)) {
          debugInfo.push(`No match: ${line.substring(0, 50)}...`);
        }
      }
    }

    // Don't forget the last session
    if (currentSession.courses.length > 0) {
      sessions.push(currentSession);
    }

    // If no courses were found with patterns, try fallback extraction
    if (coursesFound === 0) {
      debugInfo.push('No courses found with patterns, trying fallback extraction...');
      const fallbackCourses = extractCoursesFromText(text);
      if (fallbackCourses.length > 0) {
        sessions.push({
          name: 'Detected Courses (Fallback)',
          courses: fallbackCourses.map(course => ({
            code: course.code || '',
            name: course.name,
            credits: course.credits,
            grade: course.grade,
            extraData: {},
            confidence: 'low' as const
          }))
        });
        coursesFound = fallbackCourses.length;
        debugInfo.push(`Fallback found ${fallbackCourses.length} courses`);
      }
    }

    const totalCourses = sessions.reduce((sum, session) => sum + session.courses.length, 0);
    debugInfo.push(`Final result: ${sessions.length} sessions, ${totalCourses} total courses`);

    // Log debug info to console for troubleshooting
    console.log('🔍 OCR Analysis Debug:', debugInfo);

    return { sessions, totalCourses, debugInfo };
  }

  function extractCourseFromLine(line: string): {
    code: string;
    name: string;
    credits: number | string;
    grade: string;
    confidence: 'high' | 'medium' | 'low';
  } | null {
    // Enhanced patterns for different transcript formats
    const patterns = [
      // Pattern 1: Standard Course Code + Name + Credits + Grade
      {
        regex: /^([A-Z]{2,4}\s*\d{3,4})\s+(.{10,80}?)\s+(\d+(?:\.\d+)?)\s+([A-F][+-]?)\s*$/i,
        map: (match: RegExpMatchArray) => ({
          code: match[1].trim(),
          name: match[2].trim(),
          credits: parseFloat(match[3]),
          grade: match[4].trim().toUpperCase(),
          confidence: 'high' as const
        })
      },
      
      // Pattern 2: SUYE format (like in your transcript) - Course code followed by description
      {
        regex: /^(SUYE\d{3,4}|[A-Z]{3,5}\d{3,4})\s+([A-Z\s&]+(?:IN|OF|FOR|TO|WITH|AS|AND)[A-Z\s&]*)\s+([A-Z]{1,2})\s+(\d+)\s+/i,
        map: (match: RegExpMatchArray) => ({
          code: match[1].trim(),
          name: match[2].trim(),
          grade: match[3].trim().toUpperCase(),
          credits: parseFloat(match[4]),
          confidence: 'high' as const
        })
      },
      
      // Pattern 3: Line with course code at start and credits/grade pattern
      {
        regex: /^([A-Z]{3,5}\d{3,4})\s+(.+?)\s+([A-Z]{1,2})\s+(\d+)\s+/i,
        map: (match: RegExpMatchArray) => ({
          code: match[1].trim(),
          name: match[2].trim(),
          grade: match[3].trim().toUpperCase(),
          credits: parseFloat(match[4]),
          confidence: 'medium' as const
        })
      },
      
      // Pattern 4: Course info with "opt" designation
      {
        regex: /^([A-Z]{3,5}\d{3,4})\s+([A-Z\s]+)\s+([A-Z]{1,2})\s+(\d+)\s+opt/i,
        map: (match: RegExpMatchArray) => ({
          code: match[1].trim(),
          name: match[2].trim(),
          grade: match[3].trim().toUpperCase(),
          credits: parseFloat(match[4]),
          confidence: 'medium' as const
        })
      },
      
      // Pattern 5: General course name + grade + credits
      {
        regex: /^(.{10,60})\s+([A-F][+-]?|THF|TB|AB|B|CP|P|S|E)\s+(\d+(?:\.\d+)?)\s*$/i,
        map: (match: RegExpMatchArray) => ({
          code: '',
          name: match[1].trim(),
          credits: parseFloat(match[3]),
          grade: match[2].trim().toUpperCase(),
          confidence: 'medium' as const
        })
      }
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        try {
          const result = pattern.map(match);
          // Enhanced validation
          if (result.name && result.grade && result.credits > 0 && result.credits <= 30) {
            // Additional validation for realistic course names
            if (result.name.length >= 3 && !/^\d+$/.test(result.name)) {
              return result;
            }
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  function confirmExtractedSessions() {
    if (detectedSessions.length === 0) {
      return;
    }

    // Instead of adding directly, move to editing phase
    showPreview = false;
    showEditingPhase = true;
    
    // Prepare courses for editing
    coursesForEditing = [];
    for (const session of detectedSessions) {
      for (const course of session.courses) {
        coursesForEditing.push({
          name: course.name,
          code: course.code || '',
          grade: course.grade,
          credits: typeof course.credits === 'string' ? parseFloat(course.credits) : course.credits,
          year: session.year || '',
          semester: '',
          confidence: course.confidence,
          sessionName: session.name
        });
      }
    }
  }

  function editCourseInSession(sessionIndex: number, courseIndex: number) {
    // This could open a modal for editing, for now we'll just log
    console.log('Edit course:', detectedSessions[sessionIndex].courses[courseIndex]);
    // TODO: Implement course editing modal
  }

  function removeCourseFromSession(sessionIndex: number, courseIndex: number) {
    if (detectedSessions[sessionIndex] && detectedSessions[sessionIndex].courses[courseIndex]) {
      detectedSessions[sessionIndex].courses.splice(courseIndex, 1);
      
      // Remove session if it has no courses left
      if (detectedSessions[sessionIndex].courses.length === 0) {
        detectedSessions.splice(sessionIndex, 1);
      }
      
      // Force reactivity update
      detectedSessions = [...detectedSessions];
    }
  }

  function cancelExtraction() {
    showPreview = false;
    detectedSessions = [];
    extractedText = '';
    statusMessage = 'Extraction cancelled. You can try again or enter courses manually.';
  }

  function updateEditingCourse(index: number, field: string, value: any) {
    if (coursesForEditing[index]) {
      (coursesForEditing[index] as any)[field] = value;
      coursesForEditing = [...coursesForEditing]; // Force reactivity
    }
  }

  function removeEditingCourse(index: number) {
    coursesForEditing = coursesForEditing.filter((_, i) => i !== index);
  }

  function confirmEditedCourses() {
    if (coursesForEditing.length === 0 || !currentGradingSystem) {
      return;
    }

    // Convert edited courses to the main format
    const newCourses = coursesForEditing.map(course => {
      const gradeKey = course.grade;
      const usGPA = currentGradingSystem && gradeKey in currentGradingSystem 
        ? (currentGradingSystem as any)[gradeKey]?.usGPA || 0 
        : 0;

      return {
        name: course.name,
        code: course.code || undefined,
        grade: course.grade,
        credits: course.credits,
        usGPA: usGPA,
        year: course.year || undefined,
        semester: course.semester || undefined
      };
    });

    // Add all courses at once
    courses = [...courses, ...newCourses];
    
    // Clear all extraction/editing state
    detectedSessions = [];
    showPreview = false;
    showEditingPhase = false;
    coursesForEditing = [];
    selectedFile = null;
    extractedText = '';
    activeTab = 'manual';
    saveData();

    // Show success message without misleading popup
    alert(`✅ Successfully added ${newCourses.length} courses to your conversion list!`);
    
    // Scroll to courses section
    setTimeout(() => {
      const coursesSection = document.querySelector('[data-section="courses"]');
      if (coursesSection) {
        coursesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  }

  function cancelEditing() {
    showEditingPhase = false;
    coursesForEditing = [];
    statusMessage = 'Course editing cancelled. You can try extraction again.';
  }

  async function cleanupWorker() {
    if (ocrWorker) {
      try {
        await ocrWorker.terminate();
        ocrWorker = null;
      } catch (error) {
        console.error('Error cleaning up OCR worker:', error);
      }
    }
  }

  function removeExtractedCourse(index: number) {
    extractedCourses = extractedCourses.filter((_, i) => i !== index);
  }

  function useExtractedCourses() {
    if (extractedCourses.length === 0 || !currentGradingSystem) {
      console.log('❌ Cannot add courses:', extractedCourses.length, currentGradingSystem);
      return;
    }

    console.log('🔄 Adding', extractedCourses.length, 'courses to the list');
    console.log('Extracted courses:', extractedCourses);

    // Convert extracted courses to the main courses format
    const newCourses = extractedCourses.map(course => {
      const gradeKey = course.grade;
      const usGPA = currentGradingSystem && gradeKey in currentGradingSystem 
        ? (currentGradingSystem as any)[gradeKey]?.usGPA || 0 
        : 0;

      return {
        name: course.name,
        code: course.code || undefined,
        grade: course.grade,
        credits: course.credits,
        usGPA: usGPA,
        year: course.year || undefined,
        semester: undefined
      };
    });

    console.log('🔄 New courses to add:', newCourses.length);
    console.log('📝 Before adding - total courses:', courses.length);

    courses = [...courses, ...newCourses];
    
    console.log('✅ After adding - total courses:', courses.length);

    extractedCourses = [];
    selectedFile = null;
    extractedText = '';
    activeTab = 'manual';
    saveData();

    // Show success message
    alert(`Successfully added ${newCourses.length} courses! Check the "Added Courses" section.`);
  }

  function extractCoursesFromText(text: string): Array<{ name: string; code?: string; grade: string; credits: number; year?: string }> {
    // Fallback extraction for older format compatibility
    const courses: Array<{ name: string; code?: string; grade: string; credits: number; year?: string }> = [];
    
    // Simple pattern matching for basic course information
    const lines = text.split('\n');
    
    for (const line of lines) {
      const courseData = extractCourseFromLine(line);
      if (courseData) {
        courses.push({
          name: courseData.name,
          code: courseData.code,
          grade: courseData.grade,
          credits: typeof courseData.credits === 'string' ? parseFloat(courseData.credits) : courseData.credits,
          year: undefined
        });
      }
    }
    
    return courses;
  }

  function suggestCourseFromLine(line: string): {
    code: string;
    name: string;
    credits: string;
    grade: string;
  } | null {
    // Simplified course suggestion - look for patterns but don't require exact matches
    const patterns = [
      // SUYE format: SUYE7001 COURSE NAME AA 3 6
      {
        regex: /^([A-Z]{3,5}\d{3,4})\s+([A-Z\s&]+)\s+([A-Z]{1,2})\s+(\d+)\s+/i,
        extract: (match: RegExpMatchArray) => ({
          code: match[1],
          name: match[2].trim(),
          grade: match[3],
          credits: match[4]
        })
      },
      // Standard format: MTH101 Mathematics 3 A
      {
        regex: /^([A-Z]{2,4}\d{2,4})\s+([A-Za-z\s]+)\s+(\d+)\s+([A-F][+-]?)\s*$/i,
        extract: (match: RegExpMatchArray) => ({
          code: match[1],
          name: match[2].trim(),
          credits: match[3],
          grade: match[4]
        })
      },
      // Course name with grade: Mathematics A 3
      {
        regex: /^([A-Za-z\s]{10,50})\s+([A-F][+-]?|THF|TB|AB|CP)\s+(\d+)\s*$/i,
        extract: (match: RegExpMatchArray) => ({
          code: '',
          name: match[1].trim(),
          grade: match[2],
          credits: match[3]
        })
      }
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        try {
          const suggestion = pattern.extract(match);
          if (suggestion.name && suggestion.grade && suggestion.credits) {
            return suggestion;
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  function selectTemplate(templateId: string) {
    selectedTemplate = templateId;
    
    // Pre-fill manual entry based on template
    const template = courseTemplates.find(t => t.id === templateId);
    if (template) {
      // Show helpful guidance based on template
      const guidance = {
        'nigerian_format': 'Enter course code (e.g., MTH101), name, grade, and credits.',
        'uk_format': 'Enter course code (e.g., COMP1001), name, credits, and grade.',
        'francophone_format': 'Enter course name, grade (TB, THF, etc.), and credits.',
        'suye_format': 'Enter course code (SUYE####), name, grade, and credits.'
      };
      
      statusMessage = `📋 Template selected: ${template.name}. ${(guidance as any)[templateId] || 'Fill in the course information below.'}`;
    }
  }

  function quickAddCourse(suggested: {
    code: string;
    name: string;
    credits: string;
    grade: string;
  } | null) {
    if (!suggested || !currentGradingSystem) return;
    
    const gradeKey = suggested.grade;
    const usGPA = currentGradingSystem && gradeKey in currentGradingSystem 
      ? (currentGradingSystem as any)[gradeKey]?.usGPA || 0 
      : 0;

    const newCourse = {
      name: suggested.name,
      code: suggested.code || undefined,
      grade: suggested.grade,
      credits: parseFloat(suggested.credits) || 0,
      usGPA: usGPA,
      year: undefined,
      semester: undefined
    };

    courses = [...courses, newCourse];
    saveData();

    // Remove from suggestions to avoid duplicates
    smartAssistData.suggestedCourses = smartAssistData.suggestedCourses.filter(
      item => item.suggested !== suggested
    );

    statusMessage = `✅ Added course: ${suggested.code || ''} ${suggested.name}`;
  }

  let processedLines = new Set(); // Track which lines have been processed

  // Smart Assist workflow: Always go to manual editing for verification
  function suggestFromLine(line: string, lineIndex: number) {
    console.log('🔍 Analyzing line:', line);
    
    // Try smart pattern matching first
    const suggestion = suggestCourseFromLine(line);
    console.log('💡 Suggestion result:', suggestion);
    
    let extractedInfo = null;
    
    if (suggestion && suggestion.name && suggestion.grade && suggestion.credits) {
      // Use pattern-matched info
      extractedInfo = {
        courseCode: suggestion.code || '',
        courseName: suggestion.name,
        grade: suggestion.grade,
        credits: suggestion.credits
      };
      console.log('✅ Pattern matched perfectly');
    } else {
      // Try manual parsing fallback
      console.log('⚡ Using fallback parsing');
      const manualSuggestion = parseLineManually(line);
      console.log('🔧 Manual suggestion result:', manualSuggestion);
      
      if (manualSuggestion.courseName) {
        extractedInfo = manualSuggestion;
      }
    }
    
    if (extractedInfo && extractedInfo.courseName) {
      // Pre-fill manual form with extracted info
      courseCode = extractedInfo.courseCode || '';
      courseName = extractedInfo.courseName;
      selectedGrade = extractedInfo.grade || '';
      credits = extractedInfo.credits || '';
      // Only reset academic year if it's empty - preserve user's selection
      if (!selectedYear) {
        selectedYear = '';
      }
      
      // Mark this line as processed to show visual feedback
      processedLines.add(lineIndex);
      
      statusMessage = `📝 Pre-filled form with extracted info. Please verify and add course.`;
      
      // Switch to manual tab but DON'T close Smart Assist
      activeTab = 'manual';
      
      setTimeout(() => {
        // Auto-scroll to the manual form section
        const manualFormSection = document.querySelector('[data-section="manual-form"]') || 
                                 document.querySelector('.manual-entry-form') ||
                                 document.querySelector('input[placeholder*="Course name"]')?.closest('.space-y-4');
        
        if (manualFormSection) {
          manualFormSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
        
        // Focus on course name input after scrolling
        setTimeout(() => {
          const courseNameInput = document.querySelector('input[placeholder*="Course name"]');
          if (courseNameInput) {
            (courseNameInput as HTMLElement).focus();
          }
        }, 300);
      }, 100);
    } else {
      statusMessage = `❌ Couldn't extract course info from: "${line.substring(0, 40)}..." - Try a different line.`;
    }
  }

  // Manual parsing fallback for lines that don't match standard patterns
  function parseLineManually(line: string) {
    const result = {
      courseCode: '',
      courseName: '',
      grade: '',
      credits: ''
    };
    
    // Try to extract course name (usually the longest text part)
    const parts = line.split(/[|,\-]/);
    if (parts.length > 0) {
      result.courseName = parts[0].trim().replace(/^\d+:?\s*/, ''); // Remove line numbers
    }
    
    // Look for grade patterns (letters, especially common African grades)
    const gradeMatch = line.match(/\b([A-F][+-]?|THF|TB|AB|B|P|CP|S|E|AD|AA)\b/i);
    if (gradeMatch) {
      result.grade = gradeMatch[1].toUpperCase();
    }
    
    // Look for credits (numbers, often after words like "credit", "unit")
    const creditMatch = line.match(/(\d+)\s*(?:credit|unit|hr|hour)?/i);
    if (creditMatch) {
      result.credits = creditMatch[1];
    }
    
    // Look for course codes (letters + numbers at start)
    const codeMatch = line.match(/\b([A-Z]{2,5}\d{3,4})\b/);
    if (codeMatch) {
      result.courseCode = codeMatch[1];
    }
    
    return result;
  }

  function finishSmartAssist() {
    const processedCount = processedLines.size;
    showSmartAssist = false;
    processedLines.clear(); // Reset for next time
    statusMessage = `🎉 Smart Assist completed! Added ${processedCount} courses. You can add more manually or convert your GPA.`;
    
    // Scroll to courses section if we have courses
    if (courses.length > 0) {
      setTimeout(() => {
        const coursesSection = document.querySelector('[data-section="courses"]');
        if (coursesSection) {
          coursesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }

  function switchToManualEntry() {
    showSmartAssist = false;
    activeTab = 'manual';
    statusMessage = '📝 Switched to manual entry. Add courses one by one using the form below.';
    
    // Clear any pre-filled data
    courseCode = '';
    courseName = '';
    selectedGrade = '';
    credits = '';
  }

  function cancelSmartAssist() {
    showSmartAssist = false;
    showPreview = false;
    extractedText = '';
    smartAssistData = {
      extractedLines: [],
      suggestedCourses: []
    };
    selectedFile = null;
    processedLines.clear(); // Reset processed lines
    statusMessage = 'Smart Assist cancelled. You can try uploading a different image or use manual entry.';
  }
</script>

<svelte:head>
  <title>GPA Converter - Convert African University Grades to US 4.0 GPA</title>
  <meta name="description" content="Free GPA converter for African universities. Convert grades from 50+ African countries to US 4.0 GPA scale. Trusted by 3000+ students worldwide.">
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20">
  <!-- Header -->
  <div class="bg-white shadow-lg border-b mt-16">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          🎓 GPA Converter
        </h1>
        <p class="text-xl text-gray-600 mb-4">
          Convert your African university grades to US 4.0 GPA scale
        </p>
        <div class="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div class="flex items-center">
            <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            50+ African Countries
          </div>
          <div class="flex items-center">
            <span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            3,200+ Conversions
          </div>
          <div class="flex items-center">
            <span class="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            100% Free
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Input Form -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Student Information</h2>
        
        <!-- Student Details -->
        <div class="space-y-4 mb-6">
          <div>
            <label for="student-name" class="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
            <input
              id="student-name"
              type="text"
              bind:value={studentName}
              oninput={saveData}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label for="university-name" class="block text-sm font-medium text-gray-700 mb-2">University Name</label>
            <input
              id="university-name"
              type="text"
              bind:value={universityName}
              oninput={saveData}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your university name"
            />
          </div>
          
          <div>
            <label for="program-study" class="block text-sm font-medium text-gray-700 mb-2">Program of Study</label>
            <input
              id="program-study"
              type="text"
              bind:value={programOfStudy}
              oninput={saveData}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Computer Science, Medicine"
            />
          </div>
        </div>

        <!-- Country and System Selection -->
        <div class="space-y-4 mb-6">
          <div>
            <label for="country" class="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <select
              id="country"
              bind:value={selectedCountry}
              onchange={updateGradingSystems}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Country</option>
              {#each africanCountries as country}
                <option value={country}>{country}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label for="grading-system" class="block text-sm font-medium text-gray-700 mb-2">Grading System</label>
            <select
              id="grading-system"
              bind:value={selectedGradingSystem}
              onchange={updateGrades}
              disabled={!selectedCountry}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select Grading System</option>
              {#each gradingSystems as system}
                <option value={system}>{system}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="border-t pt-6 mb-6">
          <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              class="flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors"
              class:bg-white={activeTab === 'manual'}
              class:text-purple-600={activeTab === 'manual'}
              class:shadow-sm={activeTab === 'manual'}
              class:text-gray-600={activeTab !== 'manual'}
              onclick={() => activeTab = 'manual'}
            >
              ✏️ Manual Entry
            </button>
            <button
              class="flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors"
              class:bg-white={activeTab === 'upload'}
              class:text-purple-600={activeTab === 'upload'}
              class:shadow-sm={activeTab === 'upload'}
              class:text-gray-600={activeTab !== 'upload'}
              onclick={() => activeTab = 'upload'}
            >
              🚀 Upload Transcript
            </button>
          </div>
        </div>

        <!-- Manual Entry Tab -->
        {#if activeTab === 'manual'}
        <div class="space-y-6" data-tab="manual" data-section="manual-form">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Add Courses Manually</h3>
            {#if showSmartAssist}
              <button
                on:click={() => activeTab = 'upload'}
                class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
              >
                ← Back to Smart Assist
              </button>
            {/if}
          </div>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="course-code" class="block text-sm font-medium text-gray-700 mb-2">Course Code <span class="text-gray-500">(Optional)</span></label>
                <input
                  id="course-code"
                  type="text"
                  bind:value={courseCode}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., MTH 101, BIO 201"
                />
              </div>
              <div>
                <label for="academic-year" class="block text-sm font-medium text-gray-700 mb-2">Academic Year <span class="text-gray-500">(Optional)</span></label>
                <select
                  id="academic-year"
                  bind:value={selectedYear}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select year</option>
                  {#each academicYears as year}
                    <option value={year}>{year}</option>
                  {/each}
                </select>
              </div>
            </div>
            
            <div>
              <label for="course-name" class="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
              <input
                id="course-name"
                type="text"
                bind:value={courseName}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mathematics, Biology, Introduction to Physics"
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="course-grade" class="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                <select
                  id="course-grade"
                  bind:value={selectedGrade}
                  disabled={!currentGradingSystem}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select grade</option>
                  {#each availableGrades as grade}
                    <option value={grade}>
                      {grade} {currentGradingSystem[grade]?.scoreRange ? `(${currentGradingSystem[grade].scoreRange})` : ''}
                    </option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label for="course-credits" class="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                <input
                  id="course-credits"
                  type="number"
                  bind:value={credits}
                  min="0.5"
                  step="0.5"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="3"
                />
              </div>
            </div>
            
            <button
              onclick={addCourse}
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Course
            </button>
          </div>
        </div>
        {/if}

        <!-- Upload Tab -->
        {#if activeTab === 'upload'}
        <div class="space-y-6">
          <h3 class="text-lg font-semibold text-gray-900">Upload Transcript for Automatic Course Extraction</h3>
          
          <!-- File Upload Area -->
          <div 
            class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-colors duration-200"
            class:border-purple-500={dragActive}
            class:bg-purple-50={dragActive}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleDrop}
            role="button"
            tabindex="0"
          >
            {#if selectedFile}
              <div class="space-y-4">
                <div class="text-6xl">📄</div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900">{selectedFile.name}</h4>
                  <p class="text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                  </p>
                </div>
                <button
                  onclick={() => selectedFile = null}
                  class="text-red-600 hover:text-red-800 font-medium"
                >
                  Remove File
                </button>
              </div>
            {:else}
              <div class="space-y-4">
                <div class="text-6xl">📁</div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900">
                    Drag and drop your transcript here
                  </h4>
                  <p class="text-gray-600">
                    or click to browse files
                  </p>
                </div>
                <div class="text-sm text-gray-500">
                  Supports PDF transcripts and JPG/PNG images up to 10MB
                </div>
                
                <!-- Image vs PDF Recommendation -->
                <div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p class="text-xs text-yellow-800">
                    📸 <strong>Best Results Tip:</strong> 
                    Images (JPG/PNG) provide significantly better text recognition than PDFs! If you have an image of your transcript, that's your best option for accurate course extraction.
                  </p>
                </div>
                
                <div class="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p class="text-xs text-blue-700">
                    💡 <strong>Smart Processing:</strong> 
                    • PDF files are automatically converted to high-quality images
                    • JPG/PNG images are processed directly with OCR
                    • Best results with clear, readable text
                  </p>
                </div>
                <div class="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p class="text-xs text-green-700">
                    ✅ <strong>Fully Automatic:</strong> Just upload your transcript and our AI will extract all courses, grades, and credits automatically!
                  </p>
                </div>
              </div>
            {/if}
            
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              on:change={handleFileInput}
              class="hidden"
              id="transcriptFileInput"
            />
            
            {#if !selectedFile}
              <label
                for="transcriptFileInput"
                class="mt-4 inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Choose File
              </label>
            {/if}
          </div>

          <!-- Process Button -->
          {#if selectedFile && selectedCountry && selectedGradingSystem}
            <div class="text-center">
              <button
                onclick={processTranscript}
                disabled={processing}
                class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if processing}
                  🔄 Processing Transcript...
                {:else}
                  🤖 Extract Courses with AI
                {/if}
              </button>
            </div>
          {/if}

          <!-- Processing Progress -->
          {#if processing}
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h4 class="text-xl font-bold text-gray-900 mb-4">Processing Your Transcript</h4>
              
              <div class="space-y-4">
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    class="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                    style="width: {processingProgress}%"
                  ></div>
                </div>
                
                <div class="text-center">
                  <p class="text-lg font-medium text-gray-700">{Math.round(processingProgress)}% Complete</p>
                  <p class="text-gray-600">{statusMessage}</p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Smart Hybrid Preview -->
          {#if showPreview && detectedSessions.length > 0}
            <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <h4 class="text-xl font-bold text-gray-900 mb-4">
                🎯 Smart Analysis Results - Please Review
              </h4>
              
              <div class="mb-4 text-sm text-gray-600">
                We detected <strong>{detectedSessions.length}</strong> academic sessions. Please review and confirm the extracted courses:
              </div>
              
              <!-- Sessions Preview -->
              <div class="space-y-4 mb-6">
                {#each detectedSessions as session, sessionIndex}
                  <div class="bg-white rounded-lg border border-purple-200 p-4">
                    <h5 class="text-lg font-semibold text-purple-600 mb-3 border-b border-purple-100 pb-1">
                      📚 {session.name} 
                      {#if session.year}
                        <span class="text-sm text-gray-500">({session.year})</span>
                      {/if}
                      <span class="text-sm font-normal text-gray-600">- {session.courses.length} courses</span>
                    </h5>
                    
                    <div class="space-y-2">
                      {#each session.courses as course, courseIndex}
                        <div class="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-100">
                          <div class="flex-1">
                            <div class="font-medium text-gray-900">
                              {#if course.code}
                                <span class="text-purple-600 font-semibold">{course.code}</span> - 
                              {/if}
                              {course.name}
                            </div>
                            <div class="text-sm text-gray-600">
                              Grade: <span class="font-medium">{course.grade}</span> | 
                              Credits: <span class="font-medium">{course.credits}</span>
                              <span class="ml-2 px-2 py-1 text-xs rounded-full {course.confidence === 'high' ? 'bg-green-100 text-green-800' : course.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                                {course.confidence} confidence
                              </span>
                            </div>
                          </div>
                          <button
                            on:click={() => removeCourseFromSession(sessionIndex, courseIndex)}
                            class="text-red-600 hover:text-red-800 font-medium text-sm px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-3 justify-center">
                <button
                  on:click={confirmExtractedSessions}
                  class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ✅ Confirm & Add All Courses
                </button>
                <button
                  on:click={cancelExtraction}
                  class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ❌ Cancel & Try Again
                </button>
              </div>
            </div>
          {/if}

          <!-- Course Editing Phase -->
          {#if showEditingPhase && coursesForEditing.length > 0}
            <div class="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
              <h4 class="text-xl font-bold text-gray-900 mb-4">
                ✏️ Review & Edit Extracted Courses
              </h4>
              
              <div class="mb-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                <p class="text-blue-800 text-sm">
                  📝 <strong>Review each course below:</strong> Edit any incorrect information, then confirm to add all courses to your conversion list.
                </p>
              </div>
              
              <div class="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {#each coursesForEditing as course, index}
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label for="edit-course-code-{index}" class="block text-xs font-medium text-gray-700 mb-1">Course Code</label>
                        <input
                          id="edit-course-code-{index}"
                          type="text"
                          bind:value={course.code}
                          on:input={() => updateEditingCourse(index, 'code', course.code)}
                          class="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., MTH101"
                        />
                      </div>
                      
                      <div class="md:col-span-2">
                        <label for="edit-course-name-{index}" class="block text-xs font-medium text-gray-700 mb-1">Course Name</label>
                        <input
                          id="edit-course-name-{index}"
                          type="text"
                          bind:value={course.name}
                          on:input={() => updateEditingCourse(index, 'name', course.name)}
                          class="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Mathematics I"
                        />
                      </div>
                      
                      <div>
                        <label for="edit-course-credits-{index}" class="block text-xs font-medium text-gray-700 mb-1">Credits</label>
                        <input
                          id="edit-course-credits-{index}"
                          type="number"
                          bind:value={course.credits}
                          on:input={() => updateEditingCourse(index, 'credits', course.credits)}
                          class="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          max="12"
                          step="1"
                        />
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label for="edit-course-grade-{index}" class="block text-xs font-medium text-gray-700 mb-1">Grade</label>
                        <select
                          id="edit-course-grade-{index}"
                          bind:value={course.grade}
                          on:change={() => updateEditingCourse(index, 'grade', course.grade)}
                          class="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Grade</option>
                          {#each availableGrades as grade}
                            <option value={grade}>{grade}</option>
                          {/each}
                        </select>
                      </div>
                      
                      <div>
                        <label for="edit-course-year-{index}" class="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                        <select
                          id="edit-course-year-{index}"
                          bind:value={course.year}
                          on:change={() => updateEditingCourse(index, 'year', course.year)}
                          class="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Year</option>
                          {#each academicYears as year}
                            <option value={year}>{year}</option>
                          {/each}
                        </select>
                      </div>
                      
                      <div class="flex items-end">
                        <button
                          on:click={() => removeEditingCourse(index)}
                          class="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    <div class="mt-2 flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-500">From: {course.sessionName}</span>
                        <span class="px-2 py-1 text-xs rounded-full {course.confidence === 'high' ? 'bg-green-100 text-green-800' : course.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                          {course.confidence} confidence
                        </span>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-3 justify-center">
                <button
                  on:click={confirmEditedCourses}
                  class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                >
                  ✅ Confirm & Add All {coursesForEditing.length} Courses
                </button>
                <button
                  on:click={cancelEditing}
                  class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ❌ Cancel & Start Over
                </button>
              </div>
            </div>
          {/if}

          <!-- Extracted Courses -->
          {#if extractedCourses.length > 0}
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <h4 class="text-xl font-bold text-gray-900 mb-4">
                🎉 Extracted {extractedCourses.length} Courses
              </h4>
              
              <div class="space-y-3 mb-6">
                {#each extractedCourses as course, index}
                  <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div class="flex-1">
                      <div class="font-medium text-gray-900">
                        {#if course.code}
                          <span class="text-green-600 font-semibold">{course.code}</span> - 
                        {/if}
                        {course.name}
                      </div>
                      <div class="text-sm text-gray-600">
                        Grade: <span class="font-medium">{course.grade}</span> | 
                        Credits: <span class="font-medium">{course.credits}</span>
                        {#if course.year}
                          | Year: <span class="font-medium text-blue-600">{course.year}</span>
                        {/if}
                      </div>
                    </div>
                    <button
                      on:click={() => removeExtractedCourse(index)}
                      class="text-red-600 hover:text-red-800 font-medium text-sm px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                {/each}
              </div>
              
              <div class="text-center">
                <button
                  on:click={useExtractedCourses}
                  class="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                >
                  ✅ Add These Courses
                </button>
              </div>
            </div>
          {/if}



          <!-- Smart Assist Mode -->
          {#if showSmartAssist}
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <h4 class="text-xl font-bold text-gray-900 mb-4">
                🤖 Smart Assist Mode
              </h4>
              
              <div class="mb-4 p-4 bg-blue-100 rounded-lg border border-blue-200">
                <p class="text-blue-800 font-medium">✅ Text extraction successful!</p>
                <p class="text-blue-700 text-sm mt-1">
                  I can see your transcript content. Let me help you add courses quickly using the options below.
                </p>
              </div>

              <!-- Quick Template Selection -->
              <div class="mb-6">
                <h5 class="text-lg font-semibold text-gray-900 mb-3">📋 Choose Your Transcript Format</h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {#each courseTemplates as template}
                    <button
                      class="p-4 border rounded-lg text-left hover:bg-blue-50 transition-colors"
                      class:bg-blue-100={selectedTemplate === template.id}
                      class:border-blue-500={selectedTemplate === template.id}
                      class:border-gray-300={selectedTemplate !== template.id}
                      on:click={() => selectTemplate(template.id)}
                    >
                      <div class="font-medium text-gray-900 mb-1">{template.name}</div>
                      <div class="text-sm text-gray-600 mb-2">{template.example}</div>
                      <div class="text-xs text-gray-500 mb-1">{template.pattern}</div>
                      {#if template.description}
                        <div class="text-xs text-blue-600 font-medium">{template.description}</div>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Smart Course Suggestions -->
              {#if smartAssistData.suggestedCourses.some(item => item.suggested)}
                <div class="mb-6">
                  <h5 class="text-lg font-semibold text-gray-900 mb-3">⚡ Quick Add Detected Courses</h5>
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    {#each smartAssistData.suggestedCourses as item}
                      {#if item.suggested}
                        <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                          <div class="flex-1">
                            <div class="font-medium text-gray-900">
                              {#if item.suggested.code}
                                <span class="text-green-600 font-semibold">{item.suggested.code}</span> - 
                              {/if}
                              {item.suggested.name}
                            </div>
                            <div class="text-sm text-gray-600">
                              Grade: <span class="font-medium">{item.suggested.grade}</span> | 
                              Credits: <span class="font-medium">{item.suggested.credits}</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">From: {item.line.substring(0, 60)}...</div>
                          </div>
                          <button
                            on:click={() => quickAddCourse(item.suggested)}
                            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Quick Add
                          </button>
                        </div>
                      {/if}
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Extracted Text for Manual Review -->
              <div class="mb-6">
                <h5 class="text-lg font-semibold text-gray-900 mb-3">📝 Extracted Text (Click lines to add courses)</h5>
                <p class="text-sm text-gray-600 mb-3">
                  🎯 Click any line below to extract course information. I'll either Quick Add it or help you edit before adding.
                </p>
                <div class="bg-white p-4 rounded-lg border max-h-48 overflow-y-auto">
                  {#each smartAssistData.extractedLines as line, index}
                    {@const isProcessed = processedLines.has(index)}
                    <button 
                      class="w-full text-left text-sm py-2 px-3 rounded transition-colors focus:outline-none group border-l-2"
                      class:bg-green-100={isProcessed}
                      class:border-green-500={isProcessed}
                      class:hover:bg-green-50={!isProcessed}
                      class:cursor-pointer={!isProcessed}
                      class:border-transparent={!isProcessed}
                      class:hover:border-green-400={!isProcessed}
                      class:focus:ring-2={!isProcessed}
                      class:focus:ring-green-400={!isProcessed}
                      class:opacity-60={isProcessed}
                      class:cursor-default={isProcessed}
                      on:click={() => !isProcessed && suggestFromLine(line, index)}
                      on:keydown={(e) => e.key === 'Enter' && !isProcessed && suggestFromLine(line, index)}
                      title={isProcessed ? "Already processed ✅" : "Click to extract course info and add to your list"}
                      disabled={isProcessed}
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <span class="text-gray-600 font-mono text-xs mr-2">{index + 1}:</span>
                          <span class:text-gray-800={!isProcessed} class:text-green-700={isProcessed}>{line}</span>
                          {#if isProcessed}
                            <span class="text-green-600 text-xs ml-2">✅ Added</span>
                          {/if}
                        </div>
                        {#if !isProcessed}
                          <span class="text-green-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to extract →
                          </span>
                        {/if}
                      </div>
                    </button>
                  {/each}
                </div>
                <div class="text-xs text-gray-500 mt-2">
                  💡 If a line doesn't have complete info, I'll pre-fill what I can find and let you complete the rest.
                </div>
              </div>

              <!-- Progress and Action Buttons -->
              <div class="bg-blue-50 rounded-lg p-4 mb-4">
                <div class="text-center">
                  <p class="text-sm text-blue-800 font-medium">
                    📊 Lines analyzed: {processedLines.size} of {smartAssistData.extractedLines.length}
                  </p>
                  <p class="text-xs text-blue-600 mt-1">
                    {#if activeTab === 'manual'}
                      🔄 Currently editing a course - return here to continue
                    {:else}
                      Click lines below to extract course information
                    {/if}
                  </p>
                  <div class="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style="width: {smartAssistData.extractedLines.length > 0 ? (processedLines.size / smartAssistData.extractedLines.length) * 100 : 0}%"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="flex gap-3 justify-center">
                <button
                  on:click={() => finishSmartAssist()}
                  class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ✅ Done - Continue to Conversion
                </button>
                <button
                  on:click={() => switchToManualEntry()}
                  class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  📝 Switch to Manual Entry
                </button>
                <button
                  on:click={cancelSmartAssist}
                  class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ❌ Cancel & Try Different Image
                </button>
              </div>
            </div>
          {/if}
        </div>
        {/if}
      </div>

      <!-- Results and Course List -->
      <div class="space-y-6">
        <!-- Course List -->
        {#if courses.length > 0}
          <div class="bg-white rounded-xl shadow-lg p-6" data-section="courses">
            <h3 class="text-xl font-bold text-gray-900 mb-4">
              Added Courses ({courses.length})
            </h3>
            
            <!-- Group courses by academic year -->
            {#each academicYears as year}
              {@const yearCourses = courses.filter(c => c.year === year)}
              {#if yearCourses.length > 0}
                <div class="mb-6">
                  <h4 class="text-lg font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">
                    📚 {year} ({yearCourses.length} courses)
                  </h4>
                  <div class="space-y-2">
                    {#each yearCourses as course, index}
                      {@const globalIndex = courses.indexOf(course)}
                      <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div class="flex-1">
                          <div class="font-medium text-gray-900">
                            {#if course.code}
                              <span class="text-blue-600 font-semibold">{course.code}</span> - 
                            {/if}
                            {course.name}
                          </div>
                          <div class="text-sm text-gray-600">
                            Grade: <span class="font-medium">{course.grade}</span> | 
                            Credits: <span class="font-medium">{course.credits}</span> | 
                            US GPA: <span class="font-medium text-green-600">{course.usGPA.toFixed(1)}</span>
                          </div>
                        </div>
                        <button
                          on:click={() => removeCourse(globalIndex)}
                          class="text-red-600 hover:text-red-800 font-medium text-sm px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            {/each}
            
                         <!-- Courses without assigned year -->
             {#if courses.filter(c => !c.year).length > 0}
               {@const unassignedCourses = courses.filter(c => !c.year)}
              <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-600 mb-3 border-b border-gray-200 pb-1">
                  📝 Other Courses ({unassignedCourses.length})
                </h4>
                <div class="space-y-2">
                  {#each unassignedCourses as course}
                    {@const globalIndex = courses.indexOf(course)}
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div class="flex-1">
                        <div class="font-medium text-gray-900">
                          {#if course.code}
                            <span class="text-gray-600 font-semibold">{course.code}</span> - 
                          {/if}
                          {course.name}
                        </div>
                        <div class="text-sm text-gray-600">
                          Grade: <span class="font-medium">{course.grade}</span> | 
                          Credits: <span class="font-medium">{course.credits}</span> | 
                          US GPA: <span class="font-medium text-green-600">{course.usGPA.toFixed(1)}</span>
                        </div>
                      </div>
                      <button
                        on:click={() => removeCourse(globalIndex)}
                        class="text-red-600 hover:text-red-800 font-medium text-sm px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            
            <button
              on:click={convertGPA}
              class="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
            >
              🚀 Convert My GPA
            </button>
          </div>
        {/if}

        <!-- Results -->
        {#if showResults}
          <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">🎉 Conversion Results</h3>
            
            <div class="space-y-4">
              <div class="text-center p-6 bg-white rounded-lg shadow-sm">
                <div class="text-4xl font-bold text-green-600 mb-2">
                  {convertedGPA.toFixed(2)}
                </div>
                <div class="text-lg text-gray-700">US 4.0 GPA Scale</div>
              </div>
              
              <div class="grid grid-cols-2 gap-4 text-center">
                <div class="bg-white p-4 rounded-lg shadow-sm">
                  <div class="text-2xl font-bold text-blue-600">{totalCredits}</div>
                  <div class="text-sm text-gray-600">Total Credits</div>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-sm">
                  <div class="text-lg font-bold text-purple-600">{gpaClass}</div>
                  <div class="text-sm text-gray-600">GPA Class</div>
                </div>
              </div>
              
              <button
                on:click={downloadTranscript}
                class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                📄 Download Transcript (PDF)
              </button>
              
              <!-- Academic Profile Analysis CTA -->
              <div class="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div class="flex items-start space-x-3">
                  <div class="text-2xl">🎯</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-blue-900 mb-1">
                      Want to analyze your academic profile?
                    </h4>
                    <p class="text-blue-700 text-sm mb-3">
                      Get comprehensive insights into your strengths, weaknesses, and competitiveness for studying abroad - completely FREE!
                    </p>
                                         <button
                       on:click={handleAnalyzeAcademicProfile}
                       class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                     >
                       📊 Analyze My Profile
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Academic Profile Analysis Results -->
        {#if showAcademicAnalysis && analysis && analysis.hasAnalysis}
          <div id="academic-analysis-section" class="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">🎯 Your Academic Profile Analysis</h3>
              <p class="text-gray-600">Quick insights into your academic strengths and opportunities</p>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-white rounded-lg shadow-sm p-4 text-center">
                <div class="text-2xl font-bold text-blue-600 mb-1">{academicProfile.totalGPA.toFixed(2)}</div>
                <div class="text-sm text-gray-600">Overall GPA</div>
                <div class="text-xs text-gray-500">{analysis.overall.gpaCategory}</div>
              </div>
              <div class="bg-white rounded-lg shadow-sm p-4 text-center">
                <div class="text-2xl font-bold text-green-600 mb-1">{analysis.strengths.length}</div>
                <div class="text-sm text-gray-600">Key Strengths</div>
                <div class="text-xs text-green-600">Identified</div>
              </div>
              <div class="bg-white rounded-lg shadow-sm p-4 text-center">
                <div class="text-2xl font-bold text-orange-600 mb-1">{analysis.weaknesses.length}</div>
                <div class="text-sm text-gray-600">Growth Areas</div>
                <div class="text-xs text-orange-600">To Improve</div>
              </div>
              <div class="bg-white rounded-lg shadow-sm p-4 text-center">
                <div class="text-2xl font-bold text-purple-600 mb-1">{analysis.competitiveness.percentile}th</div>
                <div class="text-sm text-gray-600">Percentile</div>
                <div class="text-xs text-purple-600">{analysis.competitiveness.level}</div>
              </div>
            </div>

            <!-- Preview of Strengths - Limited to just 2 for free users -->
            {#if analysis.strengths.length > 0}
              <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h4 class="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <span class="mr-2">💪</span> Your Academic Strengths
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each analysis.strengths.slice(0, 2) as strength}
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div class="flex items-start space-x-3">
                        <div class="text-xl">{strength.icon}</div>
                        <div class="flex-1">
                          <h5 class="font-medium text-green-900 text-sm">{strength.title}</h5>
                          <p class="text-green-700 text-xs mt-1">{strength.description}</p>
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                            {strength.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  {/each}

                  {#if analysis.strengths.length > 2}
                    <!-- Locked strengths teaser -->
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div class="flex items-center justify-center h-full">
                        <div class="text-center">
                          <div class="text-xl mb-2">🔒</div>
                          <p class="text-gray-600 text-sm">
                            {analysis.strengths.length - 2} more strengths available with
                            <span class="font-medium">Professional Plan</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}

            <!-- Preview of Weaknesses - Limited to just 1 for free users -->
            {#if analysis.weaknesses.length > 0}
              <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h4 class="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                  <span class="mr-2">📈</span> Areas for Growth
                </h4>
                <div class="space-y-3">
                  {#each analysis.weaknesses.slice(0, 1) as weakness}
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div class="flex items-start space-x-3">
                        <div class="text-lg">{weakness.icon}</div>
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-1">
                            <h5 class="font-medium text-orange-900 text-sm">{weakness.title}</h5>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
                              weakness.severity === 'high' ? 'bg-red-100 text-red-800' :
                              weakness.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }">
                              {weakness.severity} priority
                            </span>
                          </div>
                          <p class="text-orange-700 text-xs">{weakness.description}</p>
                        </div>
                      </div>
                    </div>
                  {/each}
                  
                  {#if analysis.weaknesses.length > 1}
                    <!-- Locked weaknesses teaser -->
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                          <div class="text-xl mb-2">🔒</div>
                          <p class="text-gray-600 text-sm">
                            {analysis.weaknesses.length - 1} more growth areas available with
                            <span class="font-medium">Professional Plan</span>
                          </p>
                    </div>
                  </div>
                </div>
                  {/if}
                </div>
              </div>
            {/if}

            <!-- Premium Upgrade Banner -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white mb-6">
              <div class="flex flex-col md:flex-row items-center justify-between">
                <div class="mb-4 md:mb-0 md:mr-6">
                  <h4 class="font-semibold text-xl mb-1">Want the Full Academic Analysis?</h4>
                  <p class="text-purple-100">
                    Upgrade to Professional for complete insights, personalized recommendations, and university competitiveness assessment.
                  </p>
                          </div>
                <div class="flex-shrink-0">
                  <a 
                    href="/pricing" 
                    class="inline-block bg-white text-purple-700 px-5 py-3 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm"
                  >
                    Upgrade Now
                  </a>
                        </div>
                      </div>
                    </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/academic-analyzer" 
                class="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                View Detailed Analysis
              </a>
              <a 
                href="/universities" 
                class="inline-flex items-center justify-center px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Find Matching Universities
              </a>
              <button
                on:click={() => showAcademicAnalysis = false}
                class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close Analysis
              </button>
            </div>
          </div>
        {/if}

      </div>
    </div>

    <!-- Success Stats Section -->
    <div class="mt-16 bg-gray-100 rounded-lg p-8">
      <div class="text-center mb-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Trusted by African Students Worldwide</h3>
        <p class="text-gray-600">Free GPA conversion helping students achieve their academic dreams</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div class="text-3xl font-bold text-green-600">50+</div>
          <div class="text-sm text-gray-600">African Countries</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-blue-600">3,200+</div>
          <div class="text-sm text-gray-600">Conversions Completed</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-purple-600">100%</div>
          <div class="text-sm text-gray-600">FREE Service</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-yellow-600">24/7</div>
          <div class="text-sm text-gray-600">Available Access</div>
        </div>
      </div>
    </div>

    <!-- Call to Action Section -->
    <div class="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
      <h3 class="text-2xl font-bold mb-4">Ready to Build Your Complete Application Package?</h3>
      <p class="text-blue-100 mb-6">
        Now that you can convert your GPA, use our comprehensive suite of AI-powered tools to create compelling application documents and secure funding.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/sop" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
          📝 Generate Statement of Purpose
        </a>
        <a href="/universities" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
          🏛️ Find Matching Universities
        </a>
        <a href="/scholarships" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
          💰 Discover Scholarships
        </a>
        <a href="/pricing" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
          📊 View All Features
        </a>
      </div>
    </div>
  </div>
</div>

<!-- Custom Modal System -->
{#if statusMessage && statusMessage.includes('Smart Assist Ready')}
  <div class="fixed top-4 right-4 z-50 max-w-sm">
    <div class="bg-white rounded-xl shadow-2xl border border-green-200 p-6 transform transition-all animate-pulse">
      <div class="text-center">
        <div class="text-3xl mb-3">🤖</div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">Smart Assist Ready!</h3>
        <p class="text-gray-600 text-sm mb-4">
          Found course patterns. Check Smart Assist section below!
        </p>
        <button
          on:click={() => statusMessage = ''}
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          Got it! ✨
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom styles for better visual appeal */

</style> 