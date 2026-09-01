import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Ingresa un email válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  type: z.enum(['income', 'expense'], {
    error: 'Selecciona un tipo válido',
  }),
  icon: z.string().nullable().optional(),
});

export const incomeSchema = z.object({
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(200, 'Máximo 200 caracteres'),
  amount: z
    .number({ error: 'Ingresa un monto válido' })
    .positive('El monto debe ser mayor a 0')
    .max(999999999.99, 'El monto es demasiado grande'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  category_id: z.string().uuid('Selecciona una categoría'),
  income_type: z.string().min(1, 'Selecciona un tipo'),
  notes: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
});

export const expenseSchema = z.object({
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(200, 'Máximo 200 caracteres'),
  amount: z
    .number({ error: 'Ingresa un monto válido' })
    .positive('El monto debe ser mayor a 0')
    .max(999999999.99, 'El monto es demasiado grande'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  category_id: z.string().uuid('Selecciona una categoría'),
  expense_type: z.enum(['fixed', 'variable'], {
    error: 'Selecciona un tipo válido',
  }),
  notes: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
});

export const recurringExpenseSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  amount: z
    .number({ error: 'Ingresa un monto válido' })
    .positive('El monto debe ser mayor a 0')
    .max(999999999.99, 'El monto es demasiado grande'),
  category_id: z.string().uuid('Selecciona una categoría'),
  frequency: z.enum(['weekly', 'monthly', 'yearly'], {
    error: 'Selecciona una frecuencia válida',
  }),
  start_date: z.string().min(1, 'La fecha de inicio es obligatoria'),
  end_date: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>;
