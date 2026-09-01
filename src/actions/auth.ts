'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/schemas';
import type { ActionResult } from '@/types';
import { redirect } from 'next/navigation';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '@/lib/constants';

export async function signUp(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, error: 'Este email ya está registrado' };
    }
    return { success: false, error: 'Error al crear la cuenta. Intenta de nuevo.' };
  }

  // Create default categories for the new user
  if (data.user) {
    const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((cat) => ({
      user_id: data.user!.id,
      name: cat.name,
      type: 'income' as const,
      icon: cat.icon,
    }));

    const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
      user_id: data.user!.id,
      name: cat.name,
      type: 'expense' as const,
      icon: cat.icon,
    }));

    await supabase.from('categories').insert([...incomeCategories, ...expenseCategories]);
  }

  return { success: true };
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: 'Email o contraseña incorrectos' };
  }

  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get('email') as string };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return { success: false, error: 'Error al enviar el email. Intenta de nuevo.' };
  }

  return { success: true };
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: 'Error al cambiar la contraseña. Intenta de nuevo.' };
  }

  return { success: true };
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
