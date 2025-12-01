/**
 * Settings validation utilities
 * Provides client-side and server-side validation for all settings categories
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates CIDR notation for IP ranges
 * Format: 192.168.1.0/24
 */
export const validateIpRange = (ipRange: string): boolean => {
  if (!ipRange || !ipRange.trim()) return false;

  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(ipRange.trim())) return false;

  const [ip, prefix] = ipRange.trim().split('/');
  const prefixNum = parseInt(prefix, 10);

  if (prefixNum < 0 || prefixNum > 32) return false;

  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};

/**
 * Validates currency code (ISO 4217)
 */
export const validateCurrencyCode = (currency: string): boolean => {
  const validCurrencies = ['CAD', 'USD', 'EUR', 'GBP', 'AUD', 'JPY'];
  return validCurrencies.includes(currency.toUpperCase());
};

/**
 * Validates timezone identifier (IANA timezone database)
 */
export const validateTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates Stripe public key format
 */
export const validateStripePublicKey = (key: string): boolean => {
  if (!key || !key.trim()) return true; // Optional field
  return key.trim().startsWith('pk_');
};

/**
 * Validates Stripe secret key format
 */
export const validateStripeSecretKey = (key: string): boolean => {
  if (!key || !key.trim()) return true; // Optional field
  return key.trim().startsWith('sk_');
};

/**
 * Validates Google Maps API key format (basic check)
 */
export const validateGoogleMapsApiKey = (key: string): boolean => {
  if (!key || !key.trim()) return true; // Optional field
  // Google Maps API keys are alphanumeric and can contain hyphens/underscores
  return /^[A-Za-z0-9_-]{39,}$/.test(key.trim());
};

/**
 * Validates DocuSign Client ID format (basic check)
 */
export const validateDocuSignClientId = (clientId: string): boolean => {
  if (!clientId || !clientId.trim()) return true; // Optional field
  // DocuSign Client IDs are UUIDs
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId.trim());
};

/**
 * Validates pricing settings
 */
