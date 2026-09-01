'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Repeat, Edit2, Trash2, ToggleLeft, ToggleRight, CheckCircle2, Zap } from 'lucide-react';
import {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringExpense,
  registerRecurringAsExpense,
} from '@/actions/recurring';
import { getCategories } from '@/actions/categories';
import type { RecurringExpense, Category } from '@/types';
import { FREQUENCY_LABELS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { success, error: showError, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [itemsRes, catsRes] = await Promise.all([getRecurringExpenses(), getCategories('expense')]);
    if (itemsRes.success && itemsRes.data) setItems(itemsRes.data);
    if (catsRes.success && catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.set('is_active', 'true');
    const result = editing ? await updateRecurringExpense(editing.id, formData) : await createRecurringExpense(formData);
    if (result.success) {
      success(editing ? 'Gasto recurrente actualizado' : 'Gasto recurrente creado');
      setModalOpen(false);
      setEditing(null);
      loadData();
    } else {
      showError(result.error || 'Error');
    }
    setSaving(false);
  }

  async function handleToggle(id: string, current: boolean) {
    const result = await toggleRecurringExpense(id, !current);
    if (result.success) {
      success(!current ? 'Activado' : 'Desactivado');
      loadData();
    } else {
      showError(result.error || 'Error');
    }
  }

  async function handleRegisterNow(id: string) {
    setProcessingId(id);
    const result = await registerRecurringAsExpense(id);
    if (result.success) {
      success('Cobro registrado en tus Egresos de este mes');
      loadData();
    } else {
      showError(result.error || 'Error al registrar el cobro');
    }
    setProcessingId(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteRecurringExpense(deleteId);
    if (result.success) {
      success('Eliminado');
      setDeleteId(null);
      loadData();
    } else {
      showError(result.error || 'Error');
    }
    setDeleting(false);
  }

  const totalMonthly = items.filter((i) => i.is_active && i.frequency === 'monthly').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="animate-fade-in space-y-6">
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Gastos recurrentes</h1>
          <p className="text-dark-500 text-sm">Gestiona tus gastos fijos y automatiza o registra cobros</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Nuevo recurrente
        </Button>
      </div>

      {items.length > 0 && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-primary-100">Total mensual recurrente</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonthly)}</p>
          <p className="text-sm text-primary-200 mt-2">{items.filter((i) => i.is_active).length} gastos activos</p>
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <EmptyState icon={<Repeat className="w-8 h-8 text-primary-400" />} title="Sin gastos recurrentes" description="Agrega tus gastos fijos como alquiler, suscripciones, etc." actionLabel="Agregar" onAction={() => { setEditing(null); setModalOpen(true); }} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className={`bg-white rounded-2xl p-4 border border-dark-100 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all ${!item.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button onClick={() => handleToggle(item.id, item.is_active)} className="flex-shrink-0">
                  {item.is_active ? <ToggleRight className="w-8 h-8 text-primary-600" /> : <ToggleLeft className="w-8 h-8 text-dark-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-900 truncate">{item.name}</p>
                  <p className="text-xs text-dark-500">
                    {item.category?.name} · {FREQUENCY_LABELS[item.frequency]} · Desde {formatDate(item.start_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dark-50">
                <p className="text-sm font-extrabold text-danger-600">{formatCurrency(item.amount)}</p>

                {item.is_active && (
                  <button
                    onClick={() => handleRegisterNow(item.id)}
                    disabled={processingId === item.id}
                    title="Registrar cobro manual como egreso este mes"
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    {processingId === item.id ? 'Registrando...' : 'Registrar Cobro'}
                  </button>
                )}

                <div className="flex gap-1">
                  <button onClick={() => { setEditing(item); setModalOpen(true); }} className="p-2 rounded-xl hover:bg-dark-50 transition-colors"><Edit2 className="w-4 h-4 text-dark-400" /></button>
                  <button onClick={() => setDeleteId(item.id)} className="p-2 rounded-xl hover:bg-danger-50 transition-colors"><Trash2 className="w-4 h-4 text-dark-400 hover:text-danger-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Editar recurrente' : 'Nuevo gasto recurrente'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="name" name="name" label="Nombre" placeholder="Ej: Netflix" required defaultValue={editing?.name} />
          <Input id="amount" name="amount" type="number" step="0.01" label="Monto" placeholder="0.00" required defaultValue={editing?.amount} />
          <Select id="category_id" name="category_id" label="Categoría" placeholder="Selecciona" required defaultValue={editing?.category_id} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          <Select id="frequency" name="frequency" label="Frecuencia" required defaultValue={editing?.frequency || 'monthly'} options={[{ value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensual' }, { value: 'yearly', label: 'Anual' }]} />
          <Input id="start_date" name="start_date" type="date" label="Fecha de inicio" required defaultValue={editing?.start_date} />
          <Input id="end_date" name="end_date" type="date" label="Fecha de finalización (opcional)" defaultValue={editing?.end_date || ''} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => { setModalOpen(false); setEditing(null); }}>Cancelar</Button>
            <Button type="submit" fullWidth loading={saving}>{editing ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar gasto recurrente" message="¿Estás seguro?" loading={deleting} />
    </div>
  );
}
