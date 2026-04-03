import { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  BriefcaseBusiness,
  Settings, 
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { getReadPermissionsForPath, hasAnyPermission } from '@/src/lib/auth';
import gsap from 'gsap';
import { AnimatePresence, motion as Motion } from 'motion/react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'employees', label: 'Employees', icon: Users, path: '/employees' },
  { 
    id: 'access-control', 
    label: 'Access Control', 
    icon: ShieldCheck,
    subItems: [
      { id: 'groups', label: 'Groups', path: '/groups' },
      { id: 'users', label: 'Users', path: '/users' },
      { id: 'permissions', label: 'Permissions', path: '/permissions' },
    ]
  },
  {
    id: 'setup',
    label: 'Setup',
    icon: BriefcaseBusiness,
    subItems: [
      { id: 'setup-departments', label: 'Departments', path: '/setup/departments' },
      { id: 'setup-designations', label: 'Designations', path: '/setup/designations' },
      { id: 'setup-employee-types', label: 'Employee Types', path: '/setup/employee-types' },
      { id: 'setup-duty-shifts', label: 'Duty Shifts', path: '/setup/duty-shifts' },
      { id: 'setup-banks', label: 'Banks', path: '/setup/banks' },
    ],
  },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pathName = location.pathname;
  const visibleNavItems = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        visibleSubItems:
          item.subItems?.filter((subItem) => hasAnyPermission(getReadPermissionsForPath(subItem.path))) || [],
      })),
    [],
  );

  const autoExpandedSubMenu = useMemo(
    () =>
      visibleNavItems.find((item) => item.visibleSubItems?.some((sub) => sub.path === pathName))?.id || null,
    [pathName, visibleNavItems],
  );
  const [manualExpandedSubMenu, setManualExpandedSubMenu] = useState(null);
  const expandedSubMenu = manualExpandedSubMenu ?? autoExpandedSubMenu;

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

  const isItemActive = (item) => {
    if (item.visibleSubItems?.length) {
      return item.visibleSubItems.some((sub) => sub.path === pathName);
    }

    return item.path === pathName;
  };

  const handleNavClick = (item) => {
    if (item.subItems?.length) {
      if (!item.visibleSubItems?.length) {
        navigate('/access-denied');
        return;
      }

      if (isCollapsed) {
        setIsCollapsed(false);
        setManualExpandedSubMenu(item.id);
      } else {
        setManualExpandedSubMenu(expandedSubMenu === item.id ? null : item.id);
      }
    } else {
      if (hasAnyPermission(getReadPermissionsForPath(item.path))) {
        navigate(item.path);
        return;
      }

      navigate('/access-denied');
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
        {visibleNavItems.map((item) => (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => handleNavClick(item)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-[background-color,color] duration-200 group",
                isItemActive(item)
                  ? "bg-brand-light text-brand" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0",
                isItemActive(item)
                  ? "text-brand" 
                  : "text-gray-400 group-hover:text-gray-900"
              )} />
              {!isCollapsed && (
                <span className="font-medium flex-1 text-left">{item.label}</span>
              )}
              {!isCollapsed && item.visibleSubItems?.length > 0 && (
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  expandedSubMenu === item.id && "rotate-90"
                )} />
              )}
            </button>

            <AnimatePresence>
              {!isCollapsed && item.visibleSubItems?.length > 0 && expandedSubMenu === item.id && (
                <Motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="ml-9 mt-2 space-y-1 overflow-hidden"
                >
                  {item.visibleSubItems.map((sub) => (
                    <button
                      type="button"
                      key={sub.id}
                      onClick={() => navigate(sub.path)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-[background-color,color] duration-200",
                        pathName === sub.path 
                          ? "text-brand font-semibold" 
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      {sub.label}
                    </button>
                  ))}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
