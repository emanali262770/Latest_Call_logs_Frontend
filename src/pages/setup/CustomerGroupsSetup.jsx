import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Edit2, FolderTree, Plus, Save, Search, Trash2, X } from "lucide-react";
import { Badge, Button, Card } from "@/src/components/ui/Card";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import TableLoader from "@/src/components/ui/TableLoader";
import TablePagination from "@/src/components/ui/TablePagination";
import ThemeToastViewport from "@/src/components/ui/ThemeToastViewport";
import { useThemeToast } from "@/src/hooks/useThemeToast";
import { hasPermission } from "@/src/lib/auth";
import { required } from "@/src/lib/validation";
import { customerGroupService } from "@/src/services/customerGroup.service";

export default function CustomerGroupsSetup() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listError, setListError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [validationError, setValidationError] = useState("");
  const [apiError, setApiError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toasts, toast, removeToast } = useThemeToast();

  const canCreate = hasPermission("INVENTORY.CUSTOMER_GROUP.CREATE");
  const canEdit = hasPermission("INVENTORY.CUSTOMER_GROUP.UPDATE");
  const canDelete = hasPermission("INVENTORY.CUSTOMER_GROUP.DELETE");

  const loadItems = useCallback(async (query = "") => {
    setIsLoading(true);
    setListError("");
    try {
      const response = await customerGroupService.list(query);
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setListError(requestError.message || "Failed to load records.");
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const resetForm = () => {
    setEditingItem(null);
    setName("");
    setStatus("active");
    setValidationError("");
    setApiError("");
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name || "");
    setStatus(item.status || "active");
    setValidationError("");
    setApiError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const error = required(trimmedName, "Group name");

    if (error) {
      setValidationError(error);
      setApiError("Please complete all required fields before saving.");
      return;
    }

    setValidationError("");
    setApiError("");
    setIsSaving(true);

    try {
      if (editingItem) {
        const response = await customerGroupService.update(editingItem.id, {
          name: trimmedName,
          status,
        });
        toast.success("Customer group updated", response?.message || "Customer group updated successfully.");
      } else {
        const response = await customerGroupService.create({
          name: trimmedName,
          status,
        });
        toast.success("Customer group created", response?.message || "Customer group created successfully.");
      }

      closeModal();
      await loadItems(searchQuery.trim());
    } catch (requestError) {
      setApiError(requestError.message || "Unable to save record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      const response = await customerGroupService.remove(deleteTarget.id);
      toast.success("Customer group deleted", response?.message || "Customer group deleted successfully.");
      setDeleteTarget(null);
      await loadItems(searchQuery.trim());
    } catch (requestError) {
      toast.error("Delete failed", requestError.message || "Unable to delete record.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customer Group</h1>
            <p className="mt-1 text-gray-500">Manage customer groups with the same setup flow as customer records.</p>
          </div>
          {canCreate && (
            <Button
              onClick={openAddModal}
              icon={<Plus className="h-4 w-4" />}
              className="bg-brand hover:bg-brand-hover shadow-brand/20"
            >
              Add Group
            </Button>
          )}
        </div>

        <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
          <div className="flex flex-col gap-4 border-b border-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              />
            </div>
            <p className="text-sm font-medium text-gray-400">
              <span className="font-bold text-gray-900">{items.length}</span> Records
            </p>
          </div>

          {listError ? (
            <div className="mx-6 mb-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {listError}
            </div>
          ) : null}

          <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 shadow-2xl shadow-gray-200/30 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 first:rounded-tl-4xl">
                      Group Name
                    </th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                      Status
                    </th>
                    <th className="border-b border-gray-100/60 px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 last:rounded-tr-4xl">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-6 text-center">
                        <TableLoader label="Loading customer groups..." />
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center text-sm font-medium text-gray-400">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr key={item.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                        <td className="border-b border-gray-50/30 px-8 py-6 text-sm font-semibold text-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/10 bg-brand-light text-brand">
                              <FolderTree className="h-4 w-4" />
                            </div>
                            <span className="text-gray-900">{item.name || "-"}</span>
                          </div>
                        </td>
                        <td className="border-b border-gray-50/30 px-8 py-6">
                          <Badge variant={item.status === "active" ? "green" : "gray"}>
                            {item.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="border-b border-gray-50/30 px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit ? (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95"
                                title="Edit"
                              >
                                <Edit2 className="h-4.5 w-4.5" />
                              </button>
                            ) : null}
                            {canDelete ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item)}
                                disabled={isSaving}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95 disabled:opacity-60"
                                title="Delete"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {items.length > 10 ? (
            <div className="px-6 pb-6">
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={items.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                itemLabel="records"
              />
            </div>
          ) : null}
        </Card>
      </div>

      {isModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6">
              <button type="button" className="absolute inset-0 bg-slate-950/48" onClick={closeModal} aria-label="Close modal"></button>
              <div className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-3xl border-l-[6px] border-brand bg-white shadow-2xl shadow-brand/10">
                <div className="flex items-start justify-between gap-4 p-6 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center  shrink-0 justify-center rounded-xl bg-brand-light text-brand">
                      <FolderTree className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-gray-900">
                        {editingItem ? "Edit Customer Group" : "Add Customer Group"}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">Only group name and status are required here.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-10 w-10 rounded-xl text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
                    title="Close"
                  >
                    <X className="mx-auto h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-6 px-6 pb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg border border-brand/10 bg-brand-light/50 px-4 py-2">
                      <div className="h-5 w-1 rounded-full bg-brand"></div>
                      <span className="text-sm font-bold tracking-tight text-gray-900">Group Details</span>
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Group Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(event) => {
                            setName(event.target.value);
                            setValidationError("");
                          }}
                          placeholder="Group name"
                          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 ${validationError && !name.trim() ? "border-rose-400" : "border-gray-200"}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
                        <select
                          value={status}
                          onChange={(event) => setStatus(event.target.value)}
                          className="mt-[2px] h-9 w-full rounded-xl border border-slate-300/80 bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    {validationError ? <p className="text-xs text-rose-600">{validationError}</p> : null}
                  </div>
                  {apiError ? (
                    <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {apiError}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl border border-gray-200 bg-white px-8 py-3 font-bold text-gray-500 transition-all hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3 font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-70"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Customer Group"
        description={deleteTarget ? `Are you sure you want to delete ${deleteTarget.name || "group"}?` : ""}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isSaving}
      />
      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </>
  );
}
