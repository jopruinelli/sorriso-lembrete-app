/**
 * Input sanitization utilities for security
 */

// Simple HTML escape function to prevent XSS
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sanitize text input by removing potentially dangerous characters
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove null bytes and control characters (except common whitespace)
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim and limit length to prevent abuse
  return cleaned.trim().slice(0, 10000);
}

// Sanitize phone numbers to allow only digits, spaces, parentheses, hyphens, and plus
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  
  return phone.replace(/[^+\d\s()-]/g, '').trim();
}

// Validate and sanitize organization names
export function sanitizeOrganizationName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  // Allow letters, numbers, spaces, and common punctuation
  const sanitized = name.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim();
  
  // Ensure minimum and maximum length
  if (sanitized.length < 2) throw new Error('Nome da organização deve ter pelo menos 2 caracteres');
  if (sanitized.length > 100) throw new Error('Nome da organização não pode exceder 100 caracteres');
  
  return sanitized;
}

// Sanitize user names
export function sanitizeUserName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  // Allow letters, spaces, and common name characters
  const sanitized = name.replace(/[^a-zA-ZÀ-ÿ\s\-'.]/, '').trim();
  
  if (sanitized.length < 1) throw new Error('Nome não pode estar vazio');
  if (sanitized.length > 100) throw new Error('Nome não pode exceder 100 caracteres');
  
  return sanitized;
}

// Sanitize notes and text areas
export function sanitizeNotes(notes: string): string {
  if (!notes || typeof notes !== 'string') return '';
  
  // Remove potentially dangerous HTML/script content but keep basic formatting
  const sanitized = notes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return sanitizeText(sanitized);
}
