'use server';

import { createClient } from '@/lib/supabase/server';
import { recurringExpenseSchema } from '@/lib/validations/schemas';
import type { ActionResult, RecurringExpense } from '@/types';
import { revalidatePath } from 'next/cache';

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

  revalidatePath('/dashboard');
  revalidatePath('/recurring');
  revalidatePath('/reports');
  revalidatePath('/expenses');

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

  revalidatePath('/dashboard');
  revalidatePath('/recurring');
  revalidatePath('/reports');
  revalidatePath('/expenses');

  return { success: true, data: data as RecurringExpense };
}

export async function deleteRecurringExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) return { success: false, error: 'Error al eliminar el gasto recurrente' };

  revalidatePath('/dashboard');
  revalidatePath('/recurring');
  revalidatePath('/reports');
  revalidatePath('/expenses');

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

  revalidatePath('/dashboard');
  revalidatePath('/recurring');
  revalidatePath('/reports');
  revalidatePath('/expenses');

  return { success: true };
}

export async function processDueRecurringExpenses(): Promise<ActionResult<{ processedCount: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data: recurringItems, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error || !recurringItems || recurringItems.length === 0) {
    return { success: true, data: { processedCount: 0 } };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentDay = now.getDate();

  const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDateStr = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  // Fetch all expenses for this month to check duplicates
  const { data: existingExpenses } = await supabase
    .from('expenses')
    .select('notes, description')
    .gte('date', startDateStr)
    .lt('date', endDateStr);

  const existingNotesSet = new Set((existingExpenses || []).map((e: { notes: string | null }) => e.notes));

  let processedCount = 0;

  for (const item of recurringItems) {
    // Parse day directly from the date string (YYYY-MM-DD) to avoid timezone issues.
    // new Date("2026-09-03") is UTC midnight, and .getDate() returns local day which
    // can be off by one in negative-UTC timezones (e.g. UTC-5: Sept 3 UTC → Sept 2 local).
    const scheduledDay = parseInt(item.start_date.split('-')[2], 10) || 1;

    // Check if end_date has passed
    if (item.end_date && new Date(item.end_date) < now) {
      continue;
    }

    const noteTag = `[Recurrente:${item.id}]`;
    if (existingNotesSet.has(noteTag) || Array.from(existingNotesSet).some((n) => n && n.includes(noteTag))) {
      // Already processed for this month!
      continue;
    }

    // Check if due date in current month has arrived (currentDay >= scheduledDay)
    if (currentDay >= scheduledDay) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const targetDay = Math.min(scheduledDay, daysInMonth);
      const targetDate = `${year}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

      const { error: insertError } = await supabase.from('expenses').insert({
        user_id: user.id,
        category_id: item.category_id,
        description: item.name,
        amount: item.amount,
        date: targetDate,
        expense_type: 'fixed',
        notes: `${noteTag} Cobro automático de gasto recurrente`,
      });

      if (!insertError) {
        processedCount++;
      }
    }
  }

  return { success: true, data: { processedCount } };
}

export async function registerRecurringAsExpense(recurringId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data: item, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('id', recurringId)
    .single();

  if (error || !item) return { success: false, error: 'Gasto recurrente no encontrado' };

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const noteTag = `[Recurrente:${item.id}]`;

  const { error: insertError } = await supabase.from('expenses').insert({
    user_id: user.id,
    category_id: item.category_id,
    description: item.name,
    amount: item.amount,
    date: todayStr,
    expense_type: 'fixed',
    notes: `${noteTag} Cobro registrado manualmente de gasto recurrente`,
  });

  if (insertError) return { success: false, error: 'Error al registrar el egreso' };

  revalidatePath('/dashboard');
  revalidatePath('/expenses');
  revalidatePath('/reports');
  revalidatePath('/recurring');

  return { success: true };
}
