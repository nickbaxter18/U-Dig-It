export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export const handleSupabaseError = (error: unknown): SupabaseError => {
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return new SupabaseError('No data found', 'NOT_FOUND', error);
      case 'PGRST301':
        return new SupabaseError('Access denied', 'UNAUTHORIZED', error);
      case '23505':
        return new SupabaseError('Duplicate entry', 'DUPLICATE', error);
      case '23503':
        return new SupabaseError('Referenced record not found', 'FOREIGN_KEY', error);
      case 'auth/invalid-credentials':
        return new SupabaseError('Invalid email or password', 'INVALID_CREDENTIALS', error);
      case 'auth/user-not-found':
        return new SupabaseError('User not found', 'USER_NOT_FOUND', error);
      case 'auth/weak-password':
        return new SupabaseError('Password is too weak', 'WEAK_PASSWORD', error);
      case 'auth/email-already-registered':
        return new SupabaseError('Email already registered', 'EMAIL_EXISTS', error);
      default:
        return new SupabaseError(error.message || 'Database error', error.code, error);
    }
  }

  return new SupabaseError(error.message || 'Unknown error', 'UNKNOWN', error);
};

// User-friendly error messages
export const getErrorMessage = (error: SupabaseError): string => {
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'USER_NOT_FOUND':
      return 'No account found with this email address.';
    case 'WEAK_PASSWORD':
      return 'Password must be at least 6 characters long.';
    case 'EMAIL_EXISTS':
      return 'An account with this email already exists.';
    case 'UNAUTHORIZED':
      return "You don't have permission to perform this action.";
    case 'NOT_FOUND':
      return 'The requested resource was not found.';
    case 'DUPLICATE':
      return 'This item already exists.';
    case 'FOREIGN_KEY':
      return 'Cannot complete action due to related data.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};
