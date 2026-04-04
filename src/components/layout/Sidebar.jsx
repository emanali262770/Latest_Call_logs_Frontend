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
  Building2,
  IdCard,
  Tags,
  Clock3,
  Landmark,
  UsersRound,
  UserCog,
  KeyRound,
  Package,
  Boxes,
  Shapes,
  Factory,
  Ruler,
  MapPin,
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
      { id: 'groups', label: 'Groups', path: '/groups', icon: UsersRound },
      { id: 'users', label: 'Users', path: '/users', icon: UserCog },
      { id: 'permissions', label: 'Permissions', path: '/permissions', icon: KeyRound },
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: Package,
    subItems: [
      {
        id: 'stock-item-definition',
        label: 'Item Definition',
        path: '/stock/item-definition',
        icon: Package,
      },
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    icon: BriefcaseBusiness,
    subItems: [
      {
        id: 'setup-employee-setup',
        label: 'Employee Setup',
        icon: BriefcaseBusiness,
        subItems: [
          { id: 'setup-departments', label: 'Departments', path: '/setup/departments', icon: Building2 },
          { id: 'setup-designations', label: 'Designations', path: '/setup/designations', icon: IdCard },
          { id: 'setup-employee-types', label: 'Employee Types', path: '/setup/employee-types', icon: Tags },
          { id: 'setup-duty-shifts', label: 'Duty Shifts', path: '/setup/duty-shifts', icon: Clock3 },
          { id: 'setup-banks', label: 'Banks', path: '/setup/banks', icon: Landmark },
        ],
      },
      {
        id: 'setup-items',
        label: 'Items',
        icon: Boxes,
        subItems: [
          { id: 'setup-item-types', label: 'Item Types', path: '/setup/items/item-types', icon: Tags },
          { id: 'setup-categories', label: 'Categories', path: '/setup/items/categories', icon: Shapes },
          { id: 'setup-sub-categories', label: 'Sub Categories', path: '/setup/items/sub-categories', icon: Shapes },
          { id: 'setup-manufacturers', label: 'Manufacturers', path: '/setup/items/manufacturers', icon: Factory },
          { id: 'setup-units', label: 'Units', path: '/setup/items/units', icon: Ruler },
          { id: 'setup-locations', label: 'Locations', path: '/setup/items/locations', icon: MapPin },
        ],
      },
    ],
  },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

function attachVisibleSubItems(items = []) {
  return items
    .map((item) => {
      const visibleSubItems = attachVisibleSubItems(item.subItems || []);
      const canAccessDirectPath = item.path ? hasAnyPermission(getReadPermissionsForPath(item.path)) : false;

      if (item.subItems?.length) {
        if (!visibleSubItems.length && !canAccessDirectPath) return null;

        return {
          ...item,
          visibleSubItems,
        };
      }

      return canAccessDirectPath ? { ...item, visibleSubItems: [] } : null;
    })
    .filter(Boolean);
}

