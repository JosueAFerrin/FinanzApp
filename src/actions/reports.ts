'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResult, DashboardData, MonthlyReport, AnnualReport, CategoryBreakdown } from '@/types';
import { calculateSavings, calculateSavingsPercentage, getPercentageChange } from '@/lib/utils';

async function getMonthData(supabase: ReturnType<typeof import('@supabase/ssr').createServerClient>, year: number, month: number): Promise<MonthlyReport> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const [incomeResult, expenseResult, fixedResult, variableResult, recurringResult, prevIncomeResult, prevExpenseResult, monthExpensesNotes] = await Promise.all([
    supabase.from('incomes').select('amount').gte('date', startDate).lt('date', endDate),
    supabase.from('expenses').select('amount').gte('date', startDate).lt('date', endDate),
    supabase.from('expenses').select('amount').gte('date', startDate).lt('date', endDate).eq('expense_type', 'fixed'),
    supabase.from('expenses').select('amount').gte('date', startDate).lt('date', endDate).eq('expense_type', 'variable'),
    supabase.from('recurring_expenses').select('id, amount, frequency').eq('is_active', true),
    supabase.from('incomes').select('amount').lt('date', startDate),
    supabase.from('expenses').select('amount').lt('date', startDate),
    supabase.from('expenses').select('notes').gte('date', startDate).lt('date', endDate),
  ]);

  const totalIncome = (incomeResult.data || []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);
  const totalExpenses = (expenseResult.data || []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);
  const fixedExpenses = (fixedResult.data || []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);
  const variableExpenses = (variableResult.data || []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);

  const prevIncomes = (prevIncomeResult.data || []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);
  const prevExpenses = (prevExpenseResult.data || []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);
  const initialBalance = prevIncomes - prevExpenses;

  const paidNotesSet = new Set((monthExpensesNotes.data || []).map((e: { notes: string | null }) => e.notes).filter(Boolean));

  // Only sum recurring items that have NOT been converted to an expense yet in this month
  const totalRecurring = (recurringResult.data || []).reduce((sum: number, r: { id: string; amount: number; frequency: string }) => {
    const noteTag = `[Recurrente:${r.id}]`;
    const isPaid = Array.from(paidNotesSet).some((n) => typeof n === 'string' && n.includes(noteTag));
    if (isPaid) return sum; // Already paid!

    const amount = Number(r.amount);
    if (r.frequency === 'weekly') return sum + (amount * 4);
    if (r.frequency === 'yearly') return sum + (amount / 12);
    return sum + amount; // monthly
  }, 0);

  const savings = calculateSavings(totalIncome, totalExpenses);
  const availableBalance = initialBalance + totalIncome - totalExpenses;
  const estimatedFreeBalance = availableBalance - totalRecurring;

  return {
    month,
    year,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    savings,
    savings_percentage: calculateSavingsPercentage(totalIncome, totalExpenses),
    fixed_expenses: fixedExpenses,
    variable_expenses: variableExpenses,
    total_recurring: Math.round(totalRecurring * 100) / 100,
    initial_balance: Math.round(initialBalance * 100) / 100,
    available_balance: Math.round(availableBalance * 100) / 100,
    estimated_free_balance: Math.round(estimatedFreeBalance * 100) / 100,
  };
}

export async function getDashboardData(year?: number, month?: number): Promise<ActionResult<DashboardData>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const now = new Date();
  const currentYear = year || now.getFullYear();
  const currentMonth = month || (now.getMonth() + 1);

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const [current, previous] = await Promise.all([
    getMonthData(supabase, currentYear, currentMonth),
    getMonthData(supabase, prevYear, prevMonth),
  ]);

  const hasPrevData = previous.total_income > 0 || previous.total_expenses > 0;

  return {
    success: true,
    data: {
      current_month: current,
      previous_month: hasPrevData ? previous : null,
      income_change: hasPrevData ? getPercentageChange(current.total_income, previous.total_income) : null,
      expense_change: hasPrevData ? getPercentageChange(current.total_expenses, previous.total_expenses) : null,
      savings_change: hasPrevData ? getPercentageChange(current.savings, previous.savings) : null,
      total_recurring: current.total_recurring,
      initial_balance: current.initial_balance,
      available_balance: current.available_balance,
      estimated_free_balance: current.estimated_free_balance,
    },
  };
}

export async function getMonthlyReport(year: number): Promise<ActionResult<MonthlyReport[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const reports = await Promise.all(months.map((m) => getMonthData(supabase, year, m)));

  return { success: true, data: reports };
}

export async function getAnnualReport(year: number): Promise<ActionResult<AnnualReport>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthlyData = await Promise.all(months.map((m) => getMonthData(supabase, year, m)));

  const totalIncome = monthlyData.reduce((s, m) => s + m.total_income, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.total_expenses, 0);

  return {
    success: true,
    data: {
      year,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      savings: calculateSavings(totalIncome, totalExpenses),
      savings_percentage: calculateSavingsPercentage(totalIncome, totalExpenses),
      monthly_data: monthlyData,
    },
  };
}

export async function getCategoryBreakdown(year: number, month: number, type: 'income' | 'expense'): Promise<ActionResult<CategoryBreakdown[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const table = type === 'income' ? 'incomes' : 'expenses';
  const { data, error } = await supabase
    .from(table)
    .select('amount, category:categories(name, icon)')
    .gte('date', startDate)
    .lt('date', endDate);

  if (error) return { success: false, error: 'Error al cargar los datos' };

  const grouped: Record<string, { total: number; icon: string | null; count: number }> = {};
  let grandTotal = 0;

  for (const row of data || []) {
    const cat = row.category as unknown as { name: string; icon: string | null };
    const name = cat?.name || 'Sin categoría';
    const icon = cat?.icon || null;
    const amount = Number(row.amount);

    if (!grouped[name]) grouped[name] = { total: 0, icon, count: 0 };
    grouped[name].total += amount;
    grouped[name].count += 1;
    grandTotal += amount;
  }

  const breakdown: CategoryBreakdown[] = Object.entries(grouped)
    .map(([name, val]) => ({
      category_name: name,
      category_icon: val.icon,
      total: val.total,
      percentage: grandTotal > 0 ? Math.round((val.total / grandTotal) * 10000) / 100 : 0,
      count: val.count,
    }))
    .sort((a, b) => b.total - a.total);

  return { success: true, data: breakdown };
}

export async function getAvailableYears(): Promise<ActionResult<number[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const [incomes, expenses] = await Promise.all([
    supabase.from('incomes').select('date').order('date', { ascending: true }).limit(1),
    supabase.from('expenses').select('date').order('date', { ascending: true }).limit(1),
  ]);

  const currentYear = new Date().getFullYear();
  const dates = [...(incomes.data || []), ...(expenses.data || [])].map((r) => new Date(r.date).getFullYear());
  const minYear = dates.length > 0 ? Math.min(...dates) : currentYear;

  const years: number[] = [];
  for (let y = minYear; y <= currentYear; y++) years.push(y);
  if (years.length === 0) years.push(currentYear);

  return { success: true, data: years };
}
