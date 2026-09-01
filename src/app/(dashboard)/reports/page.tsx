'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Calendar } from 'lucide-react';
import { getMonthlyReport, getAnnualReport, getCategoryBreakdown, getAvailableYears } from '@/actions/reports';
import type { MonthlyReport, AnnualReport, CategoryBreakdown } from '@/types';
import { formatCurrency, getMonthName, getCurrentYear, getCurrentMonth } from '@/lib/utils';
import { CHART_COLORS, CATEGORY_CHART_COLORS } from '@/lib/constants';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/Loading';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [availableYears, setAvailableYears] = useState<number[]>([getCurrentYear()]);
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);
  const [annualData, setAnnualData] = useState<AnnualReport | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual' | 'categories'>('monthly');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [yearsRes, monthlyRes, annualRes, expBrkRes, incBrkRes] = await Promise.all([
      getAvailableYears(),
      getMonthlyReport(selectedYear),
      getAnnualReport(selectedYear),
      getCategoryBreakdown(selectedYear, getCurrentMonth(), 'expense'),
      getCategoryBreakdown(selectedYear, getCurrentMonth(), 'income'),
    ]);
    if (yearsRes.success && yearsRes.data) setAvailableYears(yearsRes.data);
    if (monthlyRes.success && monthlyRes.data) setMonthlyData(monthlyRes.data);
    if (annualRes.success) setAnnualData(annualRes.data || null);
    if (expBrkRes.success && expBrkRes.data) setExpenseBreakdown(expBrkRes.data);
    if (incBrkRes.success && incBrkRes.data) setIncomeBreakdown(incBrkRes.data);
    setLoading(false);
  }, [selectedYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const chartData = monthlyData.map((m) => ({
    name: getMonthName(m.month).substring(0, 3),
    Ingresos: m.total_income,
    Egresos: m.total_expenses,
    Ahorro: m.savings,
  }));

  const hasData = monthlyData.some((m) => m.total_income > 0 || m.total_expenses > 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Reportes</h1>
          <p className="text-dark-500 text-sm">Analiza tu comportamiento financiero</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-dark-400" />
          <Select
            id="yearSelector"
            value={String(selectedYear)}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            options={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-100 p-1 rounded-xl w-fit">
        {(['monthly', 'annual', 'categories'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}
          >
            {tab === 'monthly' ? 'Mensual' : tab === 'annual' ? 'Anual' : 'Categorías'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !hasData ? (
        <EmptyState icon={<BarChart3 className="w-8 h-8 text-primary-400" />} title="Sin datos para mostrar" description="Registra ingresos y gastos para ver tus reportes aquí." />
      ) : (
        <>
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              {/* Line Chart */}
              <div className="bg-white rounded-2xl p-6 border border-dark-100">
                <h3 className="text-lg font-bold text-dark-900 mb-4">Evolución mensual — {selectedYear}</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Ingresos" stroke={CHART_COLORS.income} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Egresos" stroke={CHART_COLORS.expense} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Ahorro" stroke={CHART_COLORS.savings} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly table */}
              <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-dark-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-dark-600">Mes</th>
                        <th className="text-right px-4 py-3 font-semibold text-dark-600">Ingresos</th>
                        <th className="text-right px-4 py-3 font-semibold text-dark-600">Egresos</th>
                        <th className="text-right px-4 py-3 font-semibold text-dark-600">Ahorro</th>
                        <th className="text-right px-4 py-3 font-semibold text-dark-600">% Ahorro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((m) => (
                        <tr key={m.month} className="border-t border-dark-50 hover:bg-dark-50/50">
                          <td className="px-4 py-3 font-medium text-dark-900">{getMonthName(m.month)}</td>
                          <td className="px-4 py-3 text-right text-success-600 font-medium">{formatCurrency(m.total_income)}</td>
                          <td className="px-4 py-3 text-right text-danger-600 font-medium">{formatCurrency(m.total_expenses)}</td>
                          <td className={`px-4 py-3 text-right font-bold ${m.savings >= 0 ? 'text-primary-600' : 'text-danger-600'}`}>{formatCurrency(m.savings)}</td>
                          <td className="px-4 py-3 text-right text-dark-500">{m.savings_percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'annual' && annualData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AnnualCard label="Ingresos totales" value={formatCurrency(annualData.total_income)} color="text-success-600" />
                <AnnualCard label="Egresos totales" value={formatCurrency(annualData.total_expenses)} color="text-danger-600" />
                <AnnualCard label="Ahorro anual" value={formatCurrency(annualData.savings)} color="text-primary-600" />
                <AnnualCard label="% Ahorro" value={`${annualData.savings_percentage}%`} color="text-warning-600" />
              </div>

              <div className="bg-white rounded-2xl p-6 border border-dark-100">
                <h3 className="text-lg font-bold text-dark-900 mb-4">Resumen anual — {selectedYear}</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                      <Legend />
                      <Bar dataKey="Ingresos" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Egresos" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryChart title="Distribución de gastos" data={expenseBreakdown} month={getMonthName(getCurrentMonth())} />
              <CategoryChart title="Distribución de ingresos" data={incomeBreakdown} month={getMonthName(getCurrentMonth())} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AnnualCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-dark-100">
      <p className="text-xs font-medium text-dark-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function CategoryChart({ title, data, month }: { title: string; data: CategoryBreakdown[]; month: string }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-dark-100">
        <h3 className="text-lg font-bold text-dark-900 mb-2">{title}</h3>
        <p className="text-sm text-dark-400">Sin datos para {month}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-dark-100">
      <h3 className="text-lg font-bold text-dark-900 mb-1">{title}</h3>
      <p className="text-xs text-dark-400 mb-4">{month}</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="total" nameKey="category_name">
              {data.map((_, i) => (
                <Cell key={i} fill={CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-4">
        {data.map((cat, i) => (
          <div key={cat.category_name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length] }} />
              <span className="text-dark-600">{cat.category_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-dark-900">{formatCurrency(cat.total)}</span>
              <span className="text-dark-400 text-xs">{cat.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
