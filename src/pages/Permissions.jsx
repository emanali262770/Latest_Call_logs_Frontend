import { useState } from 'react';
import { 
  Search, 
  Shield, 
  Users, 
  UserCircle, 
  Settings, 
  Check, 
  X
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { cn } from '@/src/lib/utils';

const permissionModules = [
  { 
    id: 'employee', 
    title: 'Employee Management', 
    icon: Users,
    subModules: [
      { id: 'emp_profile', label: 'Profiles', description: 'View and edit employee personal information.' },
      { id: 'emp_payroll', label: 'Payroll', description: 'Access salary, bonuses, and tax documents.' },
      { id: 'emp_leave', label: 'Leave Requests', description: 'Approve or reject vacation and sick leave.' },
    ]
  },
  { 
    id: 'user', 
    title: 'User Management', 
    icon: UserCircle,
    subModules: [
      { id: 'user_accounts', label: 'Accounts', description: 'Create and manage system user accounts.' },
      { id: 'user_sessions', label: 'Sessions', description: 'Monitor active user sessions and login history.' },
    ]
  },
  { 
    id: 'access', 
    title: 'Access Control', 
    icon: Shield,
    subModules: [
      { id: 'access_groups', label: 'Security Groups', description: 'Define roles and group-level permissions.' },
      { id: 'access_audit', label: 'Audit Logs', description: 'Review system-wide security event logs.' },
    ]
  },
  { 
    id: 'system', 
    title: 'System Settings', 
    icon: Settings,
    subModules: [
      { id: 'sys_config', label: 'Configuration', description: 'Global system parameters and integrations.' },
      { id: 'sys_notifications', label: 'Notifications', description: 'Configure email and system alerts.' },
    ]
  },
];

const actions = [
  { id: 'create', label: 'Create', color: 'bg-emerald-500' },
  { id: 'read', label: 'Read', color: 'bg-indigo-500' },
  { id: 'update', label: 'Update', color: 'bg-amber-500' },
  { id: 'delete', label: 'Delete', color: 'bg-rose-500' },
];

export default function Permissions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePermissions, setActivePermissions] = useState({});

  const togglePermission = (subModuleId, actionId) => {
    const current = activePermissions[subModuleId] || [];
    if (current.includes(actionId)) {
      setActivePermissions({
        ...activePermissions,
        [subModuleId]: current.filter(id => id !== actionId)
      });
    } else {
      setActivePermissions({
        ...activePermissions,
        [subModuleId]: [...current, actionId]
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CMS Permission Matrix</h1>
          <p className="text-gray-500 mt-1">Configure granular access levels for each system module.</p>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search modules..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      <Card className="p-0 border-none shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="w-full overflow-hidden rounded-[2rem] border border-gray-100 bg-white/80 backdrop-blur-xl shadow-2xl shadow-gray-200/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 first:rounded-tl-[2rem]">Module / Feature</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Description</th>
                  {actions.map((action) => (
                    <th key={action.id} className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 text-center">
                      {action.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {permissionModules.map((module) => (
                  <optgroup key={module.id} label={module.title}>
                    <tr className="bg-indigo-50/30">
                      <td colSpan={6} className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <module.icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">{module.title}</span>
                        </div>
                      </td>
                    </tr>
                    {module.subModules.map((sub) => (
                      <tr key={sub.id} className="hover:bg-indigo-50/40 transition-all duration-500 group">
                        <td className="px-8 py-6 text-sm text-gray-900 font-bold border-b border-gray-50/30 transition-colors group-hover:text-indigo-600">
                          {sub.label}
                        </td>
                        <td className="px-8 py-6 text-xs text-gray-500 font-medium border-b border-gray-50/30">
                          {sub.description}
                        </td>
                        {actions.map((action) => {
                          const isActive = activePermissions[sub.id]?.includes(action.id);
                          return (
                            <td key={action.id} className="px-6 py-6 text-center border-b border-gray-50/30">
                              <button
                                onClick={() => togglePermission(sub.id, action.id)}
                                className={cn(
                                  "w-10 h-10 mx-auto flex items-center justify-center rounded-2xl transition-all duration-300 active:scale-90 border",
                                  isActive 
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" 
                                    : "bg-white border-gray-100 text-gray-300 hover:border-gray-200 hover:text-gray-400"
                                )}
                              >
                                {isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </optgroup>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-8 flex justify-center z-50">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-100 px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-bold text-gray-700 tracking-tight">You have unsaved changes in the permission matrix.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">Discard</button>
            <button className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
