'use server';

import { createClient } from '@/lib/supabase/server';
import { recurringExpenseSchema } from '@/lib/validations/schemas';
import type { ActionResult, RecurringExpense } from '@/types';

export async function getRecurringExpenses(): Promise<ActionResult<RecurringExpense[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*, category:categories(*)')
    .order('name', { ascending: true });

  if (error) return { success: false, error: 'Error al cargar los gastos recurrentes' };
  return { success: true, data: data as RecurringExpense[] };
}

export async function createRecurringExpense(formData: FormData): Promise<ActionResult<RecurringExpense>> {
  const raw = {
    name: formData.get('name') as string,
    amount: parseFloat(formData.get('amount') as string),
    category_id: formData.get('category_id') as string,
    frequency: formData.get('frequency') as string,
    start_date: formData.get('start_date') as string,
    end_date: (formData.get('end_date') as string) || null,
    is_active: formData.get('is_active') === 'true',
  };

  const parsed = recurringExpenseSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({ user_id: user.id, ...parsed.data })
    .select('*, category:categories(*)')
    .single();

  if (error) return { success: false, error: 'Error al crear el gasto recurrente' };
  return { success: true, data: data as RecurringExpense };
}

export async function updateRecurringExpense(id: string, formData: FormData): Promise<ActionResult<RecurringExpense>> {
  const raw = {
    name: formData.get('name') as string,
    amount: parseFloat(formData.get('amount') as string),
    category_id: formData.get('category_id') as string,
    frequency: formData.get('frequency') as string,
    start_date: formData.get('start_date') as string,
    end_date: (formData.get('end_date') as string) || null,
    is_active: formData.get('is_active') === 'true',
  };

  const parsed = recurringExpenseSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data, error } = await supabase
    .from('recurring_expenses')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, category:categories(*)')
    .single();

  if (error) return { success: false, error: 'Error al actualizar el gasto recurrente' };
  return { success: true, data: data as RecurringExpense };
}

export async function deleteRecurringExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) return { success: false, error: 'Error al eliminar el gasto recurrente' };
  return { success: true };
}

export async function toggleRecurringExpense(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase
    .from('recurring_expenses')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: 'Error al actualizar el estado' };
  return { success: true };
}
