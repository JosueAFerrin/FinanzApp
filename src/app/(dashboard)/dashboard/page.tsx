import { getDashboardData } from '@/actions/reports';
import DashboardClient from './DashboardClient';

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month, 10) : undefined;
  const year = params.year ? parseInt(params.year, 10) : undefined;

  const result = await getDashboardData(year, month);
  return <DashboardClient initialData={result.data || null} selectedMonth={month} selectedYear={year} />;
}
