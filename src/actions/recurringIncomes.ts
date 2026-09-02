'use server';

import { createClient } from '@/lib/supabase/server';
import { recurringIncomeSchema } from '@/lib/validations/schemas';
import type { ActionResult, RecurringIncome } from '@/types';
import { getRecurringIncomePaymentDay } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getRecurringIncomes(): Promise<ActionResult<RecurringIncome[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data, error } = await supabase
    .from('recurring_incomes')
    .select('*, category:categories(*)')
    .order('name', { ascending: true });

  if (error) return { success: false, error: 'Error al cargar los ingresos recurrentes' };
  return { success: true, data: data as RecurringIncome[] };
}

export async function createRecurringIncome(formData: FormData): Promise<ActionResult<RecurringIncome>> {
  const raw = {
    name: formData.get('name') as string,
    amount: parseFloat(formData.get('amount') as string),
    category_id: formData.get('category_id') as string,
    frequency: formData.get('frequency') as string,
    income_type: formData.get('income_type') as string,
    is_salary: formData.get('is_salary') === 'true',
    salary_last_business_day: formData.get('salary_last_business_day') === 'true',
    payment_day: formData.get('payment_day') ? parseInt(formData.get('payment_day') as string, 10) : null,
    start_date: formData.get('start_date') as string,
    end_date: (formData.get('end_date') as string) || null,
    is_active: formData.get('is_active') === 'true',
  };

  const parsed = recurringIncomeSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data, error } = await supabase
    .from('recurring_incomes')
    .insert({ user_id: user.id, ...parsed.data })
    .select('*, category:categories(*)')
    .single();

  if (error) return { success: false, error: 'Error al crear el ingreso recurrente' };

  revalidatePath('/dashboard');
  revalidatePath('/recurring');
  revalidatePath('/reports');
  revalidatePath('/incomes');

  return { success: true, data: data as RecurringIncome };
}

export async function updateRecurringIncome(id: string, formData: FormData): Promise<ActionResult<RecurringIncome>> {
  const raw = {
    name: formData.get('name') as string,
    amount: parseFloat(formData.get('amount') as string),
    category_id: formData.get('category_id') as string,
    frequency: formData.get('frequency') as string,
    income_type: formData.get('income_type') as string,
    is_salary: formData.get('is_salary') === 'true',
    salary_last_business_day: formData.get('salary_last_business_day') === 'true',
    payment_day: formData.get('payment_day') ? parseInt(formData.get('payment_day') as string, 10) : null,
    start_date: formData.get('start_date') as string,
    end_date: (formData.get('end_date') as string) || null,
    is_active: formData.get('is_active') === 'true',
  };

  const parsed = recurringIncomeSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data, error } = await supabase
    .from('recurring_incomes')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, category:categories(*)')
    .single();

  if (error) return { success: false, error: 'Error al actualizar el ingreso recurrente' };

  revalidatePath('/dashboard');
  revalidatePath('/recurring');
  revalidatePath('/reports');
  revalidatePath('/incomes');

  return { success: true, data: data as RecurringIncome };
}

export async function deleteRecurringIncome(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase.from('recurring_incomes').delete().eq('id', id);
  if (error) return { success: false, error: 'Error al eliminar el ingreso recurrente' };

  revalidatePath('/dashboard');
  revalidatePath('/recurring');
  revalidatePath('/reports');
  revalidatePath('/incomes');

  return { success: true };
}

export async function toggleRecurringIncome(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase
    .from('recurring_incomes')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: 'Error al actualizar el estado' };

  revalidatePath('/dashboard');
  revalidatePath('/recurring');
  revalidatePath('/reports');
  revalidatePath('/incomes');

  return { success: true };
}

/**
 * Auto-process due recurring income items for the current month.
 * Uses business-day logic for salary items and fixed-day for others.
 */
export async function processDueRecurringIncomes(): Promise<ActionResult<{ processedCount: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data: recurringItems, error } = await supabase
    .from('recurring_incomes')
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

  // Fetch all incomes for this month to check duplicates
  const { data: existingIncomes } = await supabase
    .from('incomes')
    .select('notes, description')
    .gte('date', startDateStr)
    .lt('date', endDateStr);

  const existingNotesSet = new Set((existingIncomes || []).map((e: { notes: string | null }) => e.notes));

  let processedCount = 0;

  for (const item of recurringItems) {
    // Check if end_date has passed
    if (item.end_date && new Date(item.end_date) < now) {
      continue;
    }

    const noteTag = `[IngresoRecurrente:${item.id}]`;
    if (existingNotesSet.has(noteTag) || Array.from(existingNotesSet).some((n) => n && n.includes(noteTag))) {
      // Already processed for this month
      continue;
    }

    // Calculate the payment day for this month
    const scheduledDay = getRecurringIncomePaymentDay(item, year, month);

    // Check if the payment day has arrived
    if (currentDay >= scheduledDay) {
      const targetDate = `${year}-${String(month).padStart(2, '0')}-${String(scheduledDay).padStart(2, '0')}`;

      const { error: insertError } = await supabase.from('incomes').insert({
        user_id: user.id,
        category_id: item.category_id,
        description: item.name,
        amount: item.amount,
        date: targetDate,
        income_type: item.income_type || 'salary',
        notes: `${noteTag} Cobro automático de ingreso recurrente`,
      });

      if (!insertError) {
        processedCount++;
      }
    }
  }

  return { success: true, data: { processedCount } };
}

export async function registerRecurringAsIncome(recurringId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data: item, error } = await supabase
    .from('recurring_incomes')
    .select('*')
    .eq('id', recurringId)
    .single();

  if (error || !item) return { success: false, error: 'Ingreso recurrente no encontrado' };

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const noteTag = `[IngresoRecurrente:${item.id}]`;

  const { error: insertError } = await supabase.from('incomes').insert({
    user_id: user.id,
    category_id: item.category_id,
    description: item.name,
    amount: item.amount,
    date: todayStr,
    income_type: item.income_type || 'salary',
    notes: `${noteTag} Cobro registrado manualmente de ingreso recurrente`,
  });

  if (insertError) return { success: false, error: 'Error al registrar el ingreso' };

  revalidatePath('/dashboard');
  revalidatePath('/incomes');
  revalidatePath('/reports');
  revalidatePath('/recurring');

  return { success: true };
}
