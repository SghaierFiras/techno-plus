import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import OfflineIndicator from '../common/OfflineIndicator';
import LanguageToggle from '../common/LanguageToggle';
import MobileSidebar from './MobileSidebar';
import { Link } from 'react-router-dom';
import ThemeSwitcher from '../ThemeSwitcher';

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Package className="h-6 w-6" />
            <span className="font-bold">
              {t('common.name', 'Techno Store')}
            </span>
          </Link>
        </div>
        
        {/* Mobile menu and Logo */}
        <div className="flex items-center space-x-4 md:hidden">
          <MobileSidebar />
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">
              {t('common.name', 'Techno Store')}
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {/* Offline/Sync Status */}
          <OfflineIndicator />

          {/* Language toggle */}
          <LanguageToggle />

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link to="/">Logout</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}