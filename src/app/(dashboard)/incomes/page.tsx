'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, TrendingUp, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getIncomes, createIncome, updateIncome, deleteIncome } from '@/actions/incomes';
import { getCategories } from '@/actions/categories';
import type { Income, Category, FilterParams } from '@/types';
import { INCOME_TYPES } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterParams>({});
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { success, error: showError, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [incomesRes, catsRes] = await Promise.all([
      getIncomes({ ...filters, page }),
      getCategories('income'),
    ]);
    if (incomesRes.success && incomesRes.data) {
      setIncomes(incomesRes.data.data);
      setTotalPages(incomesRes.data.totalPages);
    }
    if (catsRes.success && catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = editingIncome
      ? await updateIncome(editingIncome.id, formData)
      : await createIncome(formData);

    if (result.success) {
      success(editingIncome ? 'Ingreso actualizado' : 'Ingreso creado');
      setModalOpen(false);
      setEditingIncome(null);
      loadData();
    } else {
      showError(result.error || 'Error');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteIncome(deleteId);
    if (result.success) {
      success('Ingreso eliminado');
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
          <h1 className="text-2xl font-bold text-dark-900">Ingresos</h1>
          <p className="text-dark-500 text-sm">Administra tus fuentes de ingresos</p>
        </div>
        <Button onClick={() => { setEditingIncome(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Nuevo ingreso
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50 transition-colors">
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl p-4 border border-dark-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-down">
          <Input id="startDate" type="date" label="Desde" value={filters.startDate || ''} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          <Input id="endDate" type="date" label="Hasta" value={filters.endDate || ''} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          <Select
            id="categoryFilter"
            label="Categoría"
            value={filters.categoryId || ''}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined })}
            options={[{ value: '', label: 'Todas' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <TableSkeleton />
      ) : incomes.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-8 h-8 text-success-400" />}
          title="Sin ingresos registrados"
          description="Comienza agregando tu primer ingreso para llevar un control de tus finanzas."
          actionLabel="Agregar ingreso"
          onAction={() => { setEditingIncome(null); setModalOpen(true); }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {incomes.map((income) => (
              <div key={income.id} className="bg-white rounded-2xl p-4 border border-dark-100 flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-success-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-900 truncate">{income.description}</p>
                  <p className="text-xs text-dark-500">{income.category?.name} · {formatDate(income.date)}</p>
                </div>
                <p className="text-sm font-bold text-success-600 flex-shrink-0">{formatCurrency(income.amount)}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingIncome(income); setModalOpen(true); }} className="p-2 rounded-xl hover:bg-dark-50 transition-colors">
                    <Edit2 className="w-4 h-4 text-dark-400" />
                  </button>
                  <button onClick={() => setDeleteId(income.id)} className="p-2 rounded-xl hover:bg-danger-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-xl hover:bg-dark-100 disabled:opacity-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-dark-600">Página {page} de {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-xl hover:bg-dark-100 disabled:opacity-50 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingIncome(null); }} title={editingIncome ? 'Editar ingreso' : 'Nuevo ingreso'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="description" name="description" label="Descripción" placeholder="Ej: Salario mensual" required defaultValue={editingIncome?.description} />
          <Input id="amount" name="amount" type="number" step="0.01" label="Monto" placeholder="0.00" required defaultValue={editingIncome?.amount} />
          <Input id="date" name="date" type="date" label="Fecha" required defaultValue={editingIncome?.date} />
          <Select id="category_id" name="category_id" label="Categoría" placeholder="Selecciona una categoría" required defaultValue={editingIncome?.category_id} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          <Select id="income_type" name="income_type" label="Tipo" placeholder="Selecciona un tipo" required defaultValue={editingIncome?.income_type} options={INCOME_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-medium text-dark-700">Notas (opcional)</label>
            <textarea id="notes" name="notes" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-dark-200 bg-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Notas adicionales..." defaultValue={editingIncome?.notes || ''} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => { setModalOpen(false); setEditingIncome(null); }}>Cancelar</Button>
            <Button type="submit" fullWidth loading={saving}>{editingIncome ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar ingreso" message="¿Estás seguro de que deseas eliminar este ingreso? Esta acción no se puede deshacer." loading={deleting} />
    </div>
  );
}
