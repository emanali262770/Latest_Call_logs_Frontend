import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  ShieldCheck, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Lock,
  Menu
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'users', label: 'Users', icon: UserCircle },
  { 
    id: 'access-control', 
    label: 'Access Control', 
    icon: ShieldCheck,
    subItems: [
      { id: 'groups', label: 'Groups', icon: Menu },
      { id: 'permissions', label: 'Permissions', icon: Lock },
    ]
  },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsCollapsed }) {
  const sidebarRef = useRef(null);
  const [expandedSubMenu, setExpandedSubMenu] = useState(null);

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: isCollapsed ? 80 : 260,
        duration: 0.4,
        ease: 'power3.inOut',
        overwrite: true
      });
    }
  }, [isCollapsed]);

  const handleNavClick = (id, hasSubItems) => {
    if (hasSubItems) {
      if (isCollapsed) {
        setIsCollapsed(false);
        setExpandedSubMenu(id);
      } else {
        setExpandedSubMenu(expandedSubMenu === id ? null : id);
      }
    } else {
      setActivePage(id);
    }
  };

  return (
    <div 
      ref={sidebarRef}
      style={{ width: isCollapsed ? 80 : 260 }}
      className="h-screen bg-white border-r border-gray-200 flex flex-col overflow-hidden z-50 shrink-0"
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 uppercase">CMS</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center mx-auto">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => handleNavClick(item.id, !!item.subItems)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-[background-color,color] duration-200 group",
                activePage === item.id || (item.subItems?.some(sub => sub.id === activePage))
                  ? "bg-brand-light text-brand" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0",
                activePage === item.id || (item.subItems?.some(sub => sub.id === activePage))
                  ? "text-brand" 
                  : "text-gray-400 group-hover:text-gray-900"
              )} />
              {!isCollapsed && (
                <span className="font-medium flex-1 text-left">{item.label}</span>
              )}
              {!isCollapsed && item.subItems && (
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  expandedSubMenu === item.id && "rotate-90"
                )} />
              )}
            </button>

            <AnimatePresence>
              {!isCollapsed && item.subItems && expandedSubMenu === item.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="ml-9 mt-2 space-y-1 overflow-hidden"
                >
                  {item.subItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActivePage(sub.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-[background-color,color] duration-200",
                        activePage === sub.id 
                          ? "text-brand font-semibold" 
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      {sub.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
