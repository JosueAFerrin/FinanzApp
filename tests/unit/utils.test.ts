import { describe, it, expect } from 'vitest';
import {
  calculateSavings,
  calculateSavingsPercentage,
  getPercentageChange,
  formatCurrency,
  getMonthName,
} from '@/lib/utils';

describe('calculateSavings', () => {
  it('should calculate positive savings', () => {
    expect(calculateSavings(2000, 1250)).toBe(750);
  });

  it('should calculate negative savings (overspending)', () => {
    expect(calculateSavings(1000, 1500)).toBe(-500);
  });

  it('should return 0 when income equals expenses', () => {
    expect(calculateSavings(1000, 1000)).toBe(0);
  });

  it('should handle zero income', () => {
    expect(calculateSavings(0, 500)).toBe(-500);
  });

  it('should handle zero expenses', () => {
    expect(calculateSavings(1000, 0)).toBe(1000);
  });

  it('should handle both zero', () => {
    expect(calculateSavings(0, 0)).toBe(0);
  });
});

describe('calculateSavingsPercentage', () => {
  it('should calculate correct percentage', () => {
    expect(calculateSavingsPercentage(2000, 1250)).toBe(37.5);
  });

  it('should return 0 when income is 0', () => {
    expect(calculateSavingsPercentage(0, 500)).toBe(0);
  });

  it('should return 0 when income is negative', () => {
    expect(calculateSavingsPercentage(-100, 50)).toBe(0);
  });

  it('should return 100 when no expenses', () => {
    expect(calculateSavingsPercentage(1000, 0)).toBe(100);
  });

  it('should return negative percentage when overspending', () => {
    expect(calculateSavingsPercentage(1000, 1500)).toBe(-50);
  });

  it('should handle large numbers correctly', () => {
    const result = calculateSavingsPercentage(999999999.99, 500000000);
    expect(result).toBeCloseTo(50, 0);
  });
});

describe('getPercentageChange', () => {
  it('should calculate positive change', () => {
    expect(getPercentageChange(1200, 1000)).toBe(20);
  });

  it('should calculate negative change', () => {
    expect(getPercentageChange(800, 1000)).toBe(-20);
  });

  it('should return null when previous is 0 and current is 0', () => {
    expect(getPercentageChange(0, 0)).toBeNull();
  });

  it('should return 100 when previous is 0 and current > 0', () => {
    expect(getPercentageChange(500, 0)).toBe(100);
  });

  it('should return 0 when values are equal', () => {
    expect(getPercentageChange(1000, 1000)).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('should format positive numbers', () => {
    const result = formatCurrency(1250.50);
    expect(result).toContain('1,250.50');
  });

  it('should format zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0.00');
  });

  it('should format negative numbers', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500.00');
  });
});

describe('getMonthName', () => {
  it('should return correct month names', () => {
    expect(getMonthName(1)).toBe('Enero');
    expect(getMonthName(6)).toBe('Junio');
    expect(getMonthName(12)).toBe('Diciembre');
  });

  it('should return empty string for invalid month', () => {
    expect(getMonthName(0)).toBe('');
    expect(getMonthName(13)).toBe('');
  });
});