function hasActiveDescendant(item, pathName) {
  if (item.path === pathName) return true;
  return item.visibleSubItems?.some((subItem) => hasActiveDescendant(subItem, pathName)) || false;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pathName = location.pathname;
  const visibleNavItems = useMemo(() => attachVisibleSubItems(navItems), []);

  const autoExpandedSubMenu = useMemo(() => {
    const activeTrail = [];

    const walk = (items) => {
      for (const item of items) {
        if (hasActiveDescendant(item, pathName)) {
          activeTrail.push(item.id);
          if (item.visibleSubItems?.length) {
            walk(item.visibleSubItems);
          }
          return true;
        }
      }

      return false;
    };

    walk(visibleNavItems);
    return activeTrail;
  }, [pathName, visibleNavItems]);

  const [manualExpandedSubMenus, setManualExpandedSubMenus] = useState([]);
  const expandedSubMenus = manualExpandedSubMenus.length ? manualExpandedSubMenus : autoExpandedSubMenu;

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: isCollapsed ? 80 : 260,
        duration: 0.4,
        ease: 'power3.inOut',
        overwrite: true,
      });
    }
  }, [isCollapsed]);

  const isItemActive = (item) => hasActiveDescendant(item, pathName);

  const handleNavClick = (item, parentTrail = []) => {
    if (item.visibleSubItems?.length) {
      if (!item.visibleSubItems.length) {
        navigate('/access-denied');
        return;
      }

      if (isCollapsed) {
        setIsCollapsed(false);
        setManualExpandedSubMenus([...parentTrail, item.id]);
      } else {
        const trailToItem = [...parentTrail, item.id];
        const isExpanded = expandedSubMenus.includes(item.id);
        setManualExpandedSubMenus(isExpanded ? parentTrail : trailToItem);
      }

      return;
    }

    if (hasAnyPermission(getReadPermissionsForPath(item.path))) {
      navigate(item.path);
      return;
    }

    navigate('/access-denied');
  };

  const renderSubItems = (items, level = 0, parentTrail = []) => (
    <div
      className={cn(
        level === 0
          ? 'ml-8 mt-2 space-y-1 overflow-hidden border-l border-indigo-100/70 pl-3'
          : 'ml-5 mt-2 space-y-1 overflow-hidden border-l border-indigo-100/70 pl-3',
      )}
    >
      {items.map((sub) => {
        const isExpanded = expandedSubMenus.includes(sub.id);
        const hasChildren = !!sub.visibleSubItems?.length;
        const SubIcon = sub.icon;

        return (
          <div key={sub.id}>
            <button
              type="button"
              onClick={() => handleNavClick(sub, parentTrail)}
              className={cn(
                'group w-full rounded-xl px-3 py-2 text-left text-sm transition-all duration-200',
                isItemActive(sub)
                  ? 'bg-transparent font-semibold text-brand'
                  : 'text-slate-500 hover:bg-indigo-50/50 hover:text-slate-800',
                hasChildren ? 'flex items-center justify-between gap-2' : 'flex items-center gap-2.5',
              )}
            >
              <span className="flex items-center gap-2.5">
                {SubIcon ? (
                  <SubIcon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105',
                      isItemActive(sub) ? 'text-brand' : 'text-gray-400',
                    )}
                  />
                ) : null}
                <span className="font-medium leading-5">{sub.label}</span>
              </span>
              {hasChildren ? (
                <ChevronRight className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', isExpanded && 'rotate-90')} />
              ) : null}
            </button>

            <AnimatePresence>
              {hasChildren && isExpanded && (
                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  {renderSubItems(sub.visibleSubItems, level + 1, [...parentTrail, sub.id])}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      ref={sidebarRef}
      style={{ width: isCollapsed ? 80 : 260 }}
      className="z-50 flex h-screen shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white"
    >
      <div className="px-5 pb-4 pt-5">
        {!isCollapsed ? (
          <div className="rounded-[1.5rem] border border-indigo-100 bg-white px-3.5 py-3 shadow-[0_14px_34px_rgba(79,70,229,0.10)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-brand-hover text-white shadow-[0_12px_24px_rgba(79,70,229,0.35)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block truncate text-xl font-black tracking-tight text-gray-900 uppercase">CMS</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-400">Control Panel</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-brand-hover text-white shadow-[0_12px_24px_rgba(79,70,229,0.35)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        )}
      </div>

      <nav className="mt-2 flex-1 space-y-2 px-4">
        {!isCollapsed ? (
          <div className="px-2 pb-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">Navigation</span>
          </div>
        ) : null}

        {visibleNavItems.map((item) => (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => handleNavClick(item)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 transition-all duration-200',
                isItemActive(item)
                  ? 'border-indigo-200 bg-indigo-50/90 text-brand shadow-[0_10px_26px_rgba(79,70,229,0.10)]'
                  : 'border-transparent text-slate-500 hover:bg-gray-50 hover:text-slate-900',
              )}
            >
              <span
                className={cn(
                  'absolute inset-y-2 left-0 w-1 rounded-r-full transition-all duration-200',
                  isItemActive(item) ? 'bg-brand opacity-100' : 'opacity-0',
                )}
              />
              <item.icon
                className={cn(
                  'relative z-10 h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isItemActive(item) ? 'text-brand' : 'text-gray-400 group-hover:text-gray-700',
                )}
              />
              {!isCollapsed ? (
                <span className="relative z-10 flex-1 text-left font-semibold tracking-tight">{item.label}</span>
              ) : null}
              {!isCollapsed && item.visibleSubItems?.length > 0 ? (
                <ChevronRight
                  className={cn(
                    'relative z-10 h-4 w-4 text-slate-400 transition-transform duration-200',
                    expandedSubMenus.includes(item.id) && 'rotate-90',
                  )}
                />
              ) : null}
            </button>

            <AnimatePresence>
              {!isCollapsed && item.visibleSubItems?.length > 0 && expandedSubMenus.includes(item.id) ? (
                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  {renderSubItems(item.visibleSubItems, 0, [item.id])}
                </Motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white p-2.5 text-gray-500 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all duration-200 hover:bg-gray-50 hover:text-brand"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
