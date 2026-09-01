'use server';

import { createClient } from '@/lib/supabase/server';
import { expenseSchema } from '@/lib/validations/schemas';
import type { ActionResult, Expense, PaginatedResponse, FilterParams } from '@/types';
import { PAGE_SIZE } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export async function getExpenses(filters: FilterParams = {}): Promise<ActionResult<PaginatedResponse<Expense>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('expenses')
    .select('*, category:categories(*)', { count: 'exact' });

  if (filters.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('date', filters.endDate);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.expenseType) {
    query = query.eq('expense_type', filters.expenseType);
  }

  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder === 'asc';
  query = query.order(sortBy, { ascending: sortOrder }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: 'Error al cargar los gastos' };
  }

  return {
    success: true,
    data: {
      data: data as Expense[],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  };
}

export async function createExpense(formData: FormData): Promise<ActionResult<Expense>> {
  const raw = {
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    date: formData.get('date') as string,
    category_id: formData.get('category_id') as string,
    expense_type: formData.get('expense_type') as string,
    notes: (formData.get('notes') as string) || null,
  };

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return { success: false, error: 'Error al crear el gasto' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/expenses');
  revalidatePath('/reports');

  return { success: true, data: data as Expense };
}

export async function updateExpense(id: string, formData: FormData): Promise<ActionResult<Expense>> {
  const raw = {
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    date: formData.get('date') as string,
    category_id: formData.get('category_id') as string,
    expense_type: formData.get('expense_type') as string,
    notes: (formData.get('notes') as string) || null,
  };

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return { success: false, error: 'Error al actualizar el gasto' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/expenses');
  revalidatePath('/reports');

  return { success: true, data: data as Expense };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const { error } = await supabase.from('expenses').delete().eq('id', id);

  if (error) {
    return { success: false, error: 'Error al eliminar el gasto' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/expenses');
  revalidatePath('/reports');

  return { success: true };
}
