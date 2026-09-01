'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Filter, TrendingDown, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/actions/expenses';
import { getCategories } from '@/actions/categories';
import type { Expense, Category, FilterParams } from '@/types';
import { EXPENSE_TYPE_LABELS } from '@/lib/constants';
import { formatCurrency, formatDate, getTodayInputDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

function ExpensesContent() {
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterParams>({});
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { success, error: showError, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [expensesRes, catsRes] = await Promise.all([
      getExpenses({ ...filters, page }),
      getCategories('expense'),
    ]);
    if (expensesRes.success && expensesRes.data) {
      setExpenses(expensesRes.data.data);
      setTotalPages(expensesRes.data.totalPages);
    }
    if (catsRes.success && catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') setModalOpen(true);
  }, [searchParams]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = editingExpense
      ? await updateExpense(editingExpense.id, formData)
      : await createExpense(formData);
    if (result.success) {
      success(editingExpense ? 'Gasto actualizado' : 'Gasto registrado');
      setModalOpen(false);
      setEditingExpense(null);
      loadData();
    } else {
      showError(result.error || 'Error');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteExpense(deleteId);
    if (result.success) {
      success('Gasto eliminado');
      setDeleteId(null);
      loadData();
    } else {
      showError(result.error || 'Error');
    }
    setDeleting(false);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Egresos</h1>
          <p className="text-dark-500 text-sm">Administra tus gastos</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Nuevo gasto
        </Button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50 transition-colors">
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl p-4 border border-dark-100 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-slide-down">
          <Input id="startDate" type="date" label="Desde" value={filters.startDate || ''} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          <Input id="endDate" type="date" label="Hasta" value={filters.endDate || ''} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          <Select id="categoryFilter" label="Categoría" value={filters.categoryId || ''} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined })} options={[{ value: '', label: 'Todas' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
          <Select id="typeFilter" label="Tipo" value={filters.expenseType || ''} onChange={(e) => setFilters({ ...filters, expenseType: (e.target.value as 'fixed' | 'variable') || undefined })} options={[{ value: '', label: 'Todos' }, { value: 'fixed', label: 'Fijo' }, { value: 'variable', label: 'Variable' }]} />
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : expenses.length === 0 ? (
        <EmptyState icon={<TrendingDown className="w-8 h-8 text-danger-400" />} title="Sin gastos registrados" description="Registra tus gastos para analizar tu comportamiento financiero." actionLabel="Agregar gasto" onAction={() => { setEditingExpense(null); setModalOpen(true); }} />
      ) : (
        <>
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="bg-white rounded-2xl p-4 border border-dark-100 flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-5 h-5 text-danger-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-900 truncate">{expense.description}</p>
                  <p className="text-xs text-dark-500">
                    {expense.category?.name} · {formatDate(expense.date)} ·{' '}
                    <span className={`font-medium ${expense.expense_type === 'fixed' ? 'text-warning-600' : 'text-purple-600'}`}>
                      {EXPENSE_TYPE_LABELS[expense.expense_type]}
                    </span>
                  </p>
                </div>
                <p className="text-sm font-bold text-danger-600 flex-shrink-0">-{formatCurrency(expense.amount)}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingExpense(expense); setModalOpen(true); }} className="p-2 rounded-xl hover:bg-dark-50 transition-colors">
                    <Edit2 className="w-4 h-4 text-dark-400" />
                  </button>
                  <button onClick={() => setDeleteId(expense.id)} className="p-2 rounded-xl hover:bg-danger-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-xl hover:bg-dark-100 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-sm text-dark-600">Página {page} de {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-xl hover:bg-dark-100 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingExpense(null); }} title={editingExpense ? 'Editar gasto' : 'Nuevo gasto'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="description" name="description" label="Descripción" placeholder="Ej: Compra supermercado" required defaultValue={editingExpense?.description} />
          <Input id="amount" name="amount" type="number" step="0.01" label="Monto" placeholder="0.00" required defaultValue={editingExpense?.amount} />
          <Input id="date" name="date" type="date" label="Fecha" required defaultValue={editingExpense ? editingExpense.date : getTodayInputDate()} />
          <Select id="category_id" name="category_id" label="Categoría" placeholder="Selecciona" required defaultValue={editingExpense?.category_id} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          <Select id="expense_type" name="expense_type" label="Tipo de gasto" placeholder="Selecciona" required defaultValue={editingExpense?.expense_type} options={[{ value: 'fixed', label: 'Fijo' }, { value: 'variable', label: 'Variable' }]} />
          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-medium text-dark-700">Notas (opcional)</label>
            <textarea id="notes" name="notes" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-dark-200 bg-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" defaultValue={editingExpense?.notes || ''} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => { setModalOpen(false); setEditingExpense(null); }}>Cancelar</Button>
            <Button type="submit" fullWidth loading={saving}>{editingExpense ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar gasto" message="¿Estás seguro de que deseas eliminar este gasto?" loading={deleting} />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ExpensesContent />
    </Suspense>
  );
}
