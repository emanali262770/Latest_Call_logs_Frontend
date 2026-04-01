import { useEffect, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { cn } from '@/src/lib/utils';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import gsap from 'gsap';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
];

const deptData = [
  { name: 'Engineering', value: 45, color: '#4f46e5' },
  { name: 'Design', value: 25, color: '#10b981' },
  { name: 'HR', value: 15, color: '#f59e0b' },
  { name: 'Marketing', value: 15, color: '#ef4444' },
];

const stats = [
  { label: 'Total Employees', value: '1,248', change: '+12%', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50', trend: 'up' },
  { label: 'Active Users', value: '842', change: '+5%', icon: UserPlus, color: 'text-emerald-600', bgColor: 'bg-emerald-50', trend: 'up' },
  { label: 'Security Groups', value: '24', change: '0%', icon: Shield, color: 'text-amber-600', bgColor: 'bg-amber-50', trend: 'neutral' },
  { label: 'System Health', value: '99.9%', change: '+0.1%', icon: TrendingUp, color: 'text-rose-600', bgColor: 'bg-rose-50', trend: 'up' },
];

const activities = [
  { id: 1, user: 'Sarah Jenkins', action: 'Created new employee profile', time: '2 mins ago', icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  { id: 2, user: 'System Admin', action: 'Updated security permissions', time: '15 mins ago', icon: Shield, color: 'text-brand', bgColor: 'bg-brand-light' },
  { id: 3, user: 'John Doe', action: 'Failed login attempt detected', time: '1 hour ago', icon: AlertCircle, color: 'text-rose-500', bgColor: 'bg-rose-50' },
  { id: 4, user: 'HR Manager', action: 'Approved leave request', time: '3 hours ago', icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-50' },
];

export default function Dashboard() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states to prevent jumpiness
      gsap.set('.stat-card', { opacity: 0, y: 10 });
      gsap.set('.chart-card', { opacity: 0, y: 10 });
      gsap.set('.activity-item', { opacity: 0, x: 10 });

      gsap.to('.stat-card', {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.05,
        ease: 'power2.out',
        overwrite: true
      });
      
      gsap.to('.chart-card', {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.2,
        ease: 'power2.out',
        overwrite: true
      });

      gsap.to('.activity-item', {
        x: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.05,
        delay: 0.4,
        ease: 'power2.out',
        overwrite: true
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor your system performance and activities.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            Download Report
          </button>
          <button className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20">
            Generate Insights
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="stat-card border border-gray-100 shadow-sm p-6 bg-white hover:border-brand/30 hover:shadow-md transition-[border-color,box-shadow] duration-300">
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                stat.bgColor,
                stat.color
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                stat.trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-500"
              )}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="chart-card border border-gray-100 shadow-sm p-6" title="Growth Analytics" subtitle="Monthly employee registration trends">
            <div className="h-[350px] w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                    dx={-15}
                  />
                  <Tooltip 
                    cursor={{ stroke: 'var(--color-brand)', strokeWidth: 2, strokeDasharray: '5 5' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                      backdropFilter: 'blur(8px)',
                      borderRadius: '12px', 
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }} 
                    itemStyle={{ fontWeight: 900, fontSize: '14px', color: 'var(--color-brand)' }}
                    labelStyle={{ fontWeight: 900, color: '#1e293b', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--color-brand)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="chart-card border border-gray-100 shadow-sm p-6" title="Department Distribution">
              <div className="h-[240px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="chart-card border-none shadow-sm p-6 bg-indigo-600 text-white">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Security Protocol</h3>
                  <p className="text-white/80 mt-2 text-sm">All system modules are currently operating under standard security monitoring.</p>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>System Status</span>
                    <span className="font-bold">Active</span>
                  </div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full mt-2">
                    <div className="bg-white h-full w-3/4 rounded-full"></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card title="Recent Activity" subtitle="Real-time system event log" className="chart-card border border-gray-100 shadow-sm p-6">
          <div className="space-y-6 mt-6">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-item flex gap-4 group cursor-pointer">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                  activity.bgColor,
                  activity.color
                )}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 border-b border-gray-50 pb-4 group-last:border-none">
                  <p className="text-sm font-bold text-gray-900 truncate">{activity.user}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.action}</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">{activity.time}</p>
                </div>
              </div>
            ))}
            <button className="w-full py-2.5 bg-gray-50 rounded-lg text-xs font-bold text-brand hover:bg-brand-light transition-colors mt-2">
              View All Activity
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
