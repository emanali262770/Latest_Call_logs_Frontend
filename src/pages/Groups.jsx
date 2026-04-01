import { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Check, 
  Save,
  Edit2,
  Trash2,
  MoreHorizontal,
  Search,
  Filter
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button, Badge } from '@/src/components/ui/Card';
import { revealForm } from '@/src/animations/gsapAnimations';

const initialGroups = [
  { id: '1', name: 'Super Admin', description: 'Full system access with all permissions.', usersCount: 3, permissionsCount: 124 },
  { id: '2', name: 'HR Manager', description: 'Manage employee profiles, leave requests, and payroll.', usersCount: 8, permissionsCount: 45 },
  { id: '3', name: 'Engineering', description: 'Access to developer tools and project management.', usersCount: 42, permissionsCount: 28 },
  { id: '4', name: 'Marketing', description: 'Access to campaign management and analytics.', usersCount: 15, permissionsCount: 12 },
  { id: '5', name: 'Sales', description: 'Manage leads, customers, and sales reports.', usersCount: 24, permissionsCount: 18 },
];

const modules = [
  { id: 'employee', label: 'Employee Management' },
  { id: 'user', label: 'User Management' },
  { id: 'access', label: 'Access Control' },
  { id: 'settings', label: 'System Settings' },
];

const actions = ['Create', 'Read', 'Update', 'Delete'];

export default function Groups() {
  const [groups] = useState(initialGroups);
  const [showForm, setShowForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const listContainerRef = useRef(null);
  const formContainerRef = useRef(null);

  useEffect(() => {
    revealForm(listContainerRef.current, formContainerRef.current, showForm);
  }, [showForm]);

  const handleAddGroup = () => {
    setSelectedGroup(null);
    setShowForm(true);
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setShowForm(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CMS Security Groups</h1>
          <p className="text-gray-500 mt-1">Define roles and assign permissions to groups.</p>
        </div>
        {!showForm && (
          <Button onClick={handleAddGroup} icon={<Plus className="w-4 h-4" />}>Create Group</Button>
        )}
      </div>

      <div ref={listContainerRef} className="space-y-6">
        <Card className="p-0 border-none shadow-xl shadow-gray-200/50">
          <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search groups by name or description..." 
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" icon={<Filter className="w-4 h-4" />}>Filter</Button>
              <div className="h-6 w-px bg-gray-200"></div>
              <p className="text-sm text-gray-400 font-medium">
                <span className="text-gray-900 font-bold">{groups.length}</span> Security Groups
              </p>
            </div>
          </div>
          
          <div className="w-full overflow-hidden rounded-[2rem] border border-gray-100 bg-white/80 backdrop-blur-xl shadow-2xl shadow-gray-200/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 first:rounded-tl-[2rem]">Group Name</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Description</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Users</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Permissions</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 text-right last:rounded-tr-[2rem]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-6">
                          <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 shadow-inner">
                            <MoreHorizontal className="w-10 h-10" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-bold text-gray-900 tracking-tight">No records found</p>
                            <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">We couldn&apos;t find any security groups matching your current search or filter criteria.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    groups.map((group, rowIdx) => (
                      <tr 
                        key={group.id || rowIdx} 
                        className="hover:bg-indigo-50/40 transition-all duration-500 group relative"
                      >
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
                              <Shield className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-gray-900 tracking-tight">{group.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <p className="line-clamp-1 max-w-xs">{group.description}</p>
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <Badge variant="indigo">{group.usersCount} Users</Badge>
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{group.permissionsCount} Active</span>
                        </td>
                        <td className="px-8 py-7 text-right border-b border-gray-50/30 group-last:border-none">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                            <button 
                              onClick={() => handleEditGroup(group)}
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50 rounded-2xl transition-all duration-300 active:scale-95"
                              title="Edit Group"
                            >
                              <Edit2 className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-white hover:shadow-xl hover:shadow-rose-100/50 rounded-2xl transition-all duration-300 active:scale-95"
                              title="Delete Group"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
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

      <div ref={formContainerRef} className="hidden">
        <div className="bg-white rounded-2xl border-l-[6px] border-indigo-500 shadow-2xl overflow-hidden">
          <div className="p-8 pb-6 flex items-start gap-5">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{selectedGroup ? `Edit Group: ${selectedGroup.name}` : "Create New Security Group"}</h2>
              <p className="text-sm text-gray-500 mt-1">Configure group details and assign granular permissions.</p>
            </div>
          </div>

          <div className="px-8 pb-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2 px-4 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900 tracking-tight">Group Information</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Finance Admin" defaultValue={selectedGroup?.name} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                  <input type="text" placeholder="Briefly describe the role of this group" defaultValue={selectedGroup?.description} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2 px-4 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900 tracking-tight">Permissions Matrix</span>
              </div>
              
              <div className="space-y-3">
                {modules.map((module) => (
                  <div key={module.id} className="grid grid-cols-1 sm:grid-cols-5 items-center p-4 bg-gray-50/50 border border-gray-100 rounded-2xl gap-4">
                    <div className="sm:col-span-1">
                      <span className="text-sm font-bold text-gray-900 tracking-tight">{module.label}</span>
                    </div>
                    <div className="sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {actions.map((action) => (
                        <label key={action} className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input type="checkbox" className="peer sr-only" defaultChecked={selectedGroup?.name === 'Super Admin'} />
                            <div className="w-5 h-5 border-2 border-gray-200 rounded-lg peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all"></div>
                            <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-wider">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowForm(false)}
                className="px-8 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowForm(false)}
                className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <Save className="w-5 h-5" /> Save Group
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