export const validatePricingSettings = (pricing: {
  baseDailyRate?: number;
  weekendMultiplier?: number;
  holidayMultiplier?: number;
  longTermDiscount?: number;
  depositPercentage?: number;
  lateFeePerDay?: number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (pricing.baseDailyRate !== undefined) {
    if (isNaN(pricing.baseDailyRate) || pricing.baseDailyRate <= 0) {
      errors.baseDailyRate = 'Base daily rate must be greater than 0';
    }
  }

  if (pricing.weekendMultiplier !== undefined) {
    if (isNaN(pricing.weekendMultiplier) || pricing.weekendMultiplier < 0 || pricing.weekendMultiplier > 5) {
      errors.weekendMultiplier = 'Weekend multiplier must be between 0 and 5';
    }
  }

  if (pricing.holidayMultiplier !== undefined) {
    if (isNaN(pricing.holidayMultiplier) || pricing.holidayMultiplier < 0 || pricing.holidayMultiplier > 5) {
      errors.holidayMultiplier = 'Holiday multiplier must be between 0 and 5';
    }
  }

  if (pricing.longTermDiscount !== undefined) {
    if (isNaN(pricing.longTermDiscount) || pricing.longTermDiscount < 0 || pricing.longTermDiscount > 1) {
      errors.longTermDiscount = 'Long-term discount must be between 0% and 100%';
    }
  }

  if (pricing.depositPercentage !== undefined) {
    if (isNaN(pricing.depositPercentage) || pricing.depositPercentage < 0 || pricing.depositPercentage > 1) {
      errors.depositPercentage = 'Deposit percentage must be between 0% and 100%';
    }
  }

  if (pricing.lateFeePerDay !== undefined) {
    if (isNaN(pricing.lateFeePerDay) || pricing.lateFeePerDay < 0) {
      errors.lateFeePerDay = 'Late fee per day must be 0 or greater';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates general settings
 */
export const validateGeneralSettings = (general: {
  maxBookingsPerDay?: number;
  defaultCurrency?: string;
  timezone?: string;
  siteName?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (general.maxBookingsPerDay !== undefined) {
    if (isNaN(general.maxBookingsPerDay) || general.maxBookingsPerDay <= 0 || !Number.isInteger(general.maxBookingsPerDay)) {
      errors.maxBookingsPerDay = 'Max bookings per day must be a positive integer';
    }
  }

  if (general.defaultCurrency !== undefined && general.defaultCurrency) {
    if (!validateCurrencyCode(general.defaultCurrency)) {
      errors.defaultCurrency = 'Invalid currency code';
    }
  }

  if (general.timezone !== undefined && general.timezone) {
    if (!validateTimezone(general.timezone)) {
      errors.timezone = 'Invalid timezone identifier';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates security settings
 */
export const validateSecuritySettings = (security: {
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  passwordMinLength?: number;
  allowedIpRanges?: string[];
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (security.sessionTimeout !== undefined) {
    if (isNaN(security.sessionTimeout) || security.sessionTimeout <= 0 || security.sessionTimeout > 1440) {
      errors.sessionTimeout = 'Session timeout must be between 1 and 1440 minutes';
    }
  }

  if (security.maxLoginAttempts !== undefined) {
    if (isNaN(security.maxLoginAttempts) || security.maxLoginAttempts < 1 || security.maxLoginAttempts > 10) {
      errors.maxLoginAttempts = 'Max login attempts must be between 1 and 10';
    }
  }

  if (security.passwordMinLength !== undefined) {
    if (isNaN(security.passwordMinLength) || security.passwordMinLength < 8 || security.passwordMinLength > 128) {
      errors.passwordMinLength = 'Password minimum length must be between 8 and 128 characters';
    }
  }

  if (security.allowedIpRanges && Array.isArray(security.allowedIpRanges)) {
    security.allowedIpRanges.forEach((ipRange, index) => {
      if (!validateIpRange(ipRange)) {
        errors[`allowedIpRanges.${index}`] = `Invalid IP range format. Use CIDR notation (e.g., 192.168.1.0/24)`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates integration settings
 */
export const validateIntegrationSettings = (integrations: {
  stripePublicKey?: string;
  stripeSecretKey?: string;
  googleMapsApiKey?: string;
  docusignClientId?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (integrations.stripePublicKey !== undefined && integrations.stripePublicKey) {
    if (!validateStripePublicKey(integrations.stripePublicKey)) {
      errors.stripePublicKey = 'Invalid Stripe public key format (must start with pk_)';
    }
  }

  if (integrations.stripeSecretKey !== undefined && integrations.stripeSecretKey) {
    if (!validateStripeSecretKey(integrations.stripeSecretKey)) {
      errors.stripeSecretKey = 'Invalid Stripe secret key format (must start with sk_)';
    }
  }

  if (integrations.googleMapsApiKey !== undefined && integrations.googleMapsApiKey) {
    if (!validateGoogleMapsApiKey(integrations.googleMapsApiKey)) {
      errors.googleMapsApiKey = 'Invalid Google Maps API key format';
    }
  }

  if (integrations.docusignClientId !== undefined && integrations.docusignClientId) {
    if (!validateDocuSignClientId(integrations.docusignClientId)) {
      errors.docusignClientId = 'Invalid DocuSign Client ID format (must be a UUID)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates all settings at once
 */
export const validateAllSettings = (settings: {
  general?: Record<string, unknown>;
  pricing?: Record<string, unknown>;
  security?: Record<string, unknown>;
  integrations?: Record<string, unknown>;
}): ValidationResult => {
  const allErrors: Record<string, string> = {};

  if (settings.general) {
    const generalResult = validateGeneralSettings(settings.general);
    Object.keys(generalResult.errors).forEach((key) => {
      allErrors[`general.${key}`] = generalResult.errors[key];
    });
  }

  if (settings.pricing) {
    const pricingResult = validatePricingSettings(settings.pricing);
    Object.keys(pricingResult.errors).forEach((key) => {
      allErrors[`pricing.${key}`] = pricingResult.errors[key];
    });
  }

  if (settings.security) {
    const securityResult = validateSecuritySettings(settings.security);
    Object.keys(securityResult.errors).forEach((key) => {
      allErrors[`security.${key}`] = securityResult.errors[key];
    });
  }

  if (settings.integrations) {
    const integrationResult = validateIntegrationSettings(settings.integrations);
    Object.keys(integrationResult.errors).forEach((key) => {
      allErrors[`integrations.${key}`] = integrationResult.errors[key];
    });
  }

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
  };
};
