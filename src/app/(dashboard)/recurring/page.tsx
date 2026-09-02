'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Repeat, Edit2, Trash2, ToggleLeft, ToggleRight, Zap, TrendingUp, TrendingDown, Briefcase, CalendarClock, CalendarDays } from 'lucide-react';
import {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringExpense,
  registerRecurringAsExpense,
} from '@/actions/recurring';
import {
  getRecurringIncomes,
  createRecurringIncome,
  updateRecurringIncome,
  deleteRecurringIncome,
  toggleRecurringIncome,
  registerRecurringAsIncome,
} from '@/actions/recurringIncomes';
import { getCategories } from '@/actions/categories';
import type { RecurringExpense, RecurringIncome, Category } from '@/types';
import { FREQUENCY_LABELS, INCOME_TYPES } from '@/lib/constants';
import { formatCurrency, formatDate, getLastBusinessDayOfMonth, getMonthName } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

type ActiveTab = 'expenses' | 'incomes';

export default function RecurringPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('expenses');
  const [expenseItems, setExpenseItems] = useState<RecurringExpense[]>([]);
  const [incomeItems, setIncomeItems] = useState<RecurringIncome[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [editingIncome, setEditingIncome] = useState<RecurringIncome | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { success, error: showError, ToastContainer } = useToast();

  // Income form state
  const [isSalary, setIsSalary] = useState(false);
  const [salaryLastBDay, setSalaryLastBDay] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [expRes, incRes, eCats, iCats] = await Promise.all([
      getRecurringExpenses(),
      getRecurringIncomes(),
      getCategories('expense'),
      getCategories('income'),
    ]);
    if (expRes.success && expRes.data) setExpenseItems(expRes.data);
    if (incRes.success && incRes.data) setIncomeItems(incRes.data);
    if (eCats.success && eCats.data) setExpenseCategories(eCats.data);
    if (iCats.success && iCats.data) setIncomeCategories(iCats.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function openNewModal() {
    setEditingExpense(null);
    setEditingIncome(null);
    // Default income_type is 'salary', so sync isSalary state
    setIsSalary(activeTab === 'incomes');
    setSalaryLastBDay(true);
    setModalOpen(true);
  }

  function openEditExpense(item: RecurringExpense) {
    setEditingExpense(item);
    setEditingIncome(null);
    setModalOpen(true);
  }

  function openEditIncome(item: RecurringIncome) {
    setEditingIncome(item);
    setEditingExpense(null);
    setIsSalary(item.is_salary);
    setSalaryLastBDay(item.salary_last_business_day);
    setModalOpen(true);
  }

  async function handleSaveExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.set('is_active', 'true');
    const result = editingExpense
      ? await updateRecurringExpense(editingExpense.id, formData)
      : await createRecurringExpense(formData);
    if (result.success) {
      success(editingExpense ? 'Gasto recurrente actualizado' : 'Gasto recurrente creado');
      setModalOpen(false);
      setEditingExpense(null);
      loadData();
    } else {
      showError(result.error || 'Error');
    }
    setSaving(false);
  }

  async function handleSaveIncome(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.set('is_active', 'true');
    formData.set('is_salary', String(isSalary));
    formData.set('salary_last_business_day', String(isSalary && salaryLastBDay));
    if (!isSalary || salaryLastBDay) {
      // If salary with last business day, clear payment_day
      if (isSalary && salaryLastBDay) formData.delete('payment_day');
    }
    const result = editingIncome
      ? await updateRecurringIncome(editingIncome.id, formData)
      : await createRecurringIncome(formData);
    if (result.success) {
      success(editingIncome ? 'Ingreso recurrente actualizado' : 'Ingreso recurrente creado');
      setModalOpen(false);
      setEditingIncome(null);
      setIsSalary(false);
      setSalaryLastBDay(true);
      loadData();
    } else {
      showError(result.error || 'Error');
    }
    setSaving(false);
  }

  async function handleToggleExpense(id: string, current: boolean) {
    const result = await toggleRecurringExpense(id, !current);
    if (result.success) { success(!current ? 'Activado' : 'Desactivado'); loadData(); }
    else showError(result.error || 'Error');
  }

  async function handleToggleIncome(id: string, current: boolean) {
    const result = await toggleRecurringIncome(id, !current);
    if (result.success) { success(!current ? 'Activado' : 'Desactivado'); loadData(); }
    else showError(result.error || 'Error');
  }

  async function handleRegisterExpenseNow(id: string) {
    setProcessingId(id);
    const result = await registerRecurringAsExpense(id);
    if (result.success) { success('Cobro registrado en tus Egresos'); loadData(); }
    else showError(result.error || 'Error');
    setProcessingId(null);
  }

  async function handleRegisterIncomeNow(id: string) {
    setProcessingId(id);
    const result = await registerRecurringAsIncome(id);
    if (result.success) { success('Ingreso registrado en tus Ingresos'); loadData(); }
    else showError(result.error || 'Error');
    setProcessingId(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = activeTab === 'expenses'
      ? await deleteRecurringExpense(deleteId)
      : await deleteRecurringIncome(deleteId);
    if (result.success) { success('Eliminado'); setDeleteId(null); loadData(); }
    else showError(result.error || 'Error');
    setDeleting(false);
  }

  const totalMonthlyExpenses = expenseItems.filter(i => i.is_active && i.frequency === 'monthly').reduce((s, i) => s + Number(i.amount), 0);
  const totalMonthlyIncomes = incomeItems.filter(i => i.is_active && i.frequency === 'monthly').reduce((s, i) => s + Number(i.amount), 0);

  const now = new Date();
  const lastBDay = getLastBusinessDayOfMonth(now.getFullYear(), now.getMonth() + 1);

  return (
    <div className="animate-fade-in space-y-6">
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Recurrentes</h1>
          <p className="text-dark-500 text-sm">Gestiona tus ingresos y gastos recurrentes</p>
        </div>
        <Button onClick={openNewModal}>
          <Plus className="w-4 h-4" /> {activeTab === 'expenses' ? 'Nuevo gasto' : 'Nuevo ingreso'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'expenses' ? 'bg-white text-danger-600 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}
        >
          <TrendingDown className="w-4 h-4" /> Egresos
        </button>
        <button
          onClick={() => setActiveTab('incomes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'incomes' ? 'bg-white text-success-600 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}
        >
          <TrendingUp className="w-4 h-4" /> Ingresos
        </button>
      </div>

      {/* Summary banner */}
      {activeTab === 'expenses' && expenseItems.length > 0 && (
        <div className="bg-gradient-to-r from-danger-600 to-danger-500 rounded-2xl p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-red-100">Total mensual de egresos recurrentes</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonthlyExpenses)}</p>
          <p className="text-sm text-red-200 mt-2">{expenseItems.filter(i => i.is_active).length} gastos activos</p>
        </div>
      )}
      {activeTab === 'incomes' && incomeItems.length > 0 && (
        <div className="bg-gradient-to-r from-success-600 to-success-500 rounded-2xl p-6 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-100">Total mensual de ingresos recurrentes</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonthlyIncomes)}</p>
              <p className="text-sm text-emerald-200 mt-2">{incomeItems.filter(i => i.is_active).length} ingresos activos</p>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2.5 backdrop-blur-sm">
              <CalendarClock className="w-4 h-4 text-emerald-100" />
              <span className="text-xs font-medium text-emerald-50">
                Último día laboral de {getMonthName(now.getMonth() + 1)}: <strong className="text-white">{lastBDay}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <TableSkeleton />
      ) : activeTab === 'expenses' ? (
        expenseItems.length === 0 ? (
          <EmptyState icon={<Repeat className="w-8 h-8 text-primary-400" />} title="Sin gastos recurrentes" description="Agrega tus gastos fijos como alquiler, suscripciones, etc." actionLabel="Agregar" onAction={openNewModal} />
        ) : (
          <div className="space-y-3">
            {expenseItems.map(item => (
              <div key={item.id} className={`bg-white rounded-2xl p-4 border border-dark-100 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all ${!item.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => handleToggleExpense(item.id, item.is_active)} className="flex-shrink-0">
                    {item.is_active ? <ToggleRight className="w-8 h-8 text-primary-600" /> : <ToggleLeft className="w-8 h-8 text-dark-300" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-900 truncate">{item.name}</p>
                    <p className="text-xs text-dark-500">{item.category?.name} · {FREQUENCY_LABELS[item.frequency]} · Desde {formatDate(item.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dark-50">
                  <p className="text-sm font-extrabold text-danger-600">{formatCurrency(item.amount)}</p>
                  {item.is_active && (
                    <button onClick={() => handleRegisterExpenseNow(item.id)} disabled={processingId === item.id} title="Registrar cobro manual" className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                      <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      {processingId === item.id ? 'Registrando...' : 'Registrar Cobro'}
                    </button>
                  )}
                  <div className="flex gap-1">
                    <button onClick={() => openEditExpense(item)} className="p-2 rounded-xl hover:bg-dark-50 transition-colors"><Edit2 className="w-4 h-4 text-dark-400" /></button>
                    <button onClick={() => setDeleteId(item.id)} className="p-2 rounded-xl hover:bg-danger-50 transition-colors"><Trash2 className="w-4 h-4 text-dark-400 hover:text-danger-500" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        incomeItems.length === 0 ? (
          <EmptyState icon={<TrendingUp className="w-8 h-8 text-success-500" />} title="Sin ingresos recurrentes" description="Agrega tu salario u otros ingresos periódicos para automatizar su registro." actionLabel="Agregar ingreso" onAction={openNewModal} />
        ) : (
          <div className="space-y-3">
            {incomeItems.map(item => (
              <div key={item.id} className={`bg-white rounded-2xl p-4 border border-dark-100 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all ${!item.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => handleToggleIncome(item.id, item.is_active)} className="flex-shrink-0">
                    {item.is_active ? <ToggleRight className="w-8 h-8 text-success-600" /> : <ToggleLeft className="w-8 h-8 text-dark-300" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-dark-900 truncate">{item.name}</p>
                      {item.is_salary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider">
                          <Briefcase className="w-3 h-3" /> Salario
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-500">
                      {item.category?.name} · {FREQUENCY_LABELS[item.frequency]}
                      {item.is_salary && item.salary_last_business_day
                        ? ' · Último día laboral'
                        : item.payment_day
                          ? ` · Día ${item.payment_day} del mes`
                          : ` · Desde ${formatDate(item.start_date)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dark-50">
                  <p className="text-sm font-extrabold text-success-600">+{formatCurrency(item.amount)}</p>
                  {item.is_active && (
                    <button onClick={() => handleRegisterIncomeNow(item.id)} disabled={processingId === item.id} title="Registrar ingreso manual" className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
                      {processingId === item.id ? 'Registrando...' : 'Registrar Ingreso'}
                    </button>
                  )}
                  <div className="flex gap-1">
                    <button onClick={() => openEditIncome(item)} className="p-2 rounded-xl hover:bg-dark-50 transition-colors"><Edit2 className="w-4 h-4 text-dark-400" /></button>
                    <button onClick={() => setDeleteId(item.id)} className="p-2 rounded-xl hover:bg-danger-50 transition-colors"><Trash2 className="w-4 h-4 text-dark-400 hover:text-danger-500" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Expense Modal */}
      <Modal isOpen={modalOpen && activeTab === 'expenses'} onClose={() => { setModalOpen(false); setEditingExpense(null); }} title={editingExpense ? 'Editar gasto recurrente' : 'Nuevo gasto recurrente'}>
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <Input id="name" name="name" label="Nombre" placeholder="Ej: Netflix" required defaultValue={editingExpense?.name} />
          <Input id="amount" name="amount" type="number" step="0.01" label="Monto" placeholder="0.00" required defaultValue={editingExpense?.amount} />
          <Select id="category_id" name="category_id" label="Categoría" placeholder="Selecciona" required defaultValue={editingExpense?.category_id} options={expenseCategories.map(c => ({ value: c.id, label: c.name }))} />
          <Select id="frequency" name="frequency" label="Frecuencia" required defaultValue={editingExpense?.frequency || 'monthly'} options={[{ value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensual' }, { value: 'yearly', label: 'Anual' }]} />
          <Input id="start_date" name="start_date" type="date" label="Fecha de inicio" required defaultValue={editingExpense?.start_date} />
          <Input id="end_date" name="end_date" type="date" label="Fecha de finalización (opcional)" defaultValue={editingExpense?.end_date || ''} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => { setModalOpen(false); setEditingExpense(null); }}>Cancelar</Button>
            <Button type="submit" fullWidth loading={saving}>{editingExpense ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      {/* Income Modal */}
      <Modal isOpen={modalOpen && activeTab === 'incomes'} onClose={() => { setModalOpen(false); setEditingIncome(null); setIsSalary(false); setSalaryLastBDay(true); }} title={editingIncome ? 'Editar ingreso recurrente' : 'Nuevo ingreso recurrente'}>
        <form onSubmit={handleSaveIncome} className="space-y-4">
          <Input id="ri_name" name="name" label="Nombre" placeholder="Ej: Salario mensual" required defaultValue={editingIncome?.name} />
          <Input id="ri_amount" name="amount" type="number" step="0.01" label="Monto" placeholder="0.00" required defaultValue={editingIncome?.amount} />
          <Select id="ri_category_id" name="category_id" label="Categoría" placeholder="Selecciona" required defaultValue={editingIncome?.category_id} options={incomeCategories.map(c => ({ value: c.id, label: c.name }))} />
          <Select id="ri_income_type" name="income_type" label="Tipo de ingreso" required defaultValue={editingIncome?.income_type || 'salary'} options={INCOME_TYPES.map(t => ({ value: t.value, label: t.label }))} onChange={(e) => setIsSalary(e.target.value === 'salary')} />
          <Select id="ri_frequency" name="frequency" label="Frecuencia" required defaultValue={editingIncome?.frequency || 'monthly'} options={[{ value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensual' }, { value: 'yearly', label: 'Anual' }]} />

          {/* Salary-specific interactive section */}
          {isSalary && (
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-primary-600" />
                <p className="text-sm font-bold text-primary-800">Configuración de salario</p>
              </div>
              <div>
                <p className="text-xs font-medium text-primary-700 mb-3">¿Recibes el salario el último día laboral del mes?</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSalaryLastBDay(true)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${salaryLastBDay ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30' : 'bg-white text-dark-600 border-dark-200 hover:border-primary-300'}`}>
                    <CalendarClock className="w-4 h-4" /> Sí, último día laboral
                  </button>
                  <button type="button" onClick={() => setSalaryLastBDay(false)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${!salaryLastBDay ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30' : 'bg-white text-dark-600 border-dark-200 hover:border-primary-300'}`}>
                    <CalendarDays className="w-4 h-4" /> No, otro día
                  </button>
                </div>
              </div>
              {salaryLastBDay ? (
                <div className="bg-white/70 rounded-xl p-3 border border-primary-100">
                  <p className="text-xs text-primary-700">
                    <strong>📅 El salario se registrará automáticamente el último día laboral de cada mes.</strong><br />
                    Este mes ({getMonthName(now.getMonth() + 1)}), el último día laboral es el <strong>día {lastBDay}</strong>.
                  </p>
                </div>
              ) : (
                <Input id="ri_payment_day" name="payment_day" type="number" min={1} max={31} label="¿Qué día del mes recibes el salario?" placeholder="Ej: 15" required defaultValue={editingIncome?.payment_day || ''} hint="Ingresa el día del mes (1-31)" />
              )}
            </div>
          )}

          {/* Non-salary: payment day option */}
          {!isSalary && (
            <Input id="ri_payment_day_other" name="payment_day" type="number" min={1} max={31} label="Día de cobro (opcional)" placeholder="Ej: 1" defaultValue={editingIncome?.payment_day || ''} hint="Día del mes en que se recibe. Déjalo vacío para usar la fecha de inicio." />
          )}

          <Input id="ri_start_date" name="start_date" type="date" label="Fecha de inicio" required defaultValue={editingIncome?.start_date} />
          <Input id="ri_end_date" name="end_date" type="date" label="Fecha de finalización (opcional)" defaultValue={editingIncome?.end_date || ''} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => { setModalOpen(false); setEditingIncome(null); setIsSalary(false); setSalaryLastBDay(true); }}>Cancelar</Button>
            <Button type="submit" fullWidth loading={saving}>{editingIncome ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title={activeTab === 'expenses' ? 'Eliminar gasto recurrente' : 'Eliminar ingreso recurrente'} message="¿Estás seguro?" loading={deleting} />
    </div>
  );
}
