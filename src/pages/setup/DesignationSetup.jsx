import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Edit2, Trash2, X, Save, Building2 } from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Card';
import TableLoader from '@/src/components/ui/TableLoader';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { designationService } from '@/src/services/designation.service';
import { required } from '@/src/lib/validation';
import { hasPermission } from '@/src/lib/auth';

export default function DesignationSetup() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listError, setListError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('active');
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toasts, toast, removeToast } = useThemeToast();

  const canCreate = hasPermission('designations.create');
  const canEdit = hasPermission('designations.update');
  const canDelete = hasPermission('designations.delete');

  const loadItems = useCallback(async (query = '') => {
    setIsLoading(true);
    setListError('');

    try {
      const response = await designationService.list(query);
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setListError(requestError.message || 'Failed to load records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadItems(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, loadItems]);

  const openAddModal = () => {
    setEditingItem(null);
    setValue('');
    setStatus('active');
    setValidationError('');
    setApiError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setValue(item.name || '');
    setStatus(item.status || 'active');
    setValidationError('');
    setApiError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setValue('');
    setStatus('active');
    setValidationError('');
    setApiError('');
  };

  const handleSave = async () => {
    const trimmed = value.trim();
    const nameError = required(trimmed, 'Designation');
    if (nameError) {
      setValidationError(nameError);
      return;
    }

    setValidationError('');
    setApiError('');
    setIsSaving(true);

    try {
      if (editingItem) {
        const response = await designationService.update(editingItem.id, { name: trimmed, status });
        toast.success('Designation updated', response?.message || 'Designation updated successfully.');
      } else {
        const response = await designationService.create({ name: trimmed, status });
        toast.success('Designation created', response?.message || 'Designation created successfully.');
      }

      closeModal();
      await loadItems(searchQuery.trim());
    } catch (requestError) {
      setApiError(requestError.message || 'Unable to save record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsSaving(true);

    try {
      const response = await designationService.remove(deleteTarget.id);
      toast.success('Designation deleted', response?.message || 'Designation deleted successfully.');
      setDeleteTarget(null);
      await loadItems(searchQuery.trim());
    } catch (requestError) {
      toast.error('Delete failed', requestError.message || 'Unable to delete record.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = editingItem ? 'Edit Designation' : 'Add Designation';

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Designation Setup</h1>
            <p className="text-gray-500 mt-1">Manage designations used in employee profiles.</p>
          </div>
          {canCreate && (
            <Button
              onClick={openAddModal}
              icon={<Plus className="w-4 h-4" />}
              className="bg-brand hover:bg-brand-hover shadow-brand/20"
            >
              Add Designation
            </Button>
          )}
        </div>

        <Card className="p-0 border-none shadow-xl shadow-gray-200/50">
          <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <p className="text-sm text-gray-400 font-medium">
              <span className="text-gray-900 font-bold">{items.length}</span> Records
            </p>
          </div>

          {listError && (
            <div className="mx-6 mb-6 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700 font-medium">
              {listError}
            </div>
          )}

          <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 backdrop-blur-xl shadow-2xl shadow-gray-200/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 first:rounded-tl-4xl">
                      Designation Name
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 text-right last:rounded-tr-4xl">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={2} className="px-8 py-6 text-center">
                        <TableLoader label="Loading designation records..." />
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-8 py-20 text-center text-sm text-gray-400 font-medium">
                        No designation records found.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-brand-light/40 transition-all duration-300 group">
                        <td className="px-8 py-6 text-sm text-gray-700 font-semibold border-b border-gray-50/30 group-last:border-none">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center text-brand border border-brand/10">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span className="text-gray-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right border-b border-gray-50/30 group-last:border-none">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && (
                              <button
                                onClick={() => openEditModal(item)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-brand hover:bg-white hover:shadow-xl hover:shadow-brand/20 rounded-2xl transition-all duration-300 active:scale-95"
                                title="Edit"
                              >
                                <Edit2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteTarget(item)}
                                disabled={isSaving}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-white hover:shadow-xl hover:shadow-rose-100/50 rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-60"
                                title="Delete"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {isModalOpen &&
        createPortal(
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-8">
          <button type="button" className="absolute inset-0 bg-slate-950/48" onClick={closeModal} aria-label="Close modal"></button>

          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border-l-[6px] border-brand bg-white shadow-2xl shadow-brand/10">
            <div className="p-8 pb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-brand">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">{modalTitle}</h2>
                  <p className="text-sm text-gray-500 mt-1">Create or update a designation record.</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 mx-auto" />
              </button>
            </div>

            <div className="px-8 pb-8 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 py-2 px-4 bg-brand-light/50 rounded-lg border border-brand/10">
                  <div className="w-1 h-5 bg-brand rounded-full"></div>
                  <span className="text-sm font-bold text-gray-900 tracking-tight">Designation Details</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter designation name"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all"
                  />
                  {validationError && <p className="text-xs text-rose-600">{validationError}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {apiError && (
                <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700 font-medium">
                  {apiError}
                </div>
              )}

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 inline-flex items-center gap-2 disabled:opacity-70"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Designation"
        description={deleteTarget ? `Are you sure you want to delete ${deleteTarget.name || 'designation'}?` : ''}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isSaving}
      />

      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </>
  );
}

