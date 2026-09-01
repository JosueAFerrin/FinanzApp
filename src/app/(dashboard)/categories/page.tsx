'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Tags, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/actions/categories';
import type { Category } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const { success, error: showError, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getCategories();
    if (res.success && res.data) setCategories(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = categories.filter((c) => c.type === activeTab);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = editing ? await updateCategory(editing.id, formData) : await createCategory(formData);
    if (result.success) {
      success(editing ? 'Categoría actualizada' : 'Categoría creada');
      setModalOpen(false);
      setEditing(null);
      loadData();
    } else {
      showError(result.error || 'Error');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteCategory(deleteId);
    if (result.success) {
      success('Categoría eliminada');
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
          <h1 className="text-2xl font-bold text-dark-900">Categorías</h1>
          <p className="text-dark-500 text-sm">Personaliza tus categorías de ingresos y gastos</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Nueva categoría
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('expense')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'expense' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
          <TrendingDown className="w-4 h-4" /> Gastos
        </button>
        <button onClick={() => setActiveTab('income')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'income' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
          <TrendingUp className="w-4 h-4" /> Ingresos
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Tags className="w-8 h-8 text-primary-400" />} title="Sin categorías" description={`No hay categorías de ${activeTab === 'income' ? 'ingresos' : 'gastos'} aún.`} actionLabel="Crear categoría" onAction={() => { setEditing(null); setModalOpen(true); }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl p-4 border border-dark-100 flex items-center justify-between hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.type === 'income' ? 'bg-success-50' : 'bg-danger-50'}`}>
                  {cat.type === 'income' ? <TrendingUp className="w-5 h-5 text-success-600" /> : <TrendingDown className="w-5 h-5 text-danger-600" />}
                </div>
                <span className="text-sm font-semibold text-dark-900">{cat.name}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(cat); setModalOpen(true); }} className="p-2 rounded-xl hover:bg-dark-50"><Edit2 className="w-4 h-4 text-dark-400" /></button>
                <button onClick={() => setDeleteId(cat.id)} className="p-2 rounded-xl hover:bg-danger-50"><Trash2 className="w-4 h-4 text-dark-400" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Editar categoría' : 'Nueva categoría'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="name" name="name" label="Nombre" placeholder="Ej: Alimentación" required defaultValue={editing?.name} />
          <Select id="type" name="type" label="Tipo" required defaultValue={editing?.type || activeTab} options={[{ value: 'income', label: 'Ingreso' }, { value: 'expense', label: 'Gasto' }]} />
          <input type="hidden" name="icon" value={editing?.icon || 'circle-dot'} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => { setModalOpen(false); setEditing(null); }}>Cancelar</Button>
            <Button type="submit" fullWidth loading={saving}>{editing ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar categoría" message="¿Estás seguro? Si la categoría tiene registros asociados, no podrá eliminarse." loading={deleting} />
    </div>
  );
}
