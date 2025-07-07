import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Wrench,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navigation = [
  { name: 'dashboard', href: '/', icon: LayoutDashboard },
  { name: 'inventory', href: '/inventory', icon: Package },
  { name: 'sales', href: '/sales', icon: ShoppingCart },
  { name: 'tickets', href: '/tickets', icon: Wrench },
  { name: 'analytics', href: '/analytics', icon: TrendingUp },
  { name: 'customers', href: '/customers', icon: Users },
  { name: 'reports', href: '/reports', icon: BarChart3 },
  { name: 'settings', href: '/settings', icon: Settings },
];

export default function MobileSidebar() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-left">
            {t('common.name', 'Inventory System')}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-2 mt-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {t(`navigation.${item.name}`)}
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}