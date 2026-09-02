'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Wallet,
  Repeat,
  ShieldAlert,
  Calendar,
  Landmark,
} from 'lucide-react';
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/utils';
import type { DashboardData } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';

interface Props {
  initialData: DashboardData | null;
  selectedMonth?: number;
  selectedYear?: number;
}

export default function DashboardClient({ initialData, selectedMonth, selectedYear }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const data = initialData;

  const currentMonthNum = selectedMonth || getCurrentMonth();
  const currentYearNum = selectedYear || getCurrentYear();
  const currentMonthName = getMonthName(currentMonthNum);

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const m = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', m);
    params.set('year', String(currentYearNum));
    router.push(`/dashboard?${params.toString()}`);
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const y = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', String(currentMonthNum));
    params.set('year', y);
    router.push(`/dashboard?${params.toString()}`);
  }

  if (!data) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Dashboard</h1>
          <p className="text-dark-500">{currentMonthName} {currentYearNum}</p>
        </div>
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-primary-400" />}
          title="¡Bienvenido a FinanzApp!"
          description="Comienza registrando tu primer ingreso o gasto para ver tu resumen financiero aquí."
          actionLabel="Registrar primer movimiento"
          onAction={() => window.location.href = '/incomes'}
        />
      </div>
    );
  }

  const {
    current_month,
    previous_month,
    income_change,
    expense_change,
    total_recurring,
    total_recurring_income,
    initial_balance,
    available_balance,
    estimated_free_balance,
  } = data;

  const hasAnyActivity = initial_balance !== 0 || current_month.total_income > 0 || current_month.total_expenses > 0 || total_recurring > 0;

  const monthsList = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header & Month/Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-dark-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Dashboard</h1>
          <p className="text-dark-500 text-xs mt-0.5">Resumen financiero de {currentMonthName} {currentYearNum}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month/Year selector */}
          <div className="flex items-center gap-2 bg-dark-50 p-1.5 rounded-xl border border-dark-200">
            <Calendar className="w-4 h-4 text-dark-500 ml-1.5" />
            <select
              value={currentMonthNum}
              onChange={handleMonthChange}
              className="bg-transparent text-xs font-semibold text-dark-800 focus:outline-none cursor-pointer pr-1"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={currentYearNum}
              onChange={handleYearChange}
              className="bg-transparent text-xs font-semibold text-dark-800 focus:outline-none cursor-pointer pr-1"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Link href="/incomes" className="px-3 py-2 rounded-xl bg-success-50 text-success-700 text-xs font-semibold hover:bg-success-100 transition-colors flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-success-600" /> + Ingreso
            </Link>
            <Link href="/expenses" className="px-3 py-2 rounded-xl bg-danger-50 text-danger-700 text-xs font-semibold hover:bg-danger-100 transition-colors flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-danger-600" /> - Gasto
            </Link>
          </div>
        </div>
      </div>

      {!hasAnyActivity ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-primary-400" />}
          title={`Sin actividad en ${currentMonthName} ${currentYearNum}`}
          description="Selecciona otro mes o registra tu primer movimiento para comenzar a visualizar tus estadísticas."
          actionLabel="Registrar movimiento"
          onAction={() => window.location.href = '/incomes'}
        />
      ) : (
        <>
          {/* Top 4 Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Landmark className="w-5 h-5 text-primary-600" />}
              label="Saldo Inicial del Mes"
              value={formatCurrency(initial_balance)}
              valueColor="text-primary-600"
              subtext="Remanente de meses anteriores"
              bgColor="bg-primary-50"
            />
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5 text-success-600" />}
              label="Ingresos del Mes"
              value={formatCurrency(current_month.total_income)}
              valueColor="text-success-600"
              change={income_change}
              positive
              bgColor="bg-success-50"
            />
            <SummaryCard
              icon={<TrendingDown className="w-5 h-5 text-danger-600" />}
              label="Egresos del Mes"
              value={formatCurrency(current_month.total_expenses)}
              valueColor="text-danger-600"
              change={expense_change}
              positive={false}
              bgColor="bg-danger-50"
            />
            <SummaryCard
              icon={<PiggyBank className="w-5 h-5 text-indigo-600" />}
              label="Saldo Disponible Real"
              value={formatCurrency(available_balance)}
              valueColor={available_balance >= 0 ? 'text-indigo-700 font-extrabold' : 'text-danger-600'}
              subtext="Inicial + Ingresos - Egresos"
              bgColor="bg-indigo-50"
            />
          </div>

          {/* Budget & Projection Banner */}
          <div className="bg-gradient-to-r from-primary-900 to-dark-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div>
                <p className="text-xs font-semibold text-primary-200 uppercase tracking-wider mb-1">Presupuesto Disponible ({currentMonthName})</p>
                <h3 className="text-2xl font-extrabold text-white">{formatCurrency(available_balance)}</h3>
                <p className="text-xs text-dark-300 mt-1">Saldo acumulado + ingresos del mes</p>
              </div>

              {total_recurring_income > 0 && (
                <div className="border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                  <p className="text-xs font-semibold text-success-300 uppercase tracking-wider mb-1">Ingresos Pendientes</p>
                  <h3 className="text-2xl font-extrabold text-success-400">+{formatCurrency(total_recurring_income)}</h3>
                  <p className="text-xs text-dark-300 mt-1">Salarios/ingresos recurrentes por recibir</p>
                </div>
              )}

              <div className="border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                <p className="text-xs font-semibold text-warning-300 uppercase tracking-wider mb-1">Compromisos Fijos (Recurrentes)</p>
                <h3 className="text-2xl font-extrabold text-warning-400">{formatCurrency(total_recurring)}</h3>
                <p className="text-xs text-dark-300 mt-1">
                  {available_balance > 0
                    ? `${((total_recurring / available_balance) * 100).toFixed(1)}% de tu presupuesto libre asignado a fijos`
                    : 'Configura tus pagos recurrentes'}
                </p>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                <p className="text-xs font-semibold text-success-300 uppercase tracking-wider mb-1">Disponible Libre Estimado</p>
                <h3 className={`text-2xl font-extrabold ${estimated_free_balance >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                  {formatCurrency(estimated_free_balance)}
                </h3>
                <p className="text-xs text-dark-300 mt-1">Disponible real tras cubrir compromisos fijos</p>
              </div>
            </div>
          </div>

          {/* Expense breakdown & Comparisons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100">
              <h3 className="text-sm font-semibold text-dark-500 mb-4">Distribución de Gastos</h3>
              {current_month.total_expenses === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium text-dark-600">No has registrado egresos en {currentMonthName}</p>
                  <p className="text-xs text-dark-400 mt-1">Tus gastos de este periodo son {formatCurrency(0)}.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ExpenseBar label="Gastos fijos" amount={current_month.fixed_expenses} total={current_month.total_expenses} color="bg-warning-500" />
                  <ExpenseBar label="Gastos variables" amount={current_month.variable_expenses} total={current_month.total_expenses} color="bg-purple-500" />
                </div>
              )}
            </div>

            {previous_month ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100">
                <h3 className="text-sm font-semibold text-dark-500 mb-4">
                  Comparación con {getMonthName(previous_month.month)}
                </h3>
                <div className="space-y-4">
                  <ComparisonRow label="Ingresos" current={current_month.total_income} previous={previous_month.total_income} />
                  <ComparisonRow label="Egresos" current={current_month.total_expenses} previous={previous_month.total_expenses} invertColors />
                  <ComparisonRow label="Ahorro del mes" current={current_month.savings} previous={previous_month.savings} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100 flex flex-col justify-center items-center text-center p-6">
                <ShieldAlert className="w-8 h-8 text-primary-400 mb-2" />
                <h4 className="text-sm font-bold text-dark-800">Sin datos del mes anterior</h4>
                <p className="text-xs text-dark-400 mt-1 max-w-xs">A medida que registres transacciones mes a mes, verás comparativas automáticas sobre la evolución de tus finanzas.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickActionCard
          href="/incomes"
          icon={<TrendingUp className="w-6 h-6 text-success-500" />}
          title="Registrar ingreso"
          desc="Agrega un nuevo ingreso"
          color="bg-success-50"
        />
        <QuickActionCard
          href="/expenses"
          icon={<TrendingDown className="w-6 h-6 text-danger-500" />}
          title="Registrar gasto"
          desc="Registra un gasto diario"
          color="bg-danger-50"
        />
        <QuickActionCard
          href="/recurring"
          icon={<Repeat className="w-6 h-6 text-warning-500" />}
          title="Gestionar recurrentes"
          desc="Configura deudas y servicios fijos"
          color="bg-warning-50"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  icon, label, value, valueColor, change, positive, bgColor, subtext,
}: {
  icon: React.ReactNode; label: string; value: string; valueColor?: string; change?: number | null; positive?: boolean; bgColor: string; subtext?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-dark-100 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-dark-500 mb-1">{label}</p>
      <p className={`text-xl font-extrabold ${valueColor || 'text-dark-900'}`}>{value}</p>
      {change !== null && change !== undefined ? (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? (positive ? 'text-success-600' : 'text-danger-600') : (positive ? 'text-danger-600' : 'text-success-600')}`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}% vs mes anterior
        </div>
      ) : subtext ? (
        <p className="text-xs text-dark-400 mt-2">{subtext}</p>
      ) : null}
    </div>
  );
}

function ExpenseBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-dark-600 font-medium">{label}</span>
        <span className="text-dark-900 font-semibold">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-dark-400 mt-1">{pct.toFixed(1)}% del total</p>
    </div>
  );
}

function ComparisonRow({
  label,
  current,
  previous,
  invertColors,
}: {
  label: string;
  current: number;
  previous: number;
  invertColors?: boolean;
}) {
  const diff = current - previous;
  let isGood = diff >= 0;
  if (invertColors) {
    isGood = diff <= 0;
  }

  const colorClass = diff === 0 ? 'text-dark-400' : isGood ? 'text-success-600' : 'text-danger-600';
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-dark-600 font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-dark-900">{formatCurrency(current)}</span>
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${colorClass}`}>
          {diff === 0 ? (
            <Minus className="w-3 h-3 text-dark-400" />
          ) : diff > 0 ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {sign}{formatCurrency(Math.abs(diff))}
        </span>
      </div>
    </div>
  );
}

function QuickActionCard({ href, icon, title, desc, color }: { href: string; icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <Link href={href} className="bg-white rounded-2xl p-5 shadow-sm border border-dark-100 hover:shadow-md hover:-translate-y-0.5 transition-all group">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold text-dark-900">{title}</h3>
      <p className="text-xs text-dark-500 mt-1">{desc}</p>
    </Link>
  );
}
