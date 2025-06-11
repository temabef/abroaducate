export interface GradingSystem {
  country: string;
  systemName: string;
  gradeScale: '4.0' | '5.0' | '7.0' | '10.0' | 'percentage' | '100';
  description: string;
  grades: {
    [grade: string]: {
      scoreRange: string;
      usGPA: number;
      ukEquivalent?: string;
      description?: string;
    };
  };
}

// African countries list
export const africanCountries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", "Cape Verde", "Central African Republic", "Chad",
  "Comoros", "Congo", "Democratic Republic of the Congo", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Ethiopia", "Gabon",
  "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali",
  "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal",
  "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Swaziland", "Tanzania", "Togo", "Tunisia", "Uganda",
  "Zambia", "Zimbabwe"
];

// Comprehensive grading systems data
export const gradingSystems = {
  algeria: {
    common_francophone: {
      'THF': { scoreRange: '18 - 20', usGPA: 4.0 },
      'TB': { scoreRange: '16 - 17.99', usGPA: 3.7 },
      'B': { scoreRange: '14 - 15.99', usGPA: 3.3 },
      'AB': { scoreRange: '12 - 13.99', usGPA: 3.0 },
      'P': { scoreRange: '10 - 11.99', usGPA: 2.7 },
      'CP': { scoreRange: 'Nil', usGPA: 2.3 },
      'S': { scoreRange: 'Nil', usGPA: 2.0 },
      'E': { scoreRange: '0 - 9.99', usGPA: 0.0 }
    }
  },
  angola: {
    common_university: {
      'A': { scoreRange: '16 - 20', usGPA: 4.0 },
      'B': { scoreRange: '13 - 15', usGPA: 3.0 },
      'C': { scoreRange: '10 - 12', usGPA: 2.0 },
      'D': { scoreRange: '1 - 9', usGPA: 0.0 }
    }
  },
  benin: {
    common_francophone: {
      'THF': { scoreRange: '18 - 20', usGPA: 4.0 },
      'TB': { scoreRange: '16 - 17.99', usGPA: 3.7 },
      'B': { scoreRange: '14 - 15.99', usGPA: 3.3 },
      'AB': { scoreRange: '12 - 13.99', usGPA: 3.0 },
      'P': { scoreRange: '10 - 11.99', usGPA: 2.7 },
      'CP': { scoreRange: 'Nil', usGPA: 2.3 },
      'S': { scoreRange: 'Nil', usGPA: 2.0 },
      'E': { scoreRange: '0 - 9.99', usGPA: 0.0 }
    }
  },
  botswana: {
    common_university: {
      'A': { scoreRange: '80 - 100', usGPA: 4.0 },
      'B': { scoreRange: '70 - 79.99', usGPA: 3.0 },
      'C': { scoreRange: '60 - 69.99', usGPA: 2.0 },
      'D': { scoreRange: '50 - 59.99', usGPA: 1.0 },
      'E': { scoreRange: '40 - 49.99', usGPA: 0.5 },
      'F': { scoreRange: '0 - 39.99', usGPA: 0.0 }
    },
    university_of_botswana: {
      'A+': { scoreRange: '90 - 100', usGPA: 4.0 },
      'A': { scoreRange: '85 - 89.99', usGPA: 3.7 },
      'A-': { scoreRange: '80 - 84.99', usGPA: 3.3 },
      'B+': { scoreRange: '75 - 79.99', usGPA: 3.0 },
      'B': { scoreRange: '70 - 74.99', usGPA: 2.7 },
      'B-': { scoreRange: '65 - 69.99', usGPA: 2.3 },
      'C+': { scoreRange: '60 - 64.99', usGPA: 2.0 },
      'C': { scoreRange: '55 - 59.99', usGPA: 1.7 },
      'C-': { scoreRange: '50 - 54.99', usGPA: 1.3 },
      'D+': { scoreRange: '45 - 49.99', usGPA: 1.0 },
      'D': { scoreRange: '40 - 44.99', usGPA: 0.7 },
      'D-': { scoreRange: '35 - 39.99', usGPA: 0.5 },
      'E': { scoreRange: '0 - 34.99', usGPA: 0.0 }
    }
  },
  burkina_faso: {
    common_francophone: {
      'THF': { scoreRange: '18 - 20', usGPA: 4.0 },
      'TB': { scoreRange: '16 - 17.99', usGPA: 3.7 },
      'B': { scoreRange: '14 - 15.99', usGPA: 3.3 },
      'AB': { scoreRange: '12 - 13.99', usGPA: 3.0 },
      'P': { scoreRange: '10 - 11.99', usGPA: 2.7 },
      'CP': { scoreRange: 'Nil', usGPA: 2.3 },
      'S': { scoreRange: 'Nil', usGPA: 2.0 },
      'E': { scoreRange: '0 - 9.99', usGPA: 0.0 }
    }
  },
  // Continue with more countries...
  ghana: {
    general_certificate_of_education_advanced_level: {
      'A': { scoreRange: '70-100', usGPA: 4.0 },
      'B': { scoreRange: '60-69', usGPA: 3.0 },
      'C': { scoreRange: '50-59', usGPA: 2.0 },
      'D': { scoreRange: '40-49', usGPA: 1.0 },
      'E': { scoreRange: '0-39', usGPA: 0.0 }
    },
    university: {
      'A+': { scoreRange: 'Nil', usGPA: 4.0 },
      'A': { scoreRange: '80-100', usGPA: 4.0 },
      'A-': { scoreRange: 'Nil', usGPA: 3.7 },
      'B+': { scoreRange: '75-79.99', usGPA: 3.3 },
      'B': { scoreRange: '70-74.99', usGPA: 3.0 },
      'B-': { scoreRange: 'Nil', usGPA: 2.7 },
      'C+': { scoreRange: '65-69.99', usGPA: 2.3 },
      'C': { scoreRange: '60-64.99', usGPA: 2.0 },
      'C-': { scoreRange: 'Nil', usGPA: 1.7 },
      'D+': { scoreRange: '55-59', usGPA: 1.3 },
      'D': { scoreRange: '50-54.99', usGPA: 1.0 },
      'D-': { scoreRange: 'Nil', usGPA: 0.7 },
      'F': { scoreRange: '0-49.99', usGPA: 0.0 }
    }
  },
  // Adding Nigeria with comprehensive university systems
  nigeria: {
    '5_point': {
      'A': { scoreRange: '70-100', usGPA: 4.0 },
      'B': { scoreRange: '60-69', usGPA: 3.5 },
      'C': { scoreRange: '50-59', usGPA: 3.0 },
      'D': { scoreRange: '45-49', usGPA: 2.5 },
      'E': { scoreRange: '40-44', usGPA: 2.0 },
      'F': { scoreRange: '0-39', usGPA: 0.0 }
    },
    university_of_ibadan: {
      'A': { scoreRange: '70-100', usGPA: 4.0 },
      'B': { scoreRange: '60-69.99', usGPA: 3.0 },
      'C': { scoreRange: '50-59.99', usGPA: 2.0 },
      'D': { scoreRange: '45-49.99', usGPA: 1.5 },
      'E': { scoreRange: '40-44.99', usGPA: 1.0 },
      'F': { scoreRange: '0-39.99', usGPA: 0.0 }
    }
  }
};

// Helper functions
export function getCountryGradingSystems(country: string) {
  const countryKey = country.toLowerCase().replace(/\s+/g, '_');
  return gradingSystems[countryKey as keyof typeof gradingSystems] || {};
}

export function getGradingSystem(country: string, systemName: string) {
  const countrySystems = getCountryGradingSystems(country);
  return countrySystems[systemName as keyof typeof countrySystems];
}

export function getAvailableCountries(): string[] {
  return africanCountries;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  grade: string;
  originalScore?: number;
  convertedGPA?: number;
}

export interface ConversionResult {
  originalGPA: number;
  convertedGPA: number;
  totalCredits: number;
  courses: Course[];
  gradingSystem: any;
  timestamp: Date;
  notes?: string;
} 