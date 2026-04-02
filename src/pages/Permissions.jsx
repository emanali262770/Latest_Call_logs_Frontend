import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { AccessControlShell } from '@/src/components/access-control/AccessControlShell';
import { useAccessControl } from '@/src/context/AccessControlContext';

export default function Permissions() {
  const { permissionCatalog } = useAccessControl();
  const [query, setQuery] = useState('');

  const filteredCatalog = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return permissionCatalog;

    return permissionCatalog
      .map((section) => ({
        ...section,
        permissions: section.permissions.filter((permission) =>
          `${permission.subject} ${permission.action} ${permission.key}`.toLowerCase().includes(search),
        ),
      }))
      .filter((section) => section.permissions.length);
  }, [permissionCatalog, query]);

  const totalPermissions = filteredCatalog.reduce((sum, section) => sum + section.permissions.length, 0);

  return (
    <AccessControlShell
      title="Access Control"
      subtitle="Manage groups, permissions, and user assignments."
    >
      <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
        <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-5">
          <div className="rounded-2xl bg-brand-light p-3 text-brand">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Permission Catalog</h2>
            <p className="text-base text-gray-500">Search and review all permission keys available in the system.</p>
          </div>
        </div>

        <div className="space-y-6 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <label className="relative block w-full max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search permission key e.g. ACCESS.USERS.READ"
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </label>
            <p className="text-sm font-medium text-gray-500">{totalPermissions} permissions</p>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {filteredCatalog.map((section) => (
              <div
                key={section.id}
                className="overflow-hidden rounded-[1.6rem] border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-500">{section.permissions.length} permissions</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>

                <div className="max-h-[280px] overflow-auto">
                  {section.permissions.map((permission) => (
                    <div key={permission.id} className="border-b border-gray-100 px-4 py-3 last:border-b-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold uppercase tracking-tight text-gray-700">
                          {permission.subject}
                        </p>
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {permission.action}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-gray-400">{permission.key}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AccessControlShell>
  );
}
