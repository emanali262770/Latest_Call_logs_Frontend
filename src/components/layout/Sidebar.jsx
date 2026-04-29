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
  Building,
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
  Truck,
  ContactRound,
  FolderTree,
  FileBarChart2,
  ClipboardList,
  PackageSearch,
  ReceiptText,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { getReadPermissionsForPath, hasAnyPermission } from '@/src/lib/auth';
import { companyService } from '@/src/services/company.service';
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
      {
        id: 'stock-item-rate',
        label: 'Item Rate',
        path: '/stock/item-rate',
        icon: ReceiptText,
      },
      {
        id: 'stock-estimation',
        label: 'Estimation',
        path: '/stock/estimation',
        icon: ReceiptText,
      },
      {
        id: 'stock-quotation',
        label: 'Quotation',
        path: '/stock/quotation',
        icon: ReceiptText,
      },
      {
        id: 'stock-opening-stock',
        label: 'Opening Stock',
        path: '/stock/opening-stock',
        icon: Boxes,
      },
    ],
  },
  {
    id: 'services-products',
    label: 'Services & Products',
    icon: PackageSearch,
    path: '/services-products',
  },
  {
    id: 'setup',
    label: 'Setup',
    icon: BriefcaseBusiness,
    subItems: [
      {
        id: 'setup-company',
        label: 'Company',
        path: '/setup/company',
        icon: Building,
      },
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
          { id: 'setup-suppliers', label: 'Suppliers', path: '/setup/items/suppliers', icon: Truck },
        ],
      },
      {
        id: 'setup-customers',
        label: 'Customer',
        icon: ContactRound,
        subItems: [
          {
            id: 'setup-customer-records',
            label: 'Customer',
            path: '/setup/customers/customer',
            icon: ContactRound,
          },
          {
            id: 'setup-customer-groups',
            label: 'Group',
            path: '/setup/customers/group',
            icon: FolderTree,
          },
        ],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileBarChart2,
    subItems: [
      {
        id: 'reports-item-report',
        label: 'Item Report',
        path: '/reports/item-report',
        icon: ClipboardList,
      },
    ],
  },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const SIDEBAR_WIDTH = 288;
const SIDEBAR_COLLAPSED_WIDTH = 82;

function attachVisibleSubItems(items = []) {
  return items.map((item) => ({
    ...item,
    visibleSubItems: attachVisibleSubItems(item.subItems || []),
  }));
}

