import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  
  // Email validation
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone validation (US format)
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+1\s?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  }

  // Password strength validation
  getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    if (password.length < 6) return 'weak';
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  // Required field validation
  isRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  // Min length validation
  hasMinLength(value: string, minLength: number): boolean {
    return Boolean(value && value.length >= minLength);
  }

  // Max length validation
  hasMaxLength(value: string, maxLength: number): boolean {
    return Boolean(value && value.length <= maxLength);
  }

  // Number range validation
  isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  // URL validation
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
