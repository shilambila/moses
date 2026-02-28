/**
 * Utility functions to parse additional registration data stored in the user_id field
 * This is a temporary solution until the database schema is expanded
 */

export interface AdditionalRegistrationData {
  country?: string;
  paymentReference?: string;
  spouse?: {
    name: string;
    idNumber: string;
    phone: string;
    altPhone: string;
    sex: string;
    areaOfResidence: string;
    photoUrl?: string;
  } | null;
  parent2?: {
    name: string;
    idNumber: string;
    phone: string;
    altPhone: string;
    areaOfResidence: string;
  } | null;
  children?: Array<{
    name: string;
    dob: string;
    age: string;
  }> | null;
  registrationTimestamp?: string;
}

export interface ParsedRegistrationData {
  basicInfo: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    membership_type: string;
    id_number: string;
    alternative_phone: string;
    sex: string;
    marital_status: string;
    profile_picture_url: string;
    [key: string]: any;
  };
  additionalInfo: AdditionalRegistrationData | null;
}

/**
 * Parse the additional registration data from the user_id field
 */
export function parseAdditionalRegistrationData(userIdField: string | null): AdditionalRegistrationData | null {
  if (!userIdField) return null;
  
  try {
    // Check if it's a UUID (normal user_id) or JSON data
    if (userIdField.length === 36 && userIdField.includes('-')) {
      // It's a UUID, no additional data
      return null;
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(userIdField) as AdditionalRegistrationData;
    return parsed;
  } catch (error) {
    console.error('Failed to parse additional registration data:', error);
    return null;
  }
}

/**
 * Get comprehensive registration data combining basic and additional info
 */
export function getCompleteRegistrationData(registrationRecord: any): ParsedRegistrationData {
  const additionalInfo = parseAdditionalRegistrationData(registrationRecord.user_id);
  
  return {
    basicInfo: {
      first_name: registrationRecord.first_name,
      last_name: registrationRecord.last_name,
      email: registrationRecord.email,
      phone: registrationRecord.phone,
      address: registrationRecord.address,
      city: registrationRecord.city,
      state: registrationRecord.state,
      emergency_contact_name: registrationRecord.emergency_contact_name,
      emergency_contact_phone: registrationRecord.emergency_contact_phone,
      membership_type: registrationRecord.membership_type,
      id_number: registrationRecord.id_number,
      alternative_phone: registrationRecord.alternative_phone,
      sex: registrationRecord.sex,
      marital_status: registrationRecord.marital_status,
      profile_picture_url: registrationRecord.profile_picture_url,
      registration_status: registrationRecord.registration_status,
      payment_status: registrationRecord.payment_status,
      created_at: registrationRecord.created_at,
      tns_number: registrationRecord.tns_number,
    },
    additionalInfo
  };
}

/**
 * Format registration data for display in admin interfaces
 */
export function formatRegistrationDataForDisplay(registrationRecord: any): string {
  const completeData = getCompleteRegistrationData(registrationRecord);
  const { basicInfo, additionalInfo } = completeData;
  
  let formatted = `
=== MEMBER REGISTRATION DATA ===
Name: ${basicInfo.first_name} ${basicInfo.last_name}
Email: ${basicInfo.email}
Phone: ${basicInfo.phone}
ID Number: ${basicInfo.id_number}
Address: ${basicInfo.address}
City: ${basicInfo.city}, ${basicInfo.state}
Sex: ${basicInfo.sex}
Marital Status: ${basicInfo.marital_status}
Membership Type: ${basicInfo.membership_type}
Registration Status: ${basicInfo.registration_status}
Payment Status: ${basicInfo.payment_status}
TNS Number: ${basicInfo.tns_number || 'Not assigned'}
`;

  if (additionalInfo) {
    formatted += `
=== ADDITIONAL INFORMATION ===
Country: ${additionalInfo.country || 'Not specified'}
Payment Reference: ${additionalInfo.paymentReference || 'Not provided'}
Registration Date: ${additionalInfo.registrationTimestamp ? new Date(additionalInfo.registrationTimestamp).toLocaleString() : 'Unknown'}
`;

    if (additionalInfo.spouse) {
      formatted += `
--- SPOUSE INFORMATION ---
Name: ${additionalInfo.spouse.name}
ID Number: ${additionalInfo.spouse.idNumber}
Phone: ${additionalInfo.spouse.phone}
Alt Phone: ${additionalInfo.spouse.altPhone || 'None'}
Sex: ${additionalInfo.spouse.sex}
Area: ${additionalInfo.spouse.areaOfResidence}
Photo: ${additionalInfo.spouse.photoUrl ? 'Available' : 'None'}
`;
    }

    if (additionalInfo.parent2) {
      formatted += `
--- PARENT 2 INFORMATION ---
Name: ${additionalInfo.parent2.name}
ID Number: ${additionalInfo.parent2.idNumber}
Phone: ${additionalInfo.parent2.phone}
Alt Phone: ${additionalInfo.parent2.altPhone || 'None'}
Area: ${additionalInfo.parent2.areaOfResidence}
`;
    }

    if (additionalInfo.children && additionalInfo.children.length > 0) {
      formatted += `
--- CHILDREN INFORMATION ---
Number of Children: ${additionalInfo.children.length}
`;
      additionalInfo.children.forEach((child, index) => {
        formatted += `
Child ${index + 1}: ${child.name} (Age: ${child.age}, DOB: ${child.dob})
`;
      });
    }
  }

  return formatted;
}

/**
 * Extract payment reference from additional data
 */
export function getPaymentReference(registrationRecord: any): string | null {
  const additionalInfo = parseAdditionalRegistrationData(registrationRecord.user_id);
  return additionalInfo?.paymentReference || null;
}

/**
 * Check if member has spouse information
 */
export function hasSpouseInfo(registrationRecord: any): boolean {
  const additionalInfo = parseAdditionalRegistrationData(registrationRecord.user_id);
  return !!(additionalInfo?.spouse);
}

/**
 * Get children count from additional data
 */
export function getChildrenCount(registrationRecord: any): number {
  const additionalInfo = parseAdditionalRegistrationData(registrationRecord.user_id);
  return additionalInfo?.children?.length || 0;
}
