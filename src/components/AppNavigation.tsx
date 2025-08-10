import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Calendar, Users, Settings, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { UserProfile } from '@/types/organization';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppNavigationProps {
  userProfile: UserProfile | null;
  onSettingsClick: () => void;
  onSignOut: () => void;
  children: React.ReactNode;
  topBarContent?: React.ReactNode;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  userProfile,
  onSettingsClick,
  onSignOut,
  children,
  topBarContent
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const navigation = [
    { name: 'Pacientes', href: '/', icon: Users },
    { name: 'Agenda', href: '/appointments', icon: Calendar },
    { name: 'Configurações', href: '#', icon: Settings, action: onSettingsClick },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-dental-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-dental-primary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-dental-primary">DentalCRM</span>
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSidebar}
                className="p-1"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              if (item.action) {
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      item.action();
                      if (isMobile) closeSidebar();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      "text-dental-secondary hover:bg-dental-accent/50 hover:text-dental-primary"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => isMobile && closeSidebar()}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-dental-primary text-white"
                      : "text-dental-secondary hover:bg-dental-accent/50 hover:text-dental-primary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-dental-accent/20">
            <div className="flex items-center gap-3 mb-3">
              <UserAvatar 
                userProfile={userProfile}
                onSettingsClick={onSettingsClick}
                onSignOut={onSignOut}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dental-primary truncate">
                  {userProfile?.name}
                </p>
                <p className="text-xs text-dental-secondary truncate">
                  {userProfile?.organizations?.name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSignOut();
                if (isMobile) closeSidebar();
              }}
              className="w-full justify-start gap-2 text-dental-secondary hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          !isMobile && sidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        {/* Top bar with hamburger menu */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-dental-accent/20">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
              {topBarContent && (
                <div className="text-base font-semibold text-dental-primary">
                  {topBarContent}
                </div>
              )}
            </div>

            {/* Mobile user avatar in top bar */}
            {isMobile && (
              <UserAvatar
                userProfile={userProfile}
                onSettingsClick={onSettingsClick}
                onSignOut={onSignOut}
              />
            )}
          </div>
        </div>

        {/* Page content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};