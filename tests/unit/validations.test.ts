import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  incomeSchema,
  expenseSchema,
  categorySchema,
  recurringExpenseSchema,
} from '@/lib/validations/schemas';

describe('loginSchema', () => {
  it('should validate correct login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('should validate correct registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject mismatched passwords', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'Password1',
      confirmPassword: 'Different1',
    });
    expect(result.success).toBe(false);
  });

  it('should require uppercase in password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password1',
      confirmPassword: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('should require number in password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'Password',
      confirmPassword: 'Password',
    });
    expect(result.success).toBe(false);
  });
});

describe('incomeSchema', () => {
  it('should validate correct income data', () => {
    const result = incomeSchema.safeParse({
      description: 'Salario mensual',
      amount: 2000,
      date: '2024-01-15',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      income_type: 'salary',
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative amounts', () => {
    const result = incomeSchema.safeParse({
      description: 'Salario',
      amount: -100,
      date: '2024-01-15',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      income_type: 'salary',
    });
    expect(result.success).toBe(false);
  });

  it('should reject zero amount', () => {
    const result = incomeSchema.safeParse({
      description: 'Salario',
      amount: 0,
      date: '2024-01-15',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      income_type: 'salary',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty description', () => {
    const result = incomeSchema.safeParse({
      description: '',
      amount: 2000,
      date: '2024-01-15',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      income_type: 'salary',
    });
    expect(result.success).toBe(false);
  });
});

describe('expenseSchema', () => {
  it('should validate correct expense data', () => {
    const result = expenseSchema.safeParse({
      description: 'Compra supermercado',
      amount: 150.50,
      date: '2024-01-15',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      expense_type: 'variable',
    });
    expect(result.success).toBe(true);
  });

  it('should accept fixed type', () => {
    const result = expenseSchema.safeParse({
      description: 'Alquiler',
      amount: 500,
      date: '2024-01-01',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      expense_type: 'fixed',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid expense type', () => {
    const result = expenseSchema.safeParse({
      description: 'Test',
      amount: 100,
      date: '2024-01-15',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      expense_type: 'other',
    });
    expect(result.success).toBe(false);
  });
});

describe('categorySchema', () => {
  it('should validate correct category data', () => {
    const result = categorySchema.safeParse({
      name: 'Alimentación',
      type: 'expense',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = categorySchema.safeParse({
      name: '',
      type: 'expense',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = categorySchema.safeParse({
      name: 'Test',
      type: 'other',
    });
    expect(result.success).toBe(false);
  });

  it('should reject name over 50 characters', () => {
    const result = categorySchema.safeParse({
      name: 'A'.repeat(51),
      type: 'expense',
    });
    expect(result.success).toBe(false);
  });
});

describe('recurringExpenseSchema', () => {
  it('should validate correct recurring expense', () => {
    const result = recurringExpenseSchema.safeParse({
      name: 'Netflix',
      amount: 15.99,
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      frequency: 'monthly',
      start_date: '2024-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional end_date', () => {
    const result = recurringExpenseSchema.safeParse({
      name: 'Netflix',
      amount: 15.99,
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      frequency: 'monthly',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid frequency', () => {
    const result = recurringExpenseSchema.safeParse({
      name: 'Netflix',
      amount: 15.99,
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      frequency: 'daily',
      start_date: '2024-01-01',
    });
    expect(result.success).toBe(false);
  });
});
