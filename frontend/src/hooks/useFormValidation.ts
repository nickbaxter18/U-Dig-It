import { useCallback, useEffect, useState } from 'react';

export interface ValidationRule<T> {
  field: keyof T;
  validate: (value: any, formData: T) => string | undefined;
  debounceMs?: number;
}

export interface FieldError {
  [key: string]: string | undefined;
}

/**
 * Custom hook for real-time form validation with debouncing
 *
 * @param formData - Current form data
 * @param rules - Validation rules for each field
 * @returns Object containing errors and validation functions
 */
export function useFormValidation<T extends Record<string, any>>(
  formData: T,
  rules: ValidationRule<T>[]
) {
  const [errors, setErrors] = useState<FieldError>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set());

  /**
   * Mark a field as touched (user has interacted with it)
   */
  const touchField = useCallback((field: keyof T) => {
    setTouchedFields(prev => new Set(prev).add(field));
  }, []);

  /**
   * Validate a specific field
   */
  const validateField = useCallback(
    (field: keyof T, value: any): string | undefined => {
      const rule = rules.find(r => r.field === field);
      if (!rule) return undefined;

      return rule.validate(value, formData);
    },
    [rules, formData]
  );

  /**
   * Validate all fields
   */
  const validateAll = useCallback((): boolean => {
    const newErrors: FieldError = {};
    let isValid = true;

    rules.forEach(rule => {
      const error = rule.validate(formData[rule.field], formData);
      if (error) {
        newErrors[rule.field as string] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, formData]);

  /**
   * Clear error for a specific field
   */
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const updated = { ...prev };
      delete updated[field as string];
      return updated;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Real-time validation with debouncing
   */
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    rules.forEach(rule => {
      // Only validate fields that have been touched
      if (!touchedFields.has(rule.field)) return;

      const debounceMs = rule.debounceMs || 500;
      const timeout = setTimeout(() => {
        const error = rule.validate(formData[rule.field], formData);
        setErrors(prev => ({
          ...prev,
          [rule.field]: error,
        }));
      }, debounceMs);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [formData, rules, touchedFields]);

  return {
    errors,
    setErrors,
    touchField,
    validateField,
    validateAll,
    clearError,
    clearAllErrors,
  };
}
