import { getDashboardData } from '@/actions/reports';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const result = await getDashboardData();
  return <DashboardClient initialData={result.data || null} />;
}
