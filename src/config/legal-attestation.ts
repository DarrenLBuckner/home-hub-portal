/**
 * Legal Attestation Configuration
 * Country-specific legal language for property ownership verification
 *
 * This configuration provides legally-appropriate language for each supported country,
 * referencing their specific laws regarding fraud and false statements.
 */

export interface AttestationConfig {
  countryName: string;
  lawReference: string;
  policeForce: string;
  additionalLaws: string;
}

export const ATTESTATION_CONFIG: Record<string, AttestationConfig> = {
  GY: {
    countryName: 'Guyana',
    lawReference: 'Criminal Law (Offences) Act Chapter 8:01',
    policeForce: 'Guyana Police Force',
    additionalLaws: 'Sections relating to fraud, forgery, and false pretenses'
  },
  JM: {
    countryName: 'Jamaica',
    lawReference: 'Larceny Act and the Forgery Act',
    policeForce: 'Jamaica Constabulary Force',
    additionalLaws: 'Cybercrime Act provisions'
  },
  TT: {
    countryName: 'Trinidad and Tobago',
    lawReference: 'Larceny Act Chapter 11:12',
    policeForce: 'Trinidad and Tobago Police Service',
    additionalLaws: 'Forgery Act provisions'
  },
  BB: {
    countryName: 'Barbados',
    lawReference: 'Theft Act Chapter 141',
    policeForce: 'Royal Barbados Police Force',
    additionalLaws: 'Forgery Act provisions'
  },
  BS: {
    countryName: 'Bahamas',
    lawReference: 'Penal Code Chapter 84',
    policeForce: 'Royal Bahamas Police Force',
    additionalLaws: 'Computer Misuse Act provisions'
  },
  KE: {
    countryName: 'Kenya',
    lawReference: 'Penal Code Chapter 63, Section 313 (Obtaining by False Pretenses)',
    policeForce: 'Kenya Police Service',
    additionalLaws: 'Computer Misuse and Cybercrimes Act'
  },
  NG: {
    countryName: 'Nigeria',
    lawReference: 'Criminal Code Act Chapter 77, Section 419 (Obtaining by False Pretenses)',
    policeForce: 'Nigeria Police Force',
    additionalLaws: 'Cybercrimes (Prohibition, Prevention, etc.) Act 2015'
  },
  GH: {
    countryName: 'Ghana',
    lawReference: 'Criminal Offences Act 1960 (Act 29), Section 131',
    policeForce: 'Ghana Police Service',
    additionalLaws: 'Electronic Transactions Act provisions'
  },
  ZA: {
    countryName: 'South Africa',
    lawReference: 'Prevention and Combating of Corrupt Activities Act 12 of 2004',
    policeForce: 'South African Police Service',
    additionalLaws: 'Electronic Communications and Transactions Act'
  },
  CO: {
    countryName: 'Colombia',
    lawReference: 'Codigo Penal Colombiano, Articulos 246-250 (Estafa)',
    policeForce: 'Policia Nacional de Colombia',
    additionalLaws: 'Ley 1273 de 2009 (Delitos informaticos)'
  }
};

/**
 * US Law reference - applies to all countries since Portal HomeHub
 * operates under US jurisdiction
 */
export const US_LAW_REFERENCE = '18 U.S.C. § 1343 (Wire Fraud)';

/**
 * Get attestation configuration for a specific country
 * Falls back to Guyana if country not found
 */
export function getAttestationConfig(countryCode: string): AttestationConfig & { usLaw: string } {
  const config = ATTESTATION_CONFIG[countryCode?.toUpperCase()] || ATTESTATION_CONFIG.GY;
  return {
    ...config,
    usLaw: US_LAW_REFERENCE
  };
}

/**
 * Generate the full attestation text for a given country
 */
export function getAttestationText(countryCode: string): {
  title: string;
  bulletPoints: string[];
  legalWarning: string;
  consentText: string;
  usJurisdictionText: string;
} {
  const config = getAttestationConfig(countryCode);

  return {
    title: 'I hereby declare under penalty of law that:',
    bulletPoints: [
      'I am the legal owner of this property, OR',
      'I am authorized by the legal owner to list this property'
    ],
    legalWarning: `I understand that providing false information is a criminal offense under the Laws of ${config.countryName}, including but not limited to the ${config.lawReference}, and may result in prosecution, fines, and imprisonment.`,
    consentText: `I consent to Portal HomeHub sharing my information with law enforcement authorities, including the ${config.policeForce}, if fraudulent activity is suspected.`,
    usJurisdictionText: `Additionally, as Portal HomeHub operates under United States jurisdiction, false representations may constitute wire fraud under ${config.usLaw} and other applicable federal laws.`
  };
}