function hasActiveDescendant(item, pathName) {
  if (item.path === pathName) return true;
  return item.visibleSubItems?.some((subItem) => hasActiveDescendant(subItem, pathName)) || false;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const sidebarRef = useRef(null);
  const navRef = useRef(null);
  const brandRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pathName = location.pathname;
  const [, setPermissionsVersion] = useState(0);
  const [brandProfile, setBrandProfile] = useState({
    name: 'CMS',
    subtitle: 'Control Panel',
    logo: '',
  });
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

  const [manualExpandedSubMenus, setManualExpandedSubMenus] = useState(null);
  const manualExpandedForPath = manualExpandedSubMenus?.path === pathName ? manualExpandedSubMenus.value : null;
  const expandedSubMenus = manualExpandedForPath !== null ? manualExpandedForPath : autoExpandedSubMenu;

  const applyBrandProfile = (company) => {
    if (company?.company_name || company?.logo_url) {
      setBrandProfile({
        name: company?.company_name || 'CMS',
        subtitle: 'Control Panel',
        logo: company?.logo_url || '',
      });
      return;
    }

    setBrandProfile({
      name: 'CMS',
      subtitle: 'Control Panel',
      logo: '',
    });
  };

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        duration: 0.36,
        ease: 'power3.inOut',
        overwrite: true,
      });
    }

    if (brandRef.current) {
      gsap.fromTo(
        brandRef.current,
        { scale: 0.985, opacity: 0.92 },
        { scale: 1, opacity: 1, duration: 0.28, ease: 'power2.out', overwrite: true },
      );
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (!navRef.current) return;

    gsap.fromTo(
      navRef.current.querySelectorAll('[data-sidebar-item]'),
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.025, ease: 'power2.out', overwrite: true },
    );
  }, [isCollapsed]);

  useEffect(() => {
    const activeItem = navRef.current?.querySelector('[data-sidebar-active="true"]');
    if (!activeItem) return;

    gsap.fromTo(
      activeItem,
      { scale: 0.985 },
      { scale: 1, duration: 0.24, ease: 'power2.out', overwrite: true },
    );
  }, [pathName]);

  useEffect(() => {
    let isMounted = true;

    const loadBrandProfile = async () => {
      try {
        const response = await companyService.get();
        const company = response?.data;

        if (!isMounted) return;
        applyBrandProfile(company);
      } catch {
        if (!isMounted) return;
        applyBrandProfile(null);
      }
    };

    const handleCompanyProfileUpdated = (event) => {
      if (!isMounted) return;
      applyBrandProfile(event?.detail || null);
    };

    loadBrandProfile();
    window.addEventListener('company-profile-updated', handleCompanyProfileUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('company-profile-updated', handleCompanyProfileUpdated);
    };
  }, []);

  useEffect(() => {
    const handlePermissionsUpdated = () => {
      setPermissionsVersion((version) => version + 1);
    };

    window.addEventListener('auth-permissions-updated', handlePermissionsUpdated);
    window.addEventListener('storage', handlePermissionsUpdated);

    return () => {
      window.removeEventListener('auth-permissions-updated', handlePermissionsUpdated);
      window.removeEventListener('storage', handlePermissionsUpdated);
    };
  }, []);

  const isItemActive = (item) => hasActiveDescendant(item, pathName);

  const handleNavClick = (item, parentTrail = []) => {
    if (item.visibleSubItems?.length) {
      if (!item.visibleSubItems.length) {
        navigate('/access-denied');
        return;
      }

      if (isCollapsed) {
        setIsCollapsed(false);
        setManualExpandedSubMenus({ path: pathName, value: [...parentTrail, item.id] });
      } else {
        const trailToItem = [...parentTrail, item.id];
        const isExpanded = expandedSubMenus.includes(item.id);
        // Use [] (not null) when closing so autoExpandedSubMenu does NOT override
        setManualExpandedSubMenus({ path: pathName, value: isExpanded ? parentTrail : trailToItem });
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
          ? 'ml-6 mt-1.5 space-y-1 overflow-hidden border-l border-slate-200/80 pl-3'
          : 'ml-4 mt-1.5 space-y-1 overflow-hidden border-l border-slate-200/80 pl-3',
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
                'group w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200',
                isItemActive(sub)
                  ? 'bg-white font-semibold text-brand shadow-[0_6px_18px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(79,70,229,0.10)]'
                  : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-[0_5px_14px_rgba(15,23,42,0.05)]',
                hasChildren ? 'flex items-center justify-between gap-2' : 'flex items-center gap-2.5',
              )}
            >
              <span className="flex items-center gap-2.5">
                {SubIcon ? (
                  <SubIcon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors duration-200',
                      isItemActive(sub) ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600',
                    )}
                  />
                ) : null}
                <span className="font-medium leading-5">{sub.label}</span>
              </span>
              {hasChildren ? (
                <ChevronRight className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', isExpanded && 'rotate-90 text-brand')} />
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
      style={{ width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      className="z-50 flex h-screen shrink-0 flex-col overflow-hidden border-r border-slate-200/80 bg-slate-50/95 shadow-[1px_0_0_rgba(15,23,42,0.03)]"
    >
      <div className="border-b border-slate-200/80 bg-white px-4 pb-4 pt-5">
        {!isCollapsed ? (
          <div
            ref={brandRef}
            className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                {brandProfile.logo ? (
                  <img src={brandProfile.logo} alt={brandProfile.name} className="h-full w-full scale-[1.65] object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-xl border border-brand/15 bg-brand-light text-brand">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-black uppercase tracking-tight text-brand">
                  {brandProfile.name}
                </span>
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  {brandProfile.subtitle}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={brandRef}
            className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl"
          >
            {brandProfile.logo ? (
              <img src={brandProfile.logo} alt={brandProfile.name} className="h-full w-full scale-[1.65] object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl border border-brand/15 bg-brand-light text-brand">
                <ShieldCheck className="h-5 w-5" />
              </div>
            )}
          </div>
        )}
      </div>

      <nav ref={navRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.45)_transparent]">
        {!isCollapsed ? (
          <div className="px-2 pb-2 pt-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Navigation</span>
          </div>
        ) : null}

        {visibleNavItems.map((item) => (
          <div key={item.id} data-sidebar-item>
            <button
              type="button"
              title={isCollapsed ? item.label : undefined}
              onClick={() => handleNavClick(item)}
              data-sidebar-active={isItemActive(item) ? 'true' : undefined}
              className={cn(
                'group relative flex h-11 w-full items-center gap-3 rounded-xl border px-2.5 transition-all duration-200',
                isItemActive(item)
                  ? 'border-brand/20 bg-white text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08),inset_0_0_0_1px_rgba(79,70,229,0.08)]'
                  : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-[0_8px_18px_rgba(15,23,42,0.05)]',
                isCollapsed ? 'justify-center px-0' : '',
              )}
            >
              <span
                className={cn(
                  'absolute inset-y-2 left-0 w-1 rounded-r-full transition-all duration-200',
                  isItemActive(item) ? 'bg-brand opacity-100' : 'opacity-0',
                )}
              />
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                  isItemActive(item)
                    ? 'bg-brand text-white shadow-[0_8px_18px_rgba(79,70,229,0.22)]'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-brand-light group-hover:text-brand',
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
              </span>
              {!isCollapsed ? (
                <span className="relative z-10 flex-1 text-left text-[14px] font-semibold tracking-tight">{item.label}</span>
              ) : null}
              {!isCollapsed && item.visibleSubItems?.length > 0 ? (
                <ChevronRight
                  className={cn(
                    'relative z-10 h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-600',
                    expandedSubMenus.includes(item.id) && 'rotate-90 text-brand',
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

      <div className="border-t border-slate-200/80 bg-white p-4">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-brand/20 hover:bg-brand-light/70 hover:text-brand"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
