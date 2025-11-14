export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): boolean => {
  // Stricter email validation:
  // - Must not start or end with a dot
  // - No consecutive dots
  // - Allows alphanumeric, dots, hyphens, underscores, and plus signs
  // - Must have valid domain with at least one dot
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._+-]*[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
  
  // Additional checks for edge cases
  if (!email || email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return false;
  }
  
  // Special case: single character before @ is valid (e.g., a@example.com)
  if (/^[a-zA-Z0-9+]@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(email)) {
    return true;
  }
  
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Remove common phone formatting characters
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Must be at least 10 digits (North American standard)
  // Optional + prefix for international
  // Must start with non-zero digit
  const phoneRegex = /^[+]?[1-9][\d]{9,15}$/;
  
  return phoneRegex.test(cleaned);
};

export const validatePostalCode = (postalCode: string): boolean => {
  const canadianPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return canadianPostalRegex.test(postalCode);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return start >= today && end > start;
};

export const validateBookingForm = (formData: {
  startDate: string;
  endDate: string;
  deliveryAddress: string;
  deliveryCity: string;
  customerEmail: string;
  customerName: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate dates
  if (!formData.startDate) {
    errors.startDate = 'Start date is required';
  } else if (!validateDateRange(formData.startDate, formData.endDate)) {
    errors.startDate = 'Start date must be today or later';
  }

  if (!formData.endDate) {
    errors.endDate = 'End date is required';
  } else if (
    formData.startDate &&
    formData.endDate &&
    new Date(formData.endDate) <= new Date(formData.startDate)
  ) {
    errors.endDate = 'End date must be after start date';
  }

  // Validate delivery information
  if (!validateRequired(formData.deliveryAddress)) {
    errors.deliveryAddress = 'Delivery address is required';
  }

  if (!validateRequired(formData.deliveryCity)) {
    errors.deliveryCity = 'Please select a delivery area';
  }

  // Validate customer information
  if (!validateRequired(formData.customerName)) {
    errors.customerName = 'Customer name is required';
  }

  if (!validateRequired(formData.customerEmail)) {
    errors.customerEmail = 'Email address is required';
  } else if (!validateEmail(formData.customerEmail)) {
    errors.customerEmail = 'Please enter a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateGuestForm = (guestData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!validateRequired(guestData.firstName)) {
    errors.firstName = 'First name is required';
  }

  if (!validateRequired(guestData.lastName)) {
    errors.lastName = 'Last name is required';
  }

  if (!validateRequired(guestData.email)) {
    errors.email = 'Email address is required';
  } else if (!validateEmail(guestData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (guestData.phone && !validatePhone(guestData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
