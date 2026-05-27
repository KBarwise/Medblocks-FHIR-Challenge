/** Shared phone and email validation for kiosk pre-screening and registration. */

const EMAIL_RE =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const PHONE_CHARS_RE = /^[\d\s().+\-]+$/;

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Returns an error message, or null if empty or valid. */
export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  if (/[a-zA-Z]/.test(trimmed)) {
    return 'Phone number cannot contain letters';
  }
  if (!PHONE_CHARS_RE.test(trimmed)) {
    return 'Phone number contains invalid characters';
  }

  const digits = phoneDigits(trimmed);
  if (digits.length < 10) {
    return 'Enter at least 10 digits (area code + number)';
  }
  if (digits.length > 15) {
    return 'Phone number is too long';
  }

  return null;
}

/** Returns an error message, or null if empty or valid. */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return null;

  if (trimmed.length > 254) {
    return 'Email address is too long';
  }
  if (!EMAIL_RE.test(trimmed)) {
    return 'Enter a valid email address (e.g. you@example.com)';
  }

  const at = trimmed.lastIndexOf('@');
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (
    local.includes('..') ||
    domain.includes('..') ||
    domain.startsWith('.') ||
    domain.endsWith('.')
  ) {
    return 'Enter a valid email address';
  }

  return null;
}

export type ContactFieldErrors = {
  phone?: string;
  email?: string;
  /** When at least one contact method is required but none provided */
  form?: string;
};

export function validateContactFields(
  phone: string,
  email: string,
  options?: { requireOne?: boolean },
): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const p = phone.trim();
  const e = email.trim();

  if (options?.requireOne && !p && !e) {
    errors.form =
      'Please provide a phone number or email address so we can contact you if eligible.';
    return errors;
  }

  if (p) {
    const phoneErr = validatePhone(phone);
    if (phoneErr) errors.phone = phoneErr;
  }

  if (e) {
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
  }

  return errors;
}

export function firstContactError(errors: ContactFieldErrors): string | null {
  return errors.form ?? errors.phone ?? errors.email ?? null;
}

export function hasContactErrors(errors: ContactFieldErrors): boolean {
  return Boolean(errors.form || errors.phone || errors.email);
}
