/**
 * Work & Stay data for each country on the platform.
 * Country-level data — same for all programs in that country.
 * Sources: official government immigration websites, verified May 2026.
 */

export interface WorkAndStayData {
  country: string;
  flag: string;
  studentWorkRights: {
    hoursPerWeek: number;
    notes: string;
  };
  postStudyVisa: {
    duration: string; // e.g. "18 months"
    name: string;     // official name
    notes: string;
  };
  pathToPR: {
    yearsRequired: number;
    notes: string;
  };
  averageGraduateSalary: {
    amount: string;   // e.g. "€45,000"
    currency: string;
    notes: string;
  };
  studentMinWage: {
    amount: string;
    per: string;      // "hour" | "month"
    notes: string;
  };
  officialLink: string;
}

export const WORK_AND_STAY: Record<string, WorkAndStayData> = {
  Germany: {
    country: 'Germany',
    flag: '🇩🇪',
    studentWorkRights: {
      hoursPerWeek: 20,
      notes: 'Up to 20 hours/week during term. Full-time during semester breaks (90 full days or 180 half days per year).'
    },
    postStudyVisa: {
      duration: '18 months',
      name: 'Job Seeker Visa (§20 AufenthG)',
      notes: 'Stay 18 months after graduation to find a job matching your qualification. No job offer needed to apply.'
    },
    pathToPR: {
      yearsRequired: 2,
      notes: 'Permanent residency (Niederlassungserlaubnis) possible after 2 years of skilled employment. EU Blue Card holders may qualify after 21 months.'
    },
    averageGraduateSalary: {
      amount: '€45,000',
      currency: 'EUR',
      notes: 'Average starting salary for international graduates. Tech, engineering, and finance roles typically higher.'
    },
    studentMinWage: {
      amount: '€12.82',
      per: 'hour',
      notes: 'National minimum wage applies to student workers. Most student jobs pay €13–€16/hour.'
    },
    officialLink: 'https://www.make-it-in-germany.com/en/visa-residence/types/job-seeker-visa'
  },

  France: {
    country: 'France',
    flag: '🇫🇷',
    studentWorkRights: {
      hoursPerWeek: 20,
      notes: 'Up to 964 hours per year (roughly 20 hours/week). Work permit included in student visa.'
    },
    postStudyVisa: {
      duration: '12 months',
      name: 'APS (Autorisation Provisoire de Séjour)',
      notes: 'One-year temporary stay permit after graduation to find work. Renewable once. Must have Master\'s or higher.'
    },
    pathToPR: {
      yearsRequired: 5,
      notes: 'Permanent residency after 5 years of legal residence. Talent Passport holders may qualify faster.'
    },
    averageGraduateSalary: {
      amount: '€35,000',
      currency: 'EUR',
      notes: 'Average starting salary. Paris-based roles typically 20–30% higher. Tech sector averages €42,000+.'
    },
    studentMinWage: {
      amount: '€11.88',
      per: 'hour',
      notes: 'SMIC (minimum wage) applies. Student jobs in hospitality and retail typically pay minimum wage.'
    },
    officialLink: 'https://www.service-public.fr/particuliers/vosdroits/F16922'
  },

  Sweden: {
    country: 'Sweden',
    flag: '🇸🇪',
    studentWorkRights: {
      hoursPerWeek: 999, // unlimited
      notes: 'No hour restrictions for non-EU students on a student residence permit. Work as much as you want alongside studies.'
    },
    postStudyVisa: {
      duration: '12 months',
      name: 'Post-Study Work Permit',
      notes: 'One-year work permit after completing a degree of at least 2 years. Must apply before student permit expires.'
    },
    pathToPR: {
      yearsRequired: 4,
      notes: 'Permanent residency after 4 years of continuous residence. Skilled workers may qualify after 2 years.'
    },
    averageGraduateSalary: {
      amount: 'SEK 35,000',
      currency: 'SEK',
      notes: 'Approx. €3,000/month. Tech and engineering roles average SEK 45,000–55,000/month.'
    },
    studentMinWage: {
      amount: 'SEK 130',
      per: 'hour',
      notes: 'No statutory minimum wage in Sweden. Collective agreements set rates. Most student jobs pay SEK 120–160/hour.'
    },
    officialLink: 'https://www.migrationsverket.se/English/Private-individuals/Working-in-Sweden/Employed/After-your-studies.html'
  },

  Poland: {
    country: 'Poland',
    flag: '🇵🇱',
    studentWorkRights: {
      hoursPerWeek: 999, // unlimited
      notes: 'EU student visa holders can work without restrictions. Non-EU students can work up to 20 hours/week on a student visa.'
    },
    postStudyVisa: {
      duration: '12 months',
      name: 'Temporary Residence Permit for Job Search',
      notes: 'One-year permit to stay and find work after graduation. Must apply within 30 days of graduation.'
    },
    pathToPR: {
      yearsRequired: 5,
      notes: 'Permanent residency after 5 years of continuous legal residence.'
    },
    averageGraduateSalary: {
      amount: 'PLN 6,500',
      currency: 'PLN',
      notes: 'Approx. €1,500/month. Warsaw tech sector averages PLN 10,000–15,000/month for software roles.'
    },
    studentMinWage: {
      amount: 'PLN 30.50',
      per: 'hour',
      notes: 'National minimum wage. Most student jobs in Warsaw pay PLN 25–35/hour.'
    },
    officialLink: 'https://www.gov.pl/web/mswia-en/temporary-residence-permit'
  },

  Austria: {
    country: 'Austria',
    flag: '🇦🇹',
    studentWorkRights: {
      hoursPerWeek: 20,
      notes: 'Up to 20 hours/week. Requires registration with the Public Employment Service (AMS).'
    },
    postStudyVisa: {
      duration: '12 months',
      name: 'Red-White-Red Card (Job Seeker)',
      notes: 'One-year permit to find skilled employment after graduation. Must have Austrian degree.'
    },
    pathToPR: {
      yearsRequired: 5,
      notes: 'Settlement permit after 5 years. Red-White-Red Card holders can apply for permanent settlement after 2 years of employment.'
    },
    averageGraduateSalary: {
      amount: '€40,000',
      currency: 'EUR',
      notes: 'Average starting salary. Vienna-based tech and finance roles typically €45,000–€60,000.'
    },
    studentMinWage: {
      amount: '€13.00',
      per: 'hour',
      notes: 'Minimum wage varies by sector under collective agreements. Most student jobs pay €12–€15/hour.'
    },
    officialLink: 'https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/red-white-red-card/'
  },

  Italy: {
    country: 'Italy',
    flag: '🇮🇹',
    studentWorkRights: {
      hoursPerWeek: 20,
      notes: 'Up to 20 hours/week (1,040 hours/year). Work permit included in student visa.'
    },
    postStudyVisa: {
      duration: '12 months',
      name: 'Job Seeking Permit',
      notes: 'One-year permit after graduation to find employment. Must apply before student permit expires.'
    },
    pathToPR: {
      yearsRequired: 5,
      notes: 'Long-term EU residence permit after 5 years of continuous legal residence.'
    },
    averageGraduateSalary: {
      amount: '€28,000',
      currency: 'EUR',
      notes: 'Average starting salary. Milan tech sector averages €35,000–€45,000. Lower than northern Europe but cost of living is also lower.'
    },
    studentMinWage: {
      amount: '€9.00',
      per: 'hour',
      notes: 'No statutory minimum wage. Collective agreements set rates. Most student jobs pay €8–€12/hour.'
    },
    officialLink: 'https://www.interno.gov.it/en/themes/immigration/types-residence-permits'
  },

  Czechia: {
    country: 'Czechia',
    flag: '🇨🇿',
    studentWorkRights: {
      hoursPerWeek: 999, // unlimited
      notes: 'No hour restrictions for students enrolled in Czech universities. Work permit not required.'
    },
    postStudyVisa: {
      duration: '9 months',
      name: 'Long-term Visa for Job Search',
      notes: 'Nine-month visa to find employment after graduation. Must apply within 60 days of graduation.'
    },
    pathToPR: {
      yearsRequired: 5,
      notes: 'Permanent residency after 5 years of continuous residence. EU Blue Card holders may qualify faster.'
    },
    averageGraduateSalary: {
      amount: 'CZK 45,000',
      currency: 'CZK',
      notes: 'Approx. €1,800/month. Prague tech sector averages CZK 70,000–100,000/month for software roles.'
    },
    studentMinWage: {
      amount: 'CZK 113',
      per: 'hour',
      notes: 'National minimum wage. Most student jobs in Prague pay CZK 130–180/hour.'
    },
    officialLink: 'https://www.mvcr.cz/mvcren/article/long-term-residence.aspx'
  },

  Lithuania: {
    country: 'Lithuania',
    flag: '🇱🇹',
    studentWorkRights: {
      hoursPerWeek: 20,
      notes: 'Up to 20 hours/week during term. Full-time during holidays.'
    },
    postStudyVisa: {
      duration: '12 months',
      name: 'Temporary Residence Permit for Job Search',
      notes: 'One-year permit to find employment after graduation.'
    },
    pathToPR: {
      yearsRequired: 5,
      notes: 'Permanent residency after 5 years of continuous legal residence.'
    },
    averageGraduateSalary: {
      amount: '€1,800',
      currency: 'EUR',
      notes: 'Average monthly salary. Vilnius tech sector averages €2,500–€4,000/month. Growing startup ecosystem.'
    },
    studentMinWage: {
      amount: '€5.65',
      per: 'hour',
      notes: 'National minimum wage. Most student jobs pay €6–€9/hour.'
    },
    officialLink: 'https://www.migracija.lt/en/'
  },

  Estonia: {
    country: 'Estonia',
    flag: '🇪🇪',
    studentWorkRights: {
      hoursPerWeek: 999, // unlimited
      notes: 'No hour restrictions. Students can work freely alongside studies.'
    },
    postStudyVisa: {
      duration: '9 months',
      name: 'Short-term Employment Visa / Residence Permit',
      notes: 'Nine-month permit to find work after graduation. Estonia has one of Europe\'s most digital-friendly immigration systems.'
    },
    pathToPR: {
      yearsRequired: 5,
      notes: 'Permanent residency after 5 years. Estonia\'s e-Residency program also opens digital business opportunities.'
    },
    averageGraduateSalary: {
      amount: '€2,000',
      currency: 'EUR',
      notes: 'Average monthly salary. Tallinn tech sector (one of Europe\'s strongest startup hubs) averages €3,000–€5,000/month.'
    },
    studentMinWage: {
      amount: '€4.86',
      per: 'hour',
      notes: 'National minimum wage. Most student jobs pay €6–€10/hour.'
    },
    officialLink: 'https://www.politsei.ee/en/instructions/residence-permit-for-studies'
  }
};

/**
 * Get work and stay data for a country.
 * Returns null if country not in our database.
 */
export function getWorkAndStay(country: string): WorkAndStayData | null {
  return WORK_AND_STAY[country] ?? null;
}
