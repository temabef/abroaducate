// Comprehensive African Countries Grading Systems
// Based on original research and university data compilation
// All 53 African countries have grading systems to ensure no user is blocked

export const africanCountries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", "Cape Verde", 
  "Central African Republic", "Chad", "Comoros", "Congo", "Democratic Republic of the Congo", 
  "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Ethiopia", "Gabon", "Gambia", "Ghana", 
  "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", 
  "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", 
  "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", 
  "South Africa", "South Sudan", "Sudan", "Swaziland", "Tanzania", "Togo", "Tunisia", "Uganda",
  "Zambia", "Zimbabwe"
];

export const africanGradingSystems = {
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
  burundi: {
    common_francophone: {
      'THF': { scoreRange: '18 - 20', usGPA: 4.0 },
      'TB': { scoreRange: '16 - 17.99', usGPA: 3.7 },
      'B': { scoreRange: '14 - 15.99', usGPA: 3.3 },
      'AB': { scoreRange: '12 - 13.99', usGPA: 3.0 },
      'P': { scoreRange: '10 - 11.99', usGPA: 2.7 },
      'CP': { scoreRange: 'Nil', usGPA: 2.3 },
      'S': { scoreRange: 'Nil', usGPA: 2.0 },
      'E': { scoreRange: '0 - 9.99', usGPA: 0.0 }
    },
    university_of_burundi: {
      'A': { scoreRange: '90 - 100', usGPA: 4.0 },
      'B': { scoreRange: '80 - 89.99', usGPA: 3.0 },
      'C': { scoreRange: '70 - 79.99', usGPA: 2.0 },
      'D': { scoreRange: '60 - 69.99', usGPA: 1.0 },
      'E': { scoreRange: '50 - 59.99', usGPA: 0.5 },
      'F': { scoreRange: '0 - 49.99', usGPA: 0.0 }
    }
  },
  cameroon: {
    english_system: {
      'A': { scoreRange: '90 - 100', usGPA: 4.0 },
      'A-': { scoreRange: '80 - 89.99', usGPA: 3.7 },
      'B': { scoreRange: '70 - 79.99', usGPA: 3.3 },
      'C': { scoreRange: '60 - 69.99', usGPA: 2.7 }
    },
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
  cape_verde: {
    post_secondary: {
      'A': { scoreRange: '18 - 20', usGPA: 4.0 },
      'B': { scoreRange: '14 - 17', usGPA: 3.0 },
      'C': { scoreRange: '10 - 13', usGPA: 2.0 },
      'F': { scoreRange: '0 - 9', usGPA: 0.0 }
    },
    portuguese: {
      'A': { scoreRange: '16 - 20', usGPA: 4.0 },
      'B': { scoreRange: '13 - 15', usGPA: 3.0 },
      'C': { scoreRange: '10 - 12', usGPA: 2.0 },
      'F': { scoreRange: '1 - 9', usGPA: 0.0 }
    }
  },
  central_african_republic: {
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
  chad: {
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
  comoros: {
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
  congo: {
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
  democratic_republic_of_the_congo: {
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
  djibouti: {
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
  egypt: {
    university_scale_a: {
      'A': { scoreRange: '90 - 100', usGPA: 4.0 },
      'A-': { scoreRange: '80 - 89.99', usGPA: 3.7 },
      'B': { scoreRange: '65 - 79.99', usGPA: 3.0 },
      'C': { scoreRange: '50 - 64.99', usGPA: 2.0 },
      'D': { scoreRange: '35 - 49.99', usGPA: 1.0 },
      'F': { scoreRange: '0 - 34.99', usGPA: 0.0 }
    },
    university_scale_b: {
      'A': { scoreRange: '85 - 100', usGPA: 4.0 },
      'A-': { scoreRange: '80 - 84.99', usGPA: 3.7 },
      'B': { scoreRange: '65 - 79.99', usGPA: 3.0 },
      'C': { scoreRange: '50 - 64.99', usGPA: 2.0 },
      'D': { scoreRange: '30 - 49.99', usGPA: 1.0 },
      'F': { scoreRange: '0 - 29.99', usGPA: 0.0 }
    },
    university_scale_c: {
      'A': { scoreRange: '85 - 100', usGPA: 4.0 },
      'A-': { scoreRange: '80 - 84.99', usGPA: 3.7 },
      'B+': { scoreRange: '75 - 79.99', usGPA: 3.3 },
      'B': { scoreRange: '70 - 74.99', usGPA: 3.0 },
      'B-': { scoreRange: '65 - 69.99', usGPA: 2.7 },
      'C+': { scoreRange: '60 - 64.99', usGPA: 2.3 },
      'C': { scoreRange: '55 - 59.99', usGPA: 2.0 },
      'D': { scoreRange: '30 - 54.99', usGPA: 1.0 },
      'F': { scoreRange: '0 - 29.99', usGPA: 0.0 }
    }
  },
  equatorial_guinea: {
    common_university: {
      'A': { scoreRange: '9 - 10', usGPA: 4.0 },
      'B': { scoreRange: '7 - 8', usGPA: 3.0 },
      'C': { scoreRange: '5 - 6', usGPA: 2.0 },
      'D': { scoreRange: '0 - 4', usGPA: 0.0 }
    },
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
  eritrea: {
    university_level: {
      'A': { scoreRange: '90-100', usGPA: 4.0 },
      'B': { scoreRange: '70-89', usGPA: 3.0 },
      'C': { scoreRange: '50-69', usGPA: 2.0 },
      'D': { scoreRange: '40-49', usGPA: 1.0 },
      'F': { scoreRange: '0-39', usGPA: 0.0 }
    }
  },
  swaziland: {
    common_university: {
      'A': { scoreRange: '80-100', usGPA: 4.0 },
      'B': { scoreRange: '70-79', usGPA: 3.0 },
      'C': { scoreRange: '50-69', usGPA: 2.0 },
      'D': { scoreRange: '40-49', usGPA: 1.0 },
      'F': { scoreRange: '0-39', usGPA: 0.0 }
    }
  },
  ethiopia: {
    university_level: {
      'A+': { scoreRange: '90-100', usGPA: 4.0 },
      'A': { scoreRange: '85-89', usGPA: 4.0 },
      'A-': { scoreRange: '80-84', usGPA: 3.7 },
      'B+': { scoreRange: '75-79', usGPA: 3.3 },
      'B': { scoreRange: '70-74', usGPA: 3.0 },
      'B-': { scoreRange: '65-69', usGPA: 2.7 },
      'C+': { scoreRange: '60-64', usGPA: 2.3 },
      'C': { scoreRange: '55-59', usGPA: 2.0 },
      'C-': { scoreRange: '50-54', usGPA: 1.7 },
      'D': { scoreRange: '45-49', usGPA: 1.0 },
      'P': { scoreRange: '40-44', usGPA: 1.0 },
      'F': { scoreRange: '0-39', usGPA: 0.0 }
    }
  },
  gabon: {
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
  gambia: {
    university_level: {
      'A+': { scoreRange: '90-100', usGPA: 4.0 },
      'A': { scoreRange: '85-89', usGPA: 4.0 },
      'A-': { scoreRange: '80-84', usGPA: 3.7 },
      'B+': { scoreRange: '75-79', usGPA: 3.3 },
      'B': { scoreRange: '70-74', usGPA: 3.0 },
      'B-': { scoreRange: '65-69', usGPA: 2.7 },
      'C+': { scoreRange: '60-64', usGPA: 2.3 },
      'C': { scoreRange: '55-59', usGPA: 2.0 },
      'C-': { scoreRange: '50-54', usGPA: 1.7 },
      'D': { scoreRange: '40-49', usGPA: 1.0 },
      'F': { scoreRange: '0-39', usGPA: 0.0 }
    }
  },
  ghana: {
    university: {
      'A+': { scoreRange: '80-100', usGPA: 4.0 },
      'A': { scoreRange: '80-100', usGPA: 4.0 },
      'A-': { scoreRange: '75-79', usGPA: 3.7 },
      'B+': { scoreRange: '75-79.99', usGPA: 3.3 },
      'B': { scoreRange: '70-74.99', usGPA: 3.0 },
      'B-': { scoreRange: '65-69', usGPA: 2.7 },
      'C+': { scoreRange: '65-69.99', usGPA: 2.3 },
      'C': { scoreRange: '60-64.99', usGPA: 2.0 },
      'C-': { scoreRange: '55-59', usGPA: 1.7 },
      'D+': { scoreRange: '55-59', usGPA: 1.3 },
      'D': { scoreRange: '50-54.99', usGPA: 1.0 },
      'D-': { scoreRange: '45-49', usGPA: 0.7 },
      'F': { scoreRange: '0-49.99', usGPA: 0.0 }
    },
    kwame_nkrumah_university: {
      'A': { scoreRange: '70.00 - 100.00', usGPA: 4.0 },
      'B': { scoreRange: '60.00 - 69.99', usGPA: 3.0 },
      'C': { scoreRange: '50.00 - 59.99', usGPA: 2.0 },
      'D': { scoreRange: '40.00 - 49.99', usGPA: 1.0 },
      'F': { scoreRange: '0.00 - 39.99', usGPA: 0.0 }
    }
  },
  guinea: {
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
  guinea_bissau: {
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
  ivory_coast: {
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
  kenya: {
    common_university: {
      'A': { scoreRange: '70 - 100', usGPA: 4.0 },
      'A-': { scoreRange: '65 - 69.99', usGPA: 3.7 },
      'B+': { scoreRange: '60 - 64.99', usGPA: 3.3 },
      'B': { scoreRange: '50 - 59.99', usGPA: 3.0 },
      'C+': { scoreRange: '45 - 49.99', usGPA: 2.7 },
      'C': { scoreRange: '40 - 44.99', usGPA: 2.0 },
      'F': { scoreRange: '0 - 39.99', usGPA: 0.0 }
    },
    university_grading: {
      'A': { scoreRange: '70 - 100', usGPA: 4.0 },
      'B': { scoreRange: '60 - 69', usGPA: 3.0 },
      'C': { scoreRange: '50 - 59', usGPA: 2.0 },
      'D': { scoreRange: '40 - 49', usGPA: 1.0 },
      'E': { scoreRange: '0 - 39', usGPA: 0.0 }
    }
  },
  lesotho: {
    common_university: {
      'A': { scoreRange: '75 - 100', usGPA: 4.0 },
      'B': { scoreRange: '67 - 74', usGPA: 3.3 },
      'C': { scoreRange: '60 - 66', usGPA: 2.7 },
      'D': { scoreRange: '50 - 59', usGPA: 2.0 },
      'F': { scoreRange: '0 - 49', usGPA: 0.0 }
    }
  },
  liberia: {
    common_university: {
      'A': { scoreRange: '90 - 100', usGPA: 4.0 },
      'B': { scoreRange: '80 - 89', usGPA: 3.0 },
      'C': { scoreRange: '70 - 79', usGPA: 2.0 },
      'D': { scoreRange: '60 - 69', usGPA: 1.0 },
      'F': { scoreRange: '0 - 59', usGPA: 0.0 }
    }
  },
  libya: {
    common_university: {
      'A': { scoreRange: '85 - 100', usGPA: 4.0 },
      'B': { scoreRange: '75 - 84.99', usGPA: 3.7 },
      'C': { scoreRange: '65 - 74.99', usGPA: 3.3 },
      'D': { scoreRange: '50 - 64.99', usGPA: 2.7 },
      'E': { scoreRange: '35 - 49.99', usGPA: 2.0 },
      'F': { scoreRange: '0 - 34.99', usGPA: 0.0 }
    }
  },
  madagascar: {
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
  malawi: {
    post_secondary: {
      'A': { scoreRange: '75 - 100', usGPA: 4.0 },
      'B': { scoreRange: '70 - 74', usGPA: 3.7 },
      'C': { scoreRange: '60 - 69', usGPA: 3.3 },
      'D': { scoreRange: '50 - 59', usGPA: 2.7 },
      'E': { scoreRange: '40 - 49', usGPA: 2.3 },
      'F': { scoreRange: '35 - 39', usGPA: 2.0 },
      'G': { scoreRange: '0 - 34', usGPA: 0.0 }
    }
  },
  mali: {
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
  mauritania: {
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
  mauritius: {
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
  morocco: {
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
  mozambique: {
    common_university: {
      'A': { scoreRange: '15 - 20', usGPA: 4.0 },
      'B': { scoreRange: '12 - 14.99', usGPA: 3.7 },
      'C': { scoreRange: '10 - 11', usGPA: 3.0 },
      'F': { scoreRange: '0 - 9.99', usGPA: 0.0 }
    }
  },
  namibia: {
    university_grading: {
      'A': { scoreRange: '80 - 100', usGPA: 4.0 },
      'B': { scoreRange: '70 - 79.99', usGPA: 3.0 },
      'C': { scoreRange: '60 - 69.99', usGPA: 2.0 },
      'D': { scoreRange: '50 - 59.99', usGPA: 1.0 },
      'F': { scoreRange: '0 - 49.99', usGPA: 0.0 }
    }
  },
  niger: {
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
    },
    university_of_nigeria_nsukka: {
      'A': { scoreRange: '70-100', usGPA: 4.0 },
      'B': { scoreRange: '60-69', usGPA: 3.0 },
      'C': { scoreRange: '50-59', usGPA: 2.0 },
      'D': { scoreRange: '45-49', usGPA: 1.5 },
      'E': { scoreRange: '40-44', usGPA: 1.0 },
      'F': { scoreRange: '0-39', usGPA: 0.0 }
    },
    obafemi_awolowo_university: {
      'A': { scoreRange: '70-100', usGPA: 4.0 },
      'B+': { scoreRange: '60-69', usGPA: 3.5 },
      'B': { scoreRange: '50-59', usGPA: 3.0 },
      'C': { scoreRange: '45-49', usGPA: 2.0 },
      'D': { scoreRange: '40-44.99', usGPA: 1.0 },
      'F': { scoreRange: '0-39.99', usGPA: 0.0 }
    }
  },
  rwanda: {
    common_francophone: {
      'THF': { scoreRange: '18 - 20', usGPA: 4.0 },
      'TB': { scoreRange: '16 - 17.99', usGPA: 3.7 },
      'B': { scoreRange: '14 - 15.99', usGPA: 3.3 },
      'AB': { scoreRange: '12 - 13.99', usGPA: 3.0 },
      'P': { scoreRange: '10 - 11.99', usGPA: 2.7 },
      'CP': { scoreRange: 'Nil', usGPA: 2.3 },
      'S': { scoreRange: 'Nil', usGPA: 2.0 },
      'E': { scoreRange: '0 - 9.99', usGPA: 0.0 }
    },
    common_post_secondary: {
      'A': { scoreRange: '90 - 100', usGPA: 4.0 },
      'B': { scoreRange: '80 - 89.99', usGPA: 3.7 },
      'C': { scoreRange: '70 - 79.99', usGPA: 3.3 },
      'D': { scoreRange: '50 - 69.99', usGPA: 2.7 },
      'F': { scoreRange: '0 - 49', usGPA: 0.0 }
    }
  },
  sao_tome_and_principe: {
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
  senegal: {
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
  seychelles: {
    common_university: {
      'A': { scoreRange: '80-100', usGPA: 4.0 },
      'B': { scoreRange: '70-79', usGPA: 3.0 },
      'C': { scoreRange: '50-69', usGPA: 2.0 },
      'D': { scoreRange: '40-49', usGPA: 1.0 },
      'E': { scoreRange: '30-39', usGPA: 0.5 },
      'F': { scoreRange: '0-29', usGPA: 0.0 }
    }
  },
  sierra_leone: {
    university_of_sierra_leone: {
      'A': { scoreRange: '70 - 100', usGPA: 4.0 },
      'B+': { scoreRange: '60 - 69', usGPA: 3.3 },
      'B': { scoreRange: '50 - 59', usGPA: 3.0 },
      'C+': { scoreRange: '45 - 49', usGPA: 2.7 },
      'C': { scoreRange: '40 - 44', usGPA: 2.0 },
      'D': { scoreRange: '35 - 39', usGPA: 1.7 },
      'E': { scoreRange: '30 - 34', usGPA: 1.0 },
      'F': { scoreRange: '0 - 29', usGPA: 0.0 }
    }
  },
  somalia: {
    common_university: {
      'A': { scoreRange: '90-100', usGPA: 4.0 },
      'B': { scoreRange: '80-89', usGPA: 3.0 },
      'C': { scoreRange: '70-79', usGPA: 2.0 },
      'D': { scoreRange: '60-69', usGPA: 1.0 },
      'F': { scoreRange: '0-59', usGPA: 0.0 }
    },
    gollis_university: {
      'A+': { scoreRange: '96 - 100', usGPA: 4.0 },
      'A': { scoreRange: '91 - 95', usGPA: 3.7 },
      'A-': { scoreRange: '86 - 90', usGPA: 3.3 },
      'B+': { scoreRange: '80 - 85', usGPA: 3.0 },
      'B': { scoreRange: '75 - 79', usGPA: 2.7 },
      'B-': { scoreRange: '70 - 74', usGPA: 2.3 },
      'C+': { scoreRange: '65 - 69', usGPA: 2.0 },
      'C': { scoreRange: '60 - 64', usGPA: 1.7 },
      'C-': { scoreRange: '55 - 59', usGPA: 1.3 },
      'D': { scoreRange: '50 - 54', usGPA: 1.0 },
      'F': { scoreRange: '0 - 49.99', usGPA: 0.0 }
    }
  },
  south_africa: {
    helderberg_college: {
      'A': { scoreRange: '80 - 100', usGPA: 4.0 },
      'A-': { scoreRange: '75 - 79.99', usGPA: 3.7 },
      'B+': { scoreRange: '70 - 74.99', usGPA: 3.3 },
      'B': { scoreRange: '65 - 69.99', usGPA: 3.0 },
      'B-': { scoreRange: '60 - 64.99', usGPA: 2.7 },
      'C+': { scoreRange: '55 - 59.99', usGPA: 2.3 },
      'C': { scoreRange: '50 - 54.99', usGPA: 2.0 },
      'C-': { scoreRange: '46 - 49.99', usGPA: 1.7 },
      'D': { scoreRange: '40 - 45.99', usGPA: 1.3 },
      'S': { scoreRange: 'Nil', usGPA: 0.0 },
      'F': { scoreRange: '0 - 39.99', usGPA: 0.0 }
    }
  },
  south_sudan: {
    university_of_juba: {
      'A': { scoreRange: '80 - 100', usGPA: 4.0 },
      'B+': { scoreRange: '70 - 79', usGPA: 3.3 },
      'B': { scoreRange: '60 - 69', usGPA: 3.0 },
      'C+': { scoreRange: '55 - 59', usGPA: 2.7 },
      'C': { scoreRange: '50 - 54', usGPA: 2.3 },
      'D': { scoreRange: '40 - 49', usGPA: 2.0 },
      'F': { scoreRange: '0 - 39', usGPA: 0.0 }
    }
  },
  sudan: {
    university_of_khartoum: {
      'A': { scoreRange: '70 - 100', usGPA: 4.0 },
      'B': { scoreRange: '60 - 69', usGPA: 3.0 },
      'C': { scoreRange: '50 - 59', usGPA: 2.0 },
      'D': { scoreRange: '40 - 49', usGPA: 1.0 },
      'F': { scoreRange: '0 - 39', usGPA: 0.0 }
    },
    sudan_university_of_science_and_technology: {
      'A+': { scoreRange: '3.6 - 4', usGPA: 4.0 },
      'A': { scoreRange: '3.2 - 3.5', usGPA: 3.7 },
      'B+': { scoreRange: '2.8 - 3.1', usGPA: 3.3 },
      'B': { scoreRange: '2.6 - 2.7', usGPA: 3.0 },
      'C+': { scoreRange: '2.4 - 2.5', usGPA: 2.7 },
      'C': { scoreRange: '2 - 2.3', usGPA: 2.3 },
      'D': { scoreRange: '1.7 - 1.9', usGPA: 1.7 },
      'F': { scoreRange: '0', usGPA: 0.0 }
    }
  },
  tanzania: {
    common_university: {
      'A': { scoreRange: '70 - 100', usGPA: 4.0 },
      'B': { scoreRange: '60 - 69', usGPA: 3.0 },
      'C': { scoreRange: '50 - 59', usGPA: 2.0 },
      'D': { scoreRange: '40 - 49', usGPA: 1.0 },
      'F': { scoreRange: '0 - 39', usGPA: 0.0 }
    },
    five_point_grading: {
      'A': { scoreRange: '5', usGPA: 5.0 },
      'B+': { scoreRange: '4.5 - 4.99', usGPA: 4.5 },
      'B': { scoreRange: '4 - 4.49', usGPA: 4.0 },
      'C+': { scoreRange: '3.5 - 3.99', usGPA: 3.5 },
      'C': { scoreRange: '3 - 3.49', usGPA: 3.0 },
      'D': { scoreRange: '2 - 2.99', usGPA: 2.0 },
      'E': { scoreRange: '1 - 1.99', usGPA: 1.0 },
      'S': { scoreRange: '0.5 - 0.99', usGPA: 0.5 },
      'F': { scoreRange: '0', usGPA: 0.0 }
    }
  },
  togo: {
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
  tunisia: {
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
  uganda: {
    makerere_university: {
      'A': { scoreRange: '80 - 100', usGPA: 4.0 },
      'B+': { scoreRange: '70 - 79.9', usGPA: 3.5 },
      'B': { scoreRange: '60 - 69.9', usGPA: 3.0 },
      'C': { scoreRange: '50 - 59.9', usGPA: 2.0 },
      'D': { scoreRange: '45 - 49.9', usGPA: 1.0 },
      'E': { scoreRange: '0 - 44.9', usGPA: 0.0 }
    },
    nine_point_grading: {
      'A': { scoreRange: '1 - 2.99', usGPA: 4.0 },
      'B': { scoreRange: '3 - 4.99', usGPA: 3.0 },
      'C': { scoreRange: '5 - 6.99', usGPA: 2.0 },
      'D': { scoreRange: '7 - 7.99', usGPA: 1.0 },
      'E': { scoreRange: '8 - 8.99', usGPA: 0.5 },
      'F': { scoreRange: '9', usGPA: 0.0 }
    }
  },
  zambia: {
    unicaf_university: {
      'A': { scoreRange: '93 - 100', usGPA: 4.0 },
      'A-': { scoreRange: '90 - 92.99', usGPA: 3.7 },
      'B+': { scoreRange: '87 - 89.99', usGPA: 3.5 },
      'B': { scoreRange: '83 - 86.99', usGPA: 3.3 },
      'B-': { scoreRange: '80 - 82.99', usGPA: 3.0 },
      'C+': { scoreRange: '77 - 79.99', usGPA: 2.7 },
      'C': { scoreRange: '73 - 76.99', usGPA: 2.3 },
      'C-': { scoreRange: '70 - 72.99', usGPA: 2.0 },
      'D+': { scoreRange: '67 - 69.99', usGPA: 1.7 },
      'D': { scoreRange: '63 - 66.99', usGPA: 1.5 },
      'D-': { scoreRange: '60 - 62.99', usGPA: 1.0 },
      'F': { scoreRange: '0 - 59.99', usGPA: 0.0 }
    }
  },
  zimbabwe: {
    chinhoyi_university_of_technology: {
      'A+': { scoreRange: '91 - 100', usGPA: 4.0 },
      'A': { scoreRange: '81 - 90', usGPA: 3.7 },
      'A-': { scoreRange: '75 - 80', usGPA: 3.3 },
      'B+': { scoreRange: '70 - 74', usGPA: 3.0 },
      'B': { scoreRange: '65 - 69', usGPA: 2.7 },
      'B-': { scoreRange: '60 - 64', usGPA: 2.3 },
      'C+': { scoreRange: '56 - 59', usGPA: 2.0 },
      'C': { scoreRange: '53 - 55', usGPA: 1.7 },
      'C-': { scoreRange: '50 - 52', usGPA: 1.3 },
      'F': { scoreRange: '0 - 49', usGPA: 0.0 }
    },
    great_zimbabwe_university: {
      '1': { scoreRange: '75 - 100', usGPA: 4.0 },
      '2.1': { scoreRange: '65 - 74.99', usGPA: 3.7 },
      '2.2': { scoreRange: '60 - 64.99', usGPA: 3.3 },
      '3': { scoreRange: '50 - 59.99', usGPA: 2.0 },
      'F': { scoreRange: '0 - 49.99', usGPA: 0.0 }
    }
  }
};
export function getAfricanCountryGradingSystems(country: string) {
  const countryKey = country.toLowerCase().replace(/\s+/g, '_');
  return africanGradingSystems[countryKey as keyof typeof africanGradingSystems] || {};
}

export function getAfricanGradingSystem(country: string, systemName: string) {
  const countrySystems = getAfricanCountryGradingSystems(country);
  return countrySystems[systemName as keyof typeof countrySystems] || null;
} 