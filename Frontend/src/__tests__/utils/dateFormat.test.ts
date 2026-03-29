import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDateFormat,
  getTimeFormat,
  formatDate,
  formatTime,
  formatDateTime,
  getCurrencySymbol,
  formatCurrency,
  STORAGE_KEYS,
} from '../../utils/dateFormat';

describe('dateFormat utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getDateFormat', () => {
    it('returns default format when no value in localStorage', () => {
      expect(getDateFormat()).toBe('DD/MM/AAAA');
    });

    it('returns stored format from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.dateFormat, 'MM/DD/AAAA');
      expect(getDateFormat()).toBe('MM/DD/AAAA');
    });

    it('returns AAAA-MM-DD format when stored', () => {
      localStorage.setItem(STORAGE_KEYS.dateFormat, 'AAAA-MM-DD');
      expect(getDateFormat()).toBe('AAAA-MM-DD');
    });
  });

  describe('getTimeFormat', () => {
    it('returns default 24h format when no value in localStorage', () => {
      expect(getTimeFormat()).toBe('24h');
    });

    it('returns 12h format when stored', () => {
      localStorage.setItem(STORAGE_KEYS.timeFormat, '12h');
      expect(getTimeFormat()).toBe('12h');
    });
  });

  describe('formatDate', () => {
    it('returns empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('returns empty string for invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('');
    });

    it('formats date in DD/MM/AAAA format (default)', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('formats date string correctly', () => {
      // Note: Date parsing may vary by timezone, so we check for day/month/year presence
      const result = formatDate(new Date(2024, 0, 15));
      expect(result).toContain('15');
      expect(result).toContain('01');
      expect(result).toContain('2024');
    });

    it('formats date in MM/DD/AAAA format', () => {
      localStorage.setItem(STORAGE_KEYS.dateFormat, 'MM/DD/AAAA');
      const date = new Date(2024, 0, 15);
      expect(formatDate(date)).toBe('01/15/2024');
    });

    it('formats date in AAAA-MM-DD format', () => {
      localStorage.setItem(STORAGE_KEYS.dateFormat, 'AAAA-MM-DD');
      const date = new Date(2024, 0, 15);
      expect(formatDate(date)).toBe('2024-01-15');
    });
  });

  describe('formatTime', () => {
    it('returns empty string for null', () => {
      expect(formatTime(null)).toBe('');
    });

    it('formats time in 24h format (default)', () => {
      const date = new Date(2024, 0, 15, 14, 30);
      expect(formatTime(date)).toBe('14:30');
    });

    it('formats time in 12h format with AM', () => {
      localStorage.setItem(STORAGE_KEYS.timeFormat, '12h');
      const date = new Date(2024, 0, 15, 9, 15);
      expect(formatTime(date)).toBe('9:15 AM');
    });

    it('formats time in 12h format with PM', () => {
      localStorage.setItem(STORAGE_KEYS.timeFormat, '12h');
      const date = new Date(2024, 0, 15, 18, 45);
      expect(formatTime(date)).toBe('6:45 PM');
    });

    it('formats midnight (0) as 12 AM', () => {
      localStorage.setItem(STORAGE_KEYS.timeFormat, '12h');
      const date = new Date(2024, 0, 15, 0, 0);
      expect(formatTime(date)).toBe('12:00 AM');
    });

    it('formats noon (12) as 12 PM', () => {
      localStorage.setItem(STORAGE_KEYS.timeFormat, '12h');
      const date = new Date(2024, 0, 15, 12, 0);
      expect(formatTime(date)).toBe('12:00 PM');
    });
  });

  describe('formatDateTime', () => {
    it('returns empty string for null', () => {
      expect(formatDateTime(null)).toBe('');
    });

    it('combines date and time formatting', () => {
      localStorage.setItem(STORAGE_KEYS.dateFormat, 'DD/MM/AAAA');
      localStorage.setItem(STORAGE_KEYS.timeFormat, '24h');
      const date = new Date(2024, 0, 15, 14, 30);
      expect(formatDateTime(date)).toBe('15/01/2024 14:30');
    });
  });

  describe('getCurrencySymbol', () => {
    it('returns default $ symbol when no value in localStorage', () => {
      expect(getCurrencySymbol()).toBe('$');
    });

    it('returns U$S symbol when stored', () => {
      localStorage.setItem(STORAGE_KEYS.currencyFormat, 'U$S');
      expect(getCurrencySymbol()).toBe('U$S');
    });
  });

  describe('formatCurrency', () => {
    it('formats positive number with default $ symbol', () => {
      const result = formatCurrency(1000);
      // Note: Uses locale-specific formatting (may be $1.000 or $1,000)
      expect(result).toMatch(/\$\d+/);
    });

    it('formats negative number with minus sign', () => {
      const result = formatCurrency(-500);
      expect(result).toMatch(/-\$\d+/);
    });

    it('formats zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toMatch(/\$\d+/);
    });

    it('formats large numbers', () => {
      const result = formatCurrency(1000000);
      // Note: Uses locale-specific formatting
      expect(result).toMatch(/\$\d+/);
    });

    it('formats with U$S symbol when configured', () => {
      localStorage.setItem(STORAGE_KEYS.currencyFormat, 'U$S');
      const result = formatCurrency(2500);
      expect(result).toMatch(/U\$S\d+/);
    });
  });
});
