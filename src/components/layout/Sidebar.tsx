import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Wrench,
  TrendingUp,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'inventory', href: '/inventory', icon: Package },
  { name: 'sales', href: '/sales', icon: ShoppingCart },
  { name: 'tickets', href: '/tickets', icon: Wrench },
  { name: 'analytics', href: '/analytics', icon: TrendingUp },
  { name: 'customers', href: '/customers', icon: Users },
  { name: 'reports', href: '/reports', icon: BarChart3 },
  { name: 'settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const { t } = useTranslation();

  return (
    <div className={cn(
      'hidden md:flex md:flex-col md:fixed md:inset-y-0 md:top-16 transition-all duration-200 z-40',
      collapsed ? 'md:w-16' : 'md:w-64'
    )}>
      <div className="flex flex-col flex-grow pt-5 bg-background border-r overflow-y-auto h-full relative">
        <div className={cn('flex flex-col flex-grow', collapsed ? 'px-1' : 'px-4')}>
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      collapsed ? 'justify-center' : ''
                    )
                  }
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', collapsed ? 'mr-0' : 'mr-3')} />
                  {!collapsed && t(`navigation.${item.name}`)}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <button
          className={cn(
            ' -right-3 top-4 z-50 shadow-md border border-border',
            'bg-white/80 dark:bg-muted  p-2 flex items-center justify-center transition-colors',
            'hover:bg-accent focus:outline-none',
            collapsed ? 'md:left-3 md:right-auto' : ''
          )}
          style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}
          aria-label={collapsed ? t('navigation.expand') : t('navigation.collapse')}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}