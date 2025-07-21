import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule<T = unknown> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
  match?: string; // Field name to match against
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (name: keyof T, value: unknown, allValues: T = values): string | null => {
      const rules = validationRules[name];
      if (!rules) return null;

      // Required validation
      if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return `${String(name)} is required`;
      }

      // Skip other validations if field is empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return null;
      }

      // String-specific validations
      if (typeof value === 'string') {
        // Min length validation
        if (rules.minLength && value.length < rules.minLength) {
          return `${String(name)} must be at least ${rules.minLength} characters`;
        }

        // Max length validation
        if (rules.maxLength && value.length > rules.maxLength) {
          return `${String(name)} must be no more than ${rules.maxLength} characters`;
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
          return `${String(name)} format is invalid`;
        }
      }

      // Match validation (for password confirmation, etc.)
      if (rules.match && allValues[rules.match] !== value) {
        return `${String(name)} does not match`;
      }

      // Custom validation
      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) return customError;
      }

      return null;
    },
    [validationRules, values]
  );

  const validateForm = useCallback(
    (formValues: T = values): Partial<Record<keyof T, string>> => {
      const newErrors: Partial<Record<keyof T, string>> = {};

      Object.keys(validationRules).forEach(key => {
        const fieldName = key as keyof T;
        const error = validateField(fieldName, formValues[fieldName], formValues);
        if (error) {
          newErrors[fieldName] = error;
        }
      });

      return newErrors;
    },
    [validationRules, validateField, values]
  );

  const setValue = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      setValues(prev => {
        const newValues = { ...prev, [name]: value };
        
        // Real-time validation for the changed field
        const error = validateField(name, value, newValues);
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: error || undefined,
        }));

        return newValues;
      });
    },
    [validateField]
  );

  const setFieldTouched = useCallback((name: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldName = name as keyof T;
      
      let processedValue: T[keyof T];
      
      // Handle different input types
      if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked as T[keyof T];
      } else if (type === 'number') {
        processedValue = (value === '' ? '' : Number(value)) as T[keyof T];
      } else {
        processedValue = value as T[keyof T];
      }

      setValue(fieldName, processedValue);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      const fieldName = name as keyof T;
      setFieldTouched(fieldName, true);
    },
    [setFieldTouched]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFormErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrors(newErrors);
  }, []);

  // Computed values
  const isValid = useMemo(() => {
    const currentErrors = validateForm(values);
    return Object.keys(currentErrors).length === 0;
  }, [validateForm, values]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => {
      const fieldName = key as keyof T;
      return values[fieldName] !== initialValues[fieldName];
    });
  }, [values, initialValues]);

  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: String(name),
      value: String(values[name] || ''),
      onChange: handleChange,
      onBlur: handleBlur,
      'aria-invalid': errors[name] ? ('true' as const) : ('false' as const),
      'aria-describedby': errors[name] ? `${String(name)}-error` : undefined,
    }),
    [values, errors, handleChange, handleBlur]
  );

  const getFieldError = useCallback(
    (name: keyof T) => {
      return touched[name] ? errors[name] : undefined;
    },
    [touched, errors]
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    setValue,
    setFieldTouched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFormErrors,
    getFieldProps,
    getFieldError,
  };
}