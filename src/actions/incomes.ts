'use server';

import { createClient } from '@/lib/supabase/server';
import { incomeSchema } from '@/lib/validations/schemas';
import type { ActionResult, Income, PaginatedResponse, FilterParams } from '@/types';
import { PAGE_SIZE } from '@/lib/constants';

export async function getIncomes(filters: FilterParams = {}): Promise<ActionResult<PaginatedResponse<Income>>> {
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
    .from('incomes')
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

  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder === 'asc';
  query = query.order(sortBy, { ascending: sortOrder }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: 'Error al cargar los ingresos' };
  }

  return {
    success: true,
    data: {
      data: data as Income[],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  };
}

export async function createIncome(formData: FormData): Promise<ActionResult<Income>> {
  const raw = {
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    date: formData.get('date') as string,
    category_id: formData.get('category_id') as string,
    income_type: formData.get('income_type') as string,
    notes: (formData.get('notes') as string) || null,
  };

  const parsed = incomeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const { data, error } = await supabase
    .from('incomes')
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return { success: false, error: 'Error al crear el ingreso' };
  }

  return { success: true, data: data as Income };
}

export async function updateIncome(id: string, formData: FormData): Promise<ActionResult<Income>> {
  const raw = {
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    date: formData.get('date') as string,
    category_id: formData.get('category_id') as string,
    income_type: formData.get('income_type') as string,
    notes: (formData.get('notes') as string) || null,
  };

  const parsed = incomeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const { data, error } = await supabase
    .from('incomes')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return { success: false, error: 'Error al actualizar el ingreso' };
  }

  return { success: true, data: data as Income };
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const { error } = await supabase.from('incomes').delete().eq('id', id);

  if (error) {
    return { success: false, error: 'Error al eliminar el ingreso' };
  }

  return { success: true };
}
