'use server';

import { createClient } from '@/lib/supabase/server';
import { categorySchema } from '@/lib/validations/schemas';
import type { ActionResult, Category, CategoryType } from '@/types';

export async function getCategories(type?: CategoryType): Promise<ActionResult<Category[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  let query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: 'Error al cargar las categorías' };
  }

  return { success: true, data: data as Category[] };
}

export async function createCategory(formData: FormData): Promise<ActionResult<Category>> {
  const raw = {
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    icon: (formData.get('icon') as string) || null,
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  // Check for duplicate name
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('name', parsed.data.name)
    .eq('type', parsed.data.type)
    .single();

  if (existing) {
    return { success: false, error: 'Ya existe una categoría con ese nombre' };
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: 'Error al crear la categoría' };
  }

  return { success: true, data: data as Category };
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult<Category>> {
  const raw = {
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    icon: (formData.get('icon') as string) || null,
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: 'Error al actualizar la categoría' };
  }

  return { success: true, data: data as Category };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  // Check if category is being used
  const { count: incomeCount } = await supabase
    .from('incomes')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  const { count: expenseCount } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  if ((incomeCount ?? 0) > 0 || (expenseCount ?? 0) > 0) {
    return {
      success: false,
      error: 'No se puede eliminar una categoría que tiene registros asociados',
    };
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: 'Error al eliminar la categoría' };
  }

  return { success: true };
}
