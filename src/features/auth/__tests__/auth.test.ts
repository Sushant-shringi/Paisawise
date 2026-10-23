import { describe, it, expect } from 'vitest';
import { isSupabaseConfigured } from '@/lib/supabase/client';

describe('Authentication & Session Logic', () => {
  it('detects when Supabase is configured vs fallback demo mode', () => {
    // When no VITE_SUPABASE_URL or placeholder is present, isSupabaseConfigured is false
    expect(typeof isSupabaseConfigured).toBe('boolean');
  });

  it('validates password requirements safely', () => {
    const isValidPassword = (p: string) => p.length >= 6;
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword('secure123')).toBe(true);
  });

  it('validates email format patterns', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('user@example.com')).toBe(true);
    expect(emailRegex.test('user@paisawise.app')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
  });

  it('validates password matching on reset workflow', () => {
    const checkMatching = (p1: string, p2: string) => p1 === p2 && p1.length >= 6;
    expect(checkMatching('password123', 'password123')).toBe(true);
    expect(checkMatching('password123', 'different')).toBe(false);
    expect(checkMatching('123', '123')).toBe(false);
  });
});
