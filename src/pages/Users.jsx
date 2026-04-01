import { useState, useRef, useEffect } from 'react';
import { 
  UserCircle, 
  Search, 
  Plus, 
  Filter, 
  Lock, 
  User, 
  Save, 
  ChevronDown,
  Edit2,
  Eye,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button, Badge } from '@/src/components/ui/Card';
import { revealForm } from '@/src/animations/gsapAnimations';

const initialUsers = [
  { id: '1', username: 'sjenkins', linkedEmployee: 'Sarah Jenkins', group: 'Admin', status: 'Active', lastLogin: '2 mins ago' },
  { id: '2', username: 'mchen', linkedEmployee: 'Michael Chen', group: 'Developer', status: 'Active', lastLogin: '1 hour ago' },
  { id: '3', username: 'erodriguez', linkedEmployee: 'Emily Rodriguez', group: 'HR Manager', status: 'Active', lastLogin: 'Yesterday' },
  { id: '4', username: 'dkim', linkedEmployee: 'David Kim', group: 'Marketing', status: 'Inactive', lastLogin: '3 days ago' },
  { id: '5', username: 'jtaylor', linkedEmployee: 'Jessica Taylor', group: 'QA', status: 'Active', lastLogin: '5 mins ago' },
];

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const tableContainerRef = useRef(null);
  const formContainerRef = useRef(null);

  useEffect(() => {
    revealForm(tableContainerRef.current, formContainerRef.current, showForm);
  }, [showForm]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Users</h1>
          <p className="text-gray-500 mt-1">Manage user accounts and their access levels.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">Create User</Button>
        )}
      </div>

      <div ref={tableContainerRef} className="space-y-6">
        <Card className="p-0 border-none shadow-xl shadow-gray-200/50">
          <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search users by username or employee..." 
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" icon={<Filter className="w-4 h-4" />}>Filter</Button>
              <div className="h-6 w-px bg-gray-200"></div>
              <p className="text-sm text-gray-400 font-medium">
                <span className="text-gray-900 font-bold">{users.length}</span> Total Users
              </p>
            </div>
          </div>
          <div className="w-full overflow-hidden rounded-[2rem] border border-gray-100 bg-white/80 backdrop-blur-xl shadow-2xl shadow-gray-200/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 first:rounded-tl-[2rem]">Username</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Linked Employee</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Security Group</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Last Login</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 text-right last:rounded-tr-[2rem]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-6">
                          <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 shadow-inner">
                            <MoreHorizontal className="w-10 h-10" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-bold text-gray-900 tracking-tight">No records found</p>
                            <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">We couldn&apos;t find any users matching your current search or filter criteria.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((item, rowIdx) => (
                      <tr 
                        key={item.id || rowIdx} 
                        className="hover:bg-brand-light/40 transition-all duration-500 group relative"
                      >
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center text-brand font-bold text-xs border border-brand/10">
                              {item.username[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900 tracking-tight font-mono">{item.username}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          {item.linkedEmployee}
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <Badge variant="indigo">{item.group}</Badge>
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <Badge variant={item.status === 'Active' ? 'green' : 'red'}>{item.status}</Badge>
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900 font-mono">
                          {item.lastLogin}
                        </td>
                        <td className="px-8 py-7 text-right border-b border-gray-50/30 group-last:border-none">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                            <button 
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-brand hover:bg-white hover:shadow-xl hover:shadow-brand/20 rounded-2xl transition-all duration-300 active:scale-95"
                              title="View Details"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-brand hover:bg-white hover:shadow-xl hover:shadow-brand/20 rounded-2xl transition-all duration-300 active:scale-95"
                              title="Edit Record"
                            >
                              <Edit2 className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              onClick={() => setUsers(users.filter(u => u.id !== item.id))}
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-white hover:shadow-xl hover:shadow-rose-100/50 rounded-2xl transition-all duration-300 active:scale-95"
                              title="Delete Record"
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
        <div className="bg-white rounded-2xl border-l-[6px] border-brand shadow-2xl shadow-brand/10 overflow-hidden">
          <div className="p-8 pb-6 flex items-start gap-5">
            <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-brand">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create New User</h2>
              <p className="text-sm text-gray-500 mt-1">Assign a username and link it to an existing employee profile.</p>
            </div>
          </div>

          <div className="px-8 pb-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2 px-4 bg-brand-light/50 rounded-lg border border-brand/10">
                <div className="w-1 h-5 bg-brand rounded-full"></div>
                <span className="text-sm font-bold text-gray-900 tracking-tight">Account Credentials</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" placeholder="e.g. jdoe" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all" />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none transition-all" />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Link Employee <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none appearance-none transition-all">
                      <option>Select an employee...</option>
                      <option>Sarah Jenkins</option>
                      <option>Michael Chen</option>
                      <option>Emily Rodriguez</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Security Group <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none appearance-none transition-all">
                      <option>Admin</option>
                      <option>Developer</option>
                      <option>HR Manager</option>
                      <option>Marketing</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
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
                className="flex items-center gap-3 px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
              >
                <Save className="w-5 h-5" /> Create User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
