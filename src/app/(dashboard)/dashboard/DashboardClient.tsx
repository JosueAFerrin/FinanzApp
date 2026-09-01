'use client';

import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Wallet,
  Target,
} from 'lucide-react';
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/utils';
import type { DashboardData } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';

interface Props {
  initialData: DashboardData | null;
}

export default function DashboardClient({ initialData }: Props) {
  const data = initialData;
  const currentMonthName = getMonthName(getCurrentMonth());
  const currentYear = getCurrentYear();

  if (!data || (data.current_month.total_income === 0 && data.current_month.total_expenses === 0)) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-dark-900 mb-2">Dashboard</h1>
        <p className="text-dark-500 mb-8">{currentMonthName} {currentYear}</p>
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-primary-400" />}
          title="¡Bienvenido a FinanzApp!"
          description="Comienza registrando tu primer ingreso o gasto para ver tu resumen financiero aquí."
          actionLabel="Registrar primer movimiento"
          onAction={() => window.location.href = '/incomes'}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <QuickActionCard
            href="/incomes"
            icon={<TrendingUp className="w-6 h-6 text-success-500" />}
            title="Registrar ingreso"
            desc="Agrega tus fuentes de ingresos"
            color="bg-success-50"
          />
          <QuickActionCard
            href="/expenses"
            icon={<TrendingDown className="w-6 h-6 text-danger-500" />}
            title="Registrar gasto"
            desc="Registra tus gastos diarios"
            color="bg-danger-50"
          />
          <QuickActionCard
            href="/categories"
            icon={<Target className="w-6 h-6 text-primary-500" />}
            title="Ver categorías"
            desc="Personaliza tus categorías"
            color="bg-primary-50"
          />
        </div>
      </div>
    );
  }

  const { current_month, previous_month, income_change, expense_change, savings_change } = data;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Dashboard</h1>
        <p className="text-dark-500">{currentMonthName} {currentYear}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-success-600" />}
          label="Ingresos"
          value={formatCurrency(current_month.total_income)}
          change={income_change}
          positive
          bgColor="bg-success-50"
        />
        <SummaryCard
          icon={<TrendingDown className="w-5 h-5 text-danger-600" />}
          label="Egresos"
          value={formatCurrency(current_month.total_expenses)}
          change={expense_change}
          positive={false}
          bgColor="bg-danger-50"
        />
        <SummaryCard
          icon={<PiggyBank className="w-5 h-5 text-primary-600" />}
          label="Ahorro"
          value={formatCurrency(current_month.savings)}
          change={savings_change}
          positive={current_month.savings >= 0}
          bgColor="bg-primary-50"
        />
        <SummaryCard
          icon={<Percent className="w-5 h-5 text-warning-600" />}
          label="% Ahorro"
          value={`${current_month.savings_percentage}%`}
          bgColor="bg-warning-50"
        />
      </div>

      {/* Expense breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100">
          <h3 className="text-sm font-semibold text-dark-500 mb-4">Distribución de gastos</h3>
          <div className="space-y-3">
            <ExpenseBar label="Gastos fijos" amount={current_month.fixed_expenses} total={current_month.total_expenses} color="bg-warning-500" />
            <ExpenseBar label="Gastos variables" amount={current_month.variable_expenses} total={current_month.total_expenses} color="bg-purple-500" />
          </div>
        </div>

        {previous_month && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100">
            <h3 className="text-sm font-semibold text-dark-500 mb-4">
              Comparación con {getMonthName(previous_month.month)}
            </h3>
            <div className="space-y-4">
              <ComparisonRow label="Ingresos" current={current_month.total_income} previous={previous_month.total_income} />
              <ComparisonRow label="Egresos" current={current_month.total_expenses} previous={previous_month.total_expenses} invertColors />
              <ComparisonRow label="Ahorro" current={current_month.savings} previous={previous_month.savings} />
            </div>
          </div>
        )}
      </div>

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
          desc="Registra un gasto"
          color="bg-danger-50"
        />
        <QuickActionCard
          href="/reports"
          icon={<Target className="w-6 h-6 text-primary-500" />}
          title="Ver reportes"
          desc="Analiza tus finanzas"
          color="bg-primary-50"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  icon, label, value, change, positive, bgColor,
}: {
  icon: React.ReactNode; label: string; value: string; change?: number | null; positive?: boolean; bgColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-dark-100 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-dark-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-dark-900">{value}</p>
      {change !== null && change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? (positive ? 'text-success-600' : 'text-danger-600') : (positive ? 'text-danger-600' : 'text-success-600')}`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}% vs mes anterior
        </div>
      )}
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

function ComparisonRow({ label, current, previous, invertColors }: { label: string; current: number; previous: number; invertColors?: boolean }) {
  const diff = current - previous;
  const isPositive = invertColors ? diff <= 0 : diff >= 0;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-dark-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-dark-900">{formatCurrency(current)}</span>
        <span className={`text-xs font-medium flex items-center gap-0.5 ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
          {diff === 0 ? <Minus className="w-3 h-3" /> : diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {formatCurrency(Math.abs(diff))}
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
