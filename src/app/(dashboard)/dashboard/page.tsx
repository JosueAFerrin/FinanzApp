import { getDashboardData } from '@/actions/reports';
import { processDueRecurringExpenses } from '@/actions/recurring';
import { processDueRecurringIncomes } from '@/actions/recurringIncomes';
import DashboardClient from './DashboardClient';

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month, 10) : undefined;
  const year = params.year ? parseInt(params.year, 10) : undefined;

  // Auto-process recurring expenses & incomes that are due before loading dashboard data.
  // This ensures items like gym memberships, subscriptions, and salaries are automatically
  // converted to actual transactions when their scheduled date arrives.
  await Promise.all([
    processDueRecurringExpenses(),
    processDueRecurringIncomes(),
  ]);

  const result = await getDashboardData(year, month);
  return <DashboardClient initialData={result.data || null} selectedMonth={month} selectedYear={year} />;
}
