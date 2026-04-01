import { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  Download, 
  Save,
  Calendar,
  ChevronDown,
  Trash2,
  FileText,
  Edit2,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button, Badge } from '@/src/components/ui/Card';
import { revealForm } from '@/src/animations/gsapAnimations';
import { Search } from 'lucide-react';

const initialEmployees = [
  { id: '1', name: 'Sarah Jenkins', designation: 'Senior Product Designer', department: 'Design', status: 'Active', email: 'sarah.j@company.com' },
  { id: '2', name: 'Michael Chen', designation: 'Full Stack Engineer', department: 'Engineering', status: 'Active', email: 'm.chen@company.com' },
  { id: '3', name: 'Emily Rodriguez', designation: 'HR Specialist', department: 'Human Resources', status: 'On Leave', email: 'e.rodriguez@company.com' },
  { id: '4', name: 'David Kim', designation: 'Marketing Manager', department: 'Marketing', status: 'Active', email: 'd.kim@company.com' },
  { id: '5', name: 'Jessica Taylor', designation: 'QA Engineer', department: 'Engineering', status: 'Inactive', email: 'j.taylor@company.com' },
];

export default function Employees() {
  const [employees, setEmployees] = useState(initialEmployees);
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Workforce</h1>
          <p className="text-gray-500 mt-1">Manage and monitor your organization&apos;s human resources.</p>
        </div>
        {!showForm && (
          <div className="flex items-center gap-3">
            <Button variant="outline" icon={<Download className="w-4 h-4" />}>Export Data</Button>
            <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">Add New Employee</Button>
          </div>
        )}
      </div>

      {/* Table View */}
      <div ref={tableContainerRef} className="space-y-6">
        <Card className="p-0 border-none shadow-xl shadow-gray-200/50">
          <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by name, email or department..." 
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" icon={<Filter className="w-4 h-4" />}>Advanced Filter</Button>
              <div className="h-6 w-px bg-gray-200"></div>
              <p className="text-sm text-gray-400 font-medium">
                Showing <span className="text-gray-900 font-bold">{employees.length}</span> results
              </p>
            </div>
          </div>
          <div className="w-full overflow-hidden rounded-[2rem] border border-gray-100 bg-white/80 backdrop-blur-xl shadow-2xl shadow-gray-200/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 first:rounded-tl-[2rem]">Name</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Designation</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Department</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 text-right last:rounded-tr-[2rem]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-6">
                          <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 shadow-inner">
                            <MoreHorizontal className="w-10 h-10" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-bold text-gray-900 tracking-tight">No records found</p>
                            <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">We couldn&apos;t find any employees matching your current search or filter criteria.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employees.map((item, rowIdx) => (
                      <tr 
                        key={item.id || rowIdx} 
                        className="hover:bg-indigo-50/40 transition-all duration-500 group relative"
                      >
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center text-brand font-bold text-xs border border-brand/10">
                              {item.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">{item.name}</p>
                              <p className="text-[11px] text-gray-400 font-medium mt-0.5 font-mono">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          {item.designation}
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          {item.department}
                        </td>
                        <td className="px-8 py-7 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <Badge variant={item.status === 'Active' ? 'green' : item.status === 'On Leave' ? 'yellow' : 'gray'}>
                            {item.status}
                          </Badge>
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
                              onClick={() => setEmployees(employees.filter(e => e.id !== item.id))}
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

      {/* Form View - Refined with Brand Theme */}
      <div ref={formContainerRef} className="hidden">
        <div className="bg-white rounded-3xl border-l-[6px] border-brand shadow-2xl shadow-brand/10 overflow-hidden">
          {/* Form Header */}
          <div className="p-8 pb-6 flex items-start gap-6">
            <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center text-brand shadow-inner">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">New Employee Entry</h2>
              <p className="text-sm text-gray-500 mt-1">Register a new employee into the system database with full details.</p>
            </div>
          </div>

          <div className="px-8 pb-8 space-y-10">
            {/* Section 1: Personal Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2.5 px-5 bg-brand-light/50 rounded-xl border border-brand/10">
                <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                <span className="text-sm font-extrabold text-brand uppercase tracking-wider">Personal Details</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">Employee ID</label>
                  <input type="text" defaultValue="EMP-20260401-1972" readOnly className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-400 focus:outline-none cursor-not-allowed font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Join Date <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <input type="text" defaultValue="04/01/2026" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none" />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Department <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none appearance-none">
                      <option>Select Department</option>
                      <option>Engineering</option>
                      <option>Design</option>
                      <option>HR</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-brand transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Designation</label>
                  <input type="text" placeholder="Enter Designation" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none" />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2.5 px-5 bg-brand-light/50 rounded-xl border border-brand/10">
                <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                <span className="text-sm font-extrabold text-brand uppercase tracking-wider">Contact Information</span>
              </div>

              <div className="flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[240px] space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" placeholder="Enter full name" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none" />
                </div>
                <div className="flex-[1.5] min-w-[320px] space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" placeholder="Enter email address" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none" />
                </div>
                <div className="w-40 space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                  <input type="text" placeholder="Phone" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none" />
                </div>
                <div className="w-44 space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                  <div className="relative group">
                    <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none appearance-none">
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>On Leave</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-brand transition-colors" />
                  </div>
                </div>
                <button className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200 mb-0.5">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-5 py-2.5 border-2 border-brand-light text-brand rounded-xl text-sm font-bold hover:bg-brand-light hover:border-brand/20 transition-all">
                  <Plus className="w-4 h-4" /> Add Field
                </button>
                <button className="px-5 py-2.5 border-2 border-gray-100 text-gray-400 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-600 transition-all">
                  Clear All
                </button>
              </div>
            </div>

            {/* Section 3: Summary */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2.5 px-5 bg-brand-light/50 rounded-xl border border-brand/10">
                <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                <span className="text-sm font-extrabold text-brand uppercase tracking-wider">Financial Summary</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-8 space-y-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Base Salary:</span>
                    <span className="font-bold text-gray-900">PKR 0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Allowances:</span>
                    <div className="flex items-center gap-3">
                      <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <span className="px-3 py-2 text-gray-400 bg-gray-50 border-r border-gray-200 text-xs font-bold">%</span>
                        <input type="text" className="w-14 px-3 py-2 focus:outline-none text-right font-bold text-gray-700" />
                      </div>
                      <span className="text-gray-300 font-bold">or</span>
                      <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <span className="px-3 py-2 text-gray-400 bg-gray-50 border-r border-gray-200 text-xs font-bold">PKR</span>
                        <input type="text" placeholder="0.00" className="w-28 px-3 py-2 focus:outline-none text-right font-bold text-gray-700" />
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200/60"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-extrabold text-gray-900">Net Payable:</span>
                    <span className="text-2xl font-black text-brand">PKR 0.00</span>
                  </div>
                </div>

                <div className="flex flex-col justify-end items-end gap-8">
                  <div className="w-full p-6 border-2 border-dashed border-gray-200 rounded-3xl space-y-3 group hover:border-brand/30 transition-colors cursor-text">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">REMARKS / NOTES</span>
                    <p className="text-lg font-bold text-gray-300 group-hover:text-gray-400 transition-colors">Add any additional notes here...</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowForm(false)}
                      className="px-10 py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 hover:text-gray-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="flex items-center gap-3 px-10 py-4 bg-brand text-white rounded-2xl font-bold hover:bg-brand-hover transition-all shadow-xl shadow-brand/20"
                    >
                      <Save className="w-5 h-5" /> Save Employee
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
